import DayCard, { DayCardType } from '@/components/DayCard';
import StravaSyncModal from '@/components/StravaSyncModal';
import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { db } from '@/lib/firebaseConfig';
import { Program, Workout } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Helper to get week dates based on a reference date
export const getWeekDates = (referenceDate: Date = new Date()) => {
    const curr = new Date(referenceDate);
    const week = [];
    // Ensure we start on Monday
    const p = curr.getDate() - curr.getDay() + 1;
    // If today is Sunday (0), day is 0. 1-0+1 = 2 (Tuesday?) - wait.
    // JS: Sunday=0, Monday=1...Saturday=6.
    // If Sunday (0): getDate() - 0 + 1 => Next day? No.
    // We want previous Monday.
    // If Sunday: setDate(getDate() - 6)

    // Correct simpler math for Monday start:
    const day = curr.getDay() || 7; // M=1, Su=7
    if (day !== 1) {
        curr.setHours(-24 * (day - 1));
    } else {
        // already monday
    }

    // Reset to midnight
    curr.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
        const next = new Date(curr);
        next.setDate(curr.getDate() + i);
        week.push(next);
    }
    return week;
};

// Types for the FlatList
export type ListItem =
    | { type: 'header'; id: string; dayName: string; dateLabel: string; dateObj: Date }
    | { type: 'workout'; id: string; workout: Workout; };

export default function MobileHome() {
    const router = useRouter();
    const { user, signOut, isLoading: sessionLoading } = useSession();
    const [dailyProgram, setDailyProgram] = useState<Program | null>(null);
    const [listData, setListData] = useState<ListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isStravaModalVisible, setStravaModalVisible] = useState(false);

    useEffect(() => {
        if (!sessionLoading) {
            if (!user) {
                // Redirect to login if no user session
                // router.replace('/login'); // Handled by ProtectedLayout now
            } else {
                fetchData();
            }
        }
    }, [user, sessionLoading, currentDate]);

    const handleSignOut = () => {
        Alert.alert(
            'Logga ut',
            `Är du säker på att du vill logga ut från ${user?.email}?`,
            [
                { text: 'Avbryt', style: 'cancel' },
                {
                    text: 'Logga ut',
                    style: 'destructive',
                    onPress: () => {
                        signOut();
                        // router.replace('/login'); // Handled by ProtectedLayout
                    }
                }
            ]
        );
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Daily Program
            const qDaily = query(collection(db, 'programs'), where('type', '==', 'daily'), limit(1));
            const dailySnap = await getDocs(qDaily);
            if (!dailySnap.empty) {
                setDailyProgram({ id: dailySnap.docs[0].id, ...dailySnap.docs[0].data() } as Program);
            }

            // 2. Fetch User's Workouts (Only if user exists)
            let workouts: Workout[] = [];
            if (user) {
                // Fetch ALL workouts to ensure nothing is missed due to date logic
                const userWorkoutsRef = collection(db, 'users', user.uid, 'workouts');
                const qWorkouts = query(userWorkoutsRef);

                try {
                    const wSnap = await getDocs(qWorkouts);
                    workouts = wSnap.docs.map(d => ({ id: d.id, ...d.data() } as Workout));
                } catch (err) {
                    // console.error("Error fetching workouts query", err);
                }
            }

            // 3. Construct List Data
            const dates = getWeekDates(currentDate);
            const newList: ListItem[] = [];

            dates.forEach(date => {
                // Create Header
                const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
                const dateLabel = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
                const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

                // Push Header
                newList.push({
                    type: 'header',
                    id: `header-${dateStr}`,
                    dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                    dateLabel,
                    dateObj: date
                });

                // Find workouts for this date
                const daysWorkouts = workouts.filter(w => {
                    if (!w.scheduledDate) return false;
                    const wDate = w.scheduledDate instanceof Date ? w.scheduledDate : (w.scheduledDate as any).toDate();
                    return wDate.getFullYear() === date.getFullYear() &&
                        wDate.getMonth() === date.getMonth() &&
                        wDate.getDate() === date.getDate();
                });

                daysWorkouts.forEach(w => {
                    newList.push({ type: 'workout', id: w.id!, workout: w });
                });
            });

            setListData(newList);

        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };



    const changeWeek = (direction: 'next' | 'prev') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const renderDailyCard = () => {
        // Only show daily card on "Today's" week? Or always?
        // Let's hide it if looking at past/future to save space, or keep it. Keeping for now.
        if (!dailyProgram) return null;
        return (
            <View style={{ paddingHorizontal: Spacing.m, paddingTop: Spacing.m }}>
                <TouchableOpacity
                    style={styles.dailyCard}
                    onPress={() => router.push({ pathname: '/program/[id]', params: { id: dailyProgram.id! } })}
                >
                    <View style={styles.dailyContent}>
                        <Text style={styles.dailyLabel}>DAGENS PASS</Text>
                        <Text style={styles.dailyTitle}>{dailyProgram.title}</Text>
                        <Text style={styles.dailySubtitle}>{dailyProgram.duration || 'N/A'} • {dailyProgram.category || 'General'}</Text>
                    </View>
                    <View style={styles.dailyIcon}>
                        <Ionicons name="flame" size={32} color="#FFF" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>Mitt Schema</Text>
            </View>
        );
    };

    const renderStartWorkoutButton = () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
                onPress={() => setStravaModalVisible(true)}
                style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
            >
                <Ionicons name="sync" size={20} color="#FC4C02" />
                {/* <Text style={{ fontSize: Typography.size.s, color: Palette.text.secondary, marginLeft: 4 }}>Synka</Text> */}
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => router.push({ pathname: '/workout/log', params: { workoutName: 'New Workout' } })}
                style={{ flexDirection: 'row', alignItems: 'center' }}
            >
                <Ionicons name="add" size={20} color={Palette.text.secondary} />
                <Text style={{ fontSize: Typography.size.s, color: Palette.text.secondary, marginLeft: 4 }}>Lägg till pass</Text>
            </TouchableOpacity>
        </View>
    );

    const renderHeader = () => {
        // Calculate week range string
        const start = listData.find(i => i.type === 'header')?.dateObj || currentDate;
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const monthNames = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
        const rangeStr = `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]}`;

        return (
            <View>
                {/* Remove Daily Card for now based on design request focus */}
                {/* {renderDailyCard()} */}

                {/* Custom Header Layout matching image */}
                <View style={styles.weekControlHeader}>
                    <Text style={styles.weekRangeText}>{rangeStr}</Text>

                    <View style={styles.weekBadgeContainer}>
                        <TouchableOpacity onPress={() => changeWeek('prev')}>
                            <Ionicons name="chevron-back" size={16} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.weekBadgeText}>Vecka {getScaleWeekNumber(currentDate)}</Text>
                        <TouchableOpacity onPress={() => changeWeek('next')}>
                            <Ionicons name="chevron-forward" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {renderStartWorkoutButton()}
                </View>
            </View>
        )
    }

    const renderItem = useCallback(({ item }: { item: ListItem }) => {
        if (item.type === 'header') {
            return (
                <View style={styles.dayHeader}>
                    <Text style={styles.dayHeaderText}>{item.dayName}</Text>
                    <Text style={styles.dayDateText}>{item.dateLabel}</Text>
                </View>
            );
        }

        // Workout Item
        return (
            <View style={styles.itemContainer}>
                <DayCard
                    day="" // Hidden in list view as header handles it
                    date=""
                    title={item.workout.name}
                    type={item.workout.category === 'löpning' ? (item.workout.subcategory as DayCardType || 'distans') : (item.workout.category === 'styrketräning' ? (item.workout.subcategory as DayCardType || 'styrka') : 'rest')}
                    // @ts-ignore
                    status={item.workout.status === 'Completed' ? 'completed' : 'pending'}
                    onPress={() => router.push({ pathname: '/workout/[id]', params: { id: item.workout.id!, title: item.workout.name, status: item.workout.status === 'Completed' ? 'completed' : 'planned' } })}
                />
            </View>
        );
    }, [user, currentDate]);

    const weekNumber = getScaleWeekNumber(currentDate);

    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView style={styles.safeArea}>
                {/* Main App Header */}
                <View style={styles.mainHeader}>
                    <Text style={styles.mainHeaderTitle}>MyFitness</Text>
                    <TouchableOpacity onPress={handleSignOut} style={styles.mainHeaderProfile}>
                        <Ionicons name="person-circle" size={32} color={Palette.primary.main} />
                    </TouchableOpacity>
                </View>

                {/* Week Navigation Header - REMOVED / MERGED into ListHeader */}
                {/* 
                <View style={styles.header}>
                    ...
                </View> 
                */}

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={Palette.primary.main} />
                    </View>
                ) : (
                    <FlatList
                        data={listData}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        ListHeaderComponent={renderHeader}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )}
            </SafeAreaView>
            <StravaSyncModal
                visible={isStravaModalVisible}
                onClose={() => setStravaModalVisible(false)}
                userId={user?.uid || ''}
            />
        </View>
    );
}

