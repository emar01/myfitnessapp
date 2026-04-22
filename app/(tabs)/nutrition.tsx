import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { useAlert } from '@/context/AlertContext';
import NutritionOverview from '@/components/nutrition/NutritionOverview';
import MealSection from '@/components/nutrition/MealSection';
import FoodSearchModal from '@/components/nutrition/FoodSearchModal';
import { FoodLogEntry, FoodItem, MealType } from '@/types';
import { nutritionService } from '@/services/nutritionService';
import { formatDateKey } from '@/utils/dateUtils';
import { workoutService } from '@/services/workoutService';
import { getStravaActivities } from '@/services/stravaService';
import { useFocusEffect, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { UserProfile } from '@/types';

export default function NutritionScreen() {
    const { palette, spacing } = useTheme();
    const { user } = useSession();
    const { showAlert, showConfirm } = useAlert();
    const router = useRouter();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
    const [burnedCalories, setBurnedCalories] = useState(0);
    const [todayActivities, setTodayActivities] = useState<any[]>([]);
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
            const targetKey = formatDateKey(currentDate);
            const todayWorkouts = workouts.filter(w => {
                if (w.status !== 'Completed') return false;
                const d = (w.date as any)?.toDate ? (w.date as any).toDate() : new Date(w.date as any);
                return formatDateKey(d) === targetKey;
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
                // start_date_local is usually "YYYY-MM-DDTHH:MM:SS"
                // We just need the first 10 chars
                return a.start_date_local.startsWith(targetKey);
            });

            const activitiesList: any[] = [];
            const stravaIdsUsed = new Set<string>();

            // 1. Add calories from Strava
            todayStrava.forEach(a => {
                stravaIdsUsed.add(a.id.toString());
                let aCalories = 0;
                const movingMinutes = a.moving_time / 60;
                
                if (a.calories && a.calories > 1) {
                    // Use Strava's calories if explicitly provided and > 1
                    aCalories = a.calories;
                } else {
                    // Calorie data missing or 0, estimate based on time/type or kJ
                    let multiplier = 8; // Default
                    const type = a.type.toLowerCase();
                    if (type.includes('run')) multiplier = 12;
                    if (type.includes('ride') || type.includes('cycle')) multiplier = 14; 
                    if (type.includes('walk')) multiplier = 4;
                    
                    const estimatedFromTime = movingMinutes * multiplier;
                    const kJ = a.kilojoules || 0;
                    
                    // We take the MAX of Work(kJ) and time-based estimation
                    // In cycling, 1 kJ is approx 1 kcal. 
                    // If Strava says 771 kJ for 2 hours, it's very low, so 128min * 14kcal/min = 1792 will win.
                    aCalories = Math.max(kJ, estimatedFromTime);
                }
                
                burned += aCalories;
                activitiesList.push({
                    id: a.id.toString(),
                    name: a.name,
                    calories: Math.round(aCalories),
                    type: 'strava',
                    debug: `Tid: ${Math.round(movingMinutes)}m, kJ: ${Math.round(a.kilojoules || 0)}, c: ${Math.round(a.calories || 0)}, type: ${a.type}`
                });
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

                let wCalories = 0;
                if (w.duration) {
                    wCalories = (w.duration / 60) * multiplier;
                } else {
                    wCalories = 300;
                }
                
                burned += wCalories;
                activitiesList.push({
                    id: w.id || Math.random().toString(),
                    name: w.name || w.workoutTitle || 'Träningspass',
                    calories: Math.round(wCalories),
                    type: 'local'
                });
            });

            setBurnedCalories(Math.round(burned));
            setTodayActivities([...activitiesList]);

            // Calculate totals and save daily summary
            const eaten = logs.reduce((sum, log) => sum + log.calories, 0);
            const macros = logs.reduce((acc, log) => ({
                protein: acc.protein + (log.protein || 0),
                carbs: acc.carbs + (log.carbs || 0),
                fat: acc.fat + (log.fat || 0),
                fiber: acc.fiber + (log.fiber || 0),
            }), { protein: 0, carbs: 0, fat: 0, fiber: 0 });

            // Saving daily summary so statistics can be viewed later
            await nutritionService.saveDailySummary(user.uid, currentDate, {
                consumedCalories: eaten,
                burnedCalories: Math.round(burned),
                dailyGoal: calculatedGoal,
                protein: macros.protein,
                carbs: macros.carbs,
                fat: macros.fat,
                fiber: macros.fiber
            });

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
            showAlert("Fel", "Kunde inte lägga till maten.");
        }
    };

    const handleDeleteEntry = async (entry: FoodLogEntry) => {
        if (!user || !entry.id) return;

        const confirmed = await showConfirm(
            "Ta bort logg",
            `Vill du ta bort ${entry.foodName}?`,
            { isDestructive: true, confirmText: 'Ta bort' }
        );

        if (!confirmed) return;

        try {
            await nutritionService.deleteFoodLog(user.uid, entry.id);
            loadData();
        } catch (error) {
            showAlert("Fel", 'Kunde inte ta bort matvaran.');
        }
    };

    const handleEntryPress = (entry: FoodLogEntry) => {
        // No-op for now - delete is via swipe
    };

    const openSearchForMeal = (meal: MealType) => {
        setSelectedMeal(meal);
        setModalVisible(true);
    };

    const handlePrevDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        // Prevent going into the future if you don't want to? We allow it for planning.
        setCurrentDate(newDate);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setCurrentDate(selectedDate);
        }
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' });
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
                <TouchableOpacity onPress={handlePrevDay} style={styles.dateControl}>
                    <FontAwesome name="chevron-left" size={16} color={palette.text.primary} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateSelector}>
                    <Text style={[styles.headerTitle, { color: palette.text.primary, textTransform: 'capitalize' }]}>
                        {isToday(currentDate) ? 'Idag' : formatDate(currentDate)}
                    </Text>
                    <FontAwesome name="calendar" size={14} color={palette.text.secondary} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNextDay} style={styles.dateControl}>
                    <FontAwesome name="chevron-right" size={16} color={palette.text.primary} />
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={currentDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}

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
                    activities={todayActivities}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateControl: {
        padding: 8,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
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
