import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import NutritionOverview from '@/components/nutrition/NutritionOverview';
import MealSection from '@/components/nutrition/MealSection';
import FoodSearchModal from '@/components/nutrition/FoodSearchModal';
import { FoodLogEntry, FoodItem, MealType } from '@/types';
import { nutritionService } from '@/services/nutritionService';
import { workoutService } from '@/services/workoutService';
import { getStravaActivities } from '@/services/stravaService';
import { useFocusEffect, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { UserProfile } from '@/types';

export default function NutritionScreen() {
    const { palette, spacing } = useTheme();
    const { user } = useSession();
    const router = useRouter();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
    const [burnedCalories, setBurnedCalories] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);

    const [dailyGoal, setDailyGoal] = useState(2000);
    const [macroGoals, setMacroGoals] = useState({ protein: 150, carbs: 200, fat: 70, fiber: 30 });
    const [missingProfileData, setMissingProfileData] = useState(false);

    const loadData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch food logs
            const logs = await nutritionService.getFoodLogsByDate(user.uid, currentDate);
            setFoodLogs(logs);

            // Fetch profile for calorie goal
            const profileRef = doc(db, 'users', user.uid);
            const profileSnap = await getDoc(profileRef);
            let calculatedGoal = 2000;
            if (profileSnap.exists()) {
                const profile = profileSnap.data() as UserProfile;
                if (profile.dailyCalorieGoal) {
                    calculatedGoal = profile.dailyCalorieGoal;
                    setMissingProfileData(false);
                } else if (profile.weight && profile.height && profile.age) {
                    // Mifflin-St Jeor
                    let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
                    if (profile.gender === 'Kvinna') {
                        bmr -= 161;
                    } else if (profile.gender === 'Man') {
                        bmr += 5;
                    } else {
                        bmr -= 78; // average
                    }
                    calculatedGoal = Math.round(bmr * 1.2); // Sedentary as base
                    setMissingProfileData(false);
                } else {
                    setMissingProfileData(true);
                }
            } else {
                setMissingProfileData(true);
            }
            setDailyGoal(calculatedGoal);
            
            // Standard macro distribution: 30% protein, 40% carbs, 30% fat
            setMacroGoals({
                protein: Math.round((calculatedGoal * 0.3) / 4),
                carbs: Math.round((calculatedGoal * 0.4) / 4),
                fat: Math.round((calculatedGoal * 0.3) / 9),
                fiber: 30
            });

            // Fetch workouts for today to calculate burned calories
            // Since we don't have a direct "getWorkoutsByDate", we fetch all and filter or assume workoutService.getUserWorkouts
            const workouts = await workoutService.getUserWorkouts(user.uid);
            const todayWorkouts = workouts.filter(w => {
                if (w.status !== 'Completed') return false;
                const date = (w.date as any)?.toDate ? (w.date as any).toDate() : new Date(w.date as any);
                return date.getDate() === currentDate.getDate() &&
                       date.getMonth() === currentDate.getMonth() &&
                       date.getFullYear() === currentDate.getFullYear();
            });

            // Calculate burned calories using Strava and local workouts
            let burned = 0;
            let stravaActivities: any[] = [];
            
            try {
                // Try fetching Strava activities (will throw if not connected)
                stravaActivities = await getStravaActivities(user.uid, 1, 30);
            } catch (e) {
                // Not connected to Strava or error, that's fine
            }

            const todayStrava = stravaActivities.filter(a => {
                const date = new Date(a.start_date);
                return date.getDate() === currentDate.getDate() &&
                       date.getMonth() === currentDate.getMonth() &&
                       date.getFullYear() === currentDate.getFullYear();
            });

            const stravaIdsUsed = new Set<string>();

            // 1. Add calories from Strava
            todayStrava.forEach(a => {
                stravaIdsUsed.add(a.id.toString());
                if (a.calories) {
                    burned += a.calories;
                } else if (a.kilojoules) {
                    burned += a.kilojoules * 0.239006;
                } else {
                    burned += (a.moving_time / 60) * 10; // Fallback
                }
            });

            // 2. Add calories from local workouts that are NOT from Strava
            todayWorkouts.forEach(w => {
                if (w.stravaActivityId && stravaIdsUsed.has(w.stravaActivityId)) {
                    // Already counted via Strava
                    return;
                }
                
                // Manual workout fallback multipliers
                let multiplier = 10;
                if (w.category === 'styrketräning') multiplier = 6; 
                if (w.category === 'rörlighet') multiplier = 4;

                if (w.duration) {
                    burned += (w.duration / 60) * multiplier;
                } else {
                    burned += 300;
                }
            });

            setBurnedCalories(Math.round(burned));
        } catch (error) {
            console.error("Failed to load nutrition data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user, currentDate]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleAddFood = async (foodItem: FoodItem, amount: number) => {
        if (!user || !selectedMeal) return;
        
        const newEntry: Omit<FoodLogEntry, 'id' | 'userId'> = {
            date: currentDate,
            mealType: selectedMeal,
            foodItemId: foodItem.id,
            foodName: foodItem.name,
            calories: (foodItem.calories * amount),
            protein: (foodItem.protein || 0) * amount,
            carbs: (foodItem.carbs || 0) * amount,
            fat: (foodItem.fat || 0) * amount,
            fiber: (foodItem.fiber || 0) * amount,
            amountConsumed: amount,
            servingUnit: foodItem.servingUnit,
        };

        try {
            await nutritionService.logFood(user.uid, newEntry);
            setModalVisible(false);
            loadData(); // Refresh list
        } catch (error) {
            alert("Kunde inte lägga till maten.");
        }
    };

    const handleDeleteEntry = async (entry: FoodLogEntry) => {
        if (!user || !entry.id) return;
        try {
            await nutritionService.deleteFoodLog(user.uid, entry.id);
            loadData();
        } catch (error) {
            alert('Kunde inte ta bort matvaran.');
        }
    };

    const handleEntryPress = (entry: FoodLogEntry) => {
        // No-op for now - delete is via swipe
    };

    const openSearchForMeal = (meal: MealType) => {
        setSelectedMeal(meal);
        setModalVisible(true);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: palette.background.default, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={palette.primary.main} />
            </SafeAreaView>
        );
    }

    const eaten = foodLogs.reduce((sum, log) => sum + log.calories, 0);
    const macros = foodLogs.reduce((acc, log) => ({
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fat: acc.fat + (log.fat || 0),
        fiber: acc.fiber + (log.fiber || 0),
    }), { protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const getEntriesForMeal = (meal: MealType) => foodLogs.filter(log => log.mealType === meal);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background.default }]}>
            <View style={[styles.header, { backgroundColor: palette.background.paper }]}>
                <Text style={[styles.headerTitle, { color: palette.text.primary }]}>Journal</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.m }}>
                {missingProfileData && (
                    <View style={[styles.warningBanner, { backgroundColor: palette.status.warning + '20', borderColor: palette.status.warning }]}>
                        <FontAwesome name="exclamation-circle" size={24} color={palette.status.warning} style={{ marginRight: 12, marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: palette.text.primary, fontSize: 14 }}>
                                Din profil saknar längd, vikt eller ålder för att beräkna ett exakt kalorimål.
                            </Text>
                            <TouchableOpacity onPress={() => router.push('/settings/profile')} style={{ marginTop: 6 }}>
                                <Text style={{ color: palette.primary.main, fontWeight: 'bold' }}>
                                    Fyll i din profil här
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <NutritionOverview 
                    dailyGoal={dailyGoal}
                    eaten={eaten}
                    burned={burnedCalories}
                    macros={macros}
                    macroGoals={macroGoals}
                />

                <MealSection
                    title="Frukost"
                    icon="coffee"
                    entries={getEntriesForMeal('Frukost')}
                    targetCalories={Math.round(dailyGoal * 0.25)}
                    onAddPress={() => openSearchForMeal('Frukost')}
                    onEntryPress={handleEntryPress}
                    onDeleteEntry={handleDeleteEntry}
                />
                
                <MealSection
                    title="Lunch"
                    icon="cutlery"
                    entries={getEntriesForMeal('Lunch')}
                    targetCalories={Math.round(dailyGoal * 0.35)}
                    onAddPress={() => openSearchForMeal('Lunch')}
                    onEntryPress={handleEntryPress}
                    onDeleteEntry={handleDeleteEntry}
                />

                <MealSection
                    title="Middag"
                    icon="glass"
                    entries={getEntriesForMeal('Middag')}
                    targetCalories={Math.round(dailyGoal * 0.30)}
                    onAddPress={() => openSearchForMeal('Middag')}
                    onEntryPress={handleEntryPress}
                    onDeleteEntry={handleDeleteEntry}
                />

                <MealSection
                    title="Mellanmål"
                    icon="apple"
                    entries={getEntriesForMeal('Mellanmål')}
                    targetCalories={Math.round(dailyGoal * 0.10)}
                    onAddPress={() => openSearchForMeal('Mellanmål')}
                    onEntryPress={handleEntryPress}
                    onDeleteEntry={handleDeleteEntry}
                />
            </ScrollView>

            <FoodSearchModal 
                visible={modalVisible}
                mealType={selectedMeal}
                onClose={() => setModalVisible(false)}
                onAddFood={handleAddFood}
                searchFoods={async (query) => {
                    // Injecting user.uid as the second param
                    return nutritionService.searchFoods(query, user?.uid || '');
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    warningBanner: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
        alignItems: 'flex-start',
    }
});