// Simple week number helper
function getScaleWeekNumber(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Palette.background.default,
    },
    mainHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        backgroundColor: Palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
    },
    mainHeaderTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.primary.main,
    },
    mainHeaderProfile: {
        padding: Spacing.s,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.m,
        backgroundColor: Palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
    },
    headerTitle: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    headerSubtitle: {
        fontSize: 10,
        color: Palette.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    profileIcon: {
        padding: Spacing.s,
    },
    sectionTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        marginBottom: Spacing.m,
        marginTop: Spacing.s,
        color: Palette.text.primary,
    },

    // Daily Card
    dailyCard: {
        backgroundColor: Palette.primary.main,
        borderRadius: BorderRadius.l,
        padding: Spacing.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.l,
        ...Shadows.medium,
    },
    dailyContent: { flex: 1 },
    dailyLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: Typography.size.xs,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    dailyTitle: {
        color: '#FFF',
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    dailySubtitle: { color: '#FFF', fontSize: Typography.size.s },
    dailyIcon: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },

    // List Items
    dayHeader: {
        paddingHorizontal: Spacing.m,
        paddingTop: Spacing.m,
        paddingBottom: Spacing.xs,
        marginTop: 0,
    },
    dayHeaderText: {
        fontSize: Typography.size.s,
        color: Palette.text.primary,
        fontWeight: 'normal',
    },
    dayDateText: {
        display: 'none', // Hide specific date label if only DayName is desired like "Måndag"
    },
    itemContainer: {
        paddingHorizontal: Spacing.m,
    },

    // New Header Styles
    weekControlHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.m,
    },
    weekRangeText: {
        fontSize: Typography.size.xs,
        color: Palette.text.secondary,
    },
    weekBadgeContainer: {
        backgroundColor: '#C5A898', // Brownish/Beige color from image
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    weekBadgeText: {
        color: '#FFF',
        fontSize: Typography.size.s,
        fontWeight: 'bold',
    },
});
