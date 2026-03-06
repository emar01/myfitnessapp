import DayCard, { DayCardType } from '@/components/DayCard';
import StravaActivityPicker from '@/components/StravaActivityPicker';
import WorkoutTypeSelector from '@/components/WorkoutTypeSelector';
import { useTheme } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { db } from '@/lib/firebaseConfig';
import { mapStravaType, StravaActivity } from '@/services/stravaService';
import { Workout } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Basic Month Grid Implementation
export default function CalendarScreen() {
    const { palette, spacing, borderRadius, typography, shadows, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows, isDark);
    const router = useRouter();
    const { user } = useSession();
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(true);
    const [isWorkoutTypeModalVisible, setWorkoutTypeModalVisible] = useState(false);
    const [showStravaPicker, setShowStravaPicker] = useState(false);
    const [isSavingStrava, setIsSavingStrava] = useState(false);

    // Refresh on focus (catches new workouts added from program screen)
    useFocusEffect(
        useCallback(() => {
            if (user) fetchWorkouts();
        }, [user, currentDate])
    );

    const fetchWorkouts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

            const userWorkoutsRef = collection(db, 'users', user.uid, 'workouts');

            const q = query(
                userWorkoutsRef,
                where('scheduledDate', '>=', startOfMonth),
                where('scheduledDate', '<=', endOfMonth)
            );

            const snap = await getDocs(q);
            const wData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setWorkouts(wData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStravaSelect = async (activity: StravaActivity) => {
        if (!user) return;
        setShowStravaPicker(false);
        setIsSavingStrava(true);

        try {
            const km = (activity.distance / 1000).toFixed(2);
            const min = Math.round(activity.moving_time / 60);
            const mapping = mapStravaType(activity.type);

            const workoutData: any = {
                userId: user.uid,
                name: activity.name,
                date: new Date(),
                scheduledDate: new Date(activity.start_date),
                completedAt: new Date(activity.start_date),
                status: 'Completed',
                category: mapping.category,
                distance: parseFloat(km),
                duration: min * 60,
                stravaActivityId: activity.id.toString(),
                exercises: []
            };

            if (mapping.subcategory) {
                workoutData.subcategory = mapping.subcategory;
            }

            await addDoc(collection(db, 'users', user.uid, 'workouts'), workoutData);
            fetchWorkouts(); // Refresh the list
        } catch (e) {
            console.error("Failed to save Strava workout from calendar:", e);
        } finally {
            setIsSavingStrava(false);
        }
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    const renderCalendarGrid = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        // First day of week (1=Monday)
        const firstDay = new Date(year, month, 1).getDay() || 7; // M=1, Su=7 (ISO)

        const rows = [];
        let days = [];

        // Padding for previous month
        for (let i = 1; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.calDay} />);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const thisDate = new Date(year, month, d);

            // Find workouts for this day
            const dayWorkouts = workouts.filter(w => {
                let wDate = w.scheduledDate instanceof Date ? w.scheduledDate : w.scheduledDate?.toDate();
                if (!wDate) return false;
                return wDate.getFullYear() === year &&
                    wDate.getMonth() === month &&
                    wDate.getDate() === d;
            });

            // Check if today
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = dateStr === todayStr;

            // Check if selected
            const isSelected = selectedDate &&
                selectedDate.getDate() === d &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;

            days.push(
                <TouchableOpacity
                    key={d}
                    style={[
                        styles.calDay,
                        isToday && styles.calDayToday,
                        isSelected && styles.calDaySelected
                    ]}
                    onPress={() => setSelectedDate(thisDate)}
                >
                    <Text style={[
                        styles.calDayText,
                        isToday && styles.calDayTextToday,
                        isSelected && styles.calDayTextSelected
                    ]}>{d}</Text>
                    <View style={styles.dotContainer}>
                        {dayWorkouts.slice(0, 3).map((w, i) => (
                            <View key={i} style={[
                                styles.dot,
                                { backgroundColor: isSelected ? '#FFF' : palette.primary.main }
                            ]} />
                        ))}
                    </View>
                </TouchableOpacity>
            );

            // Row full?
            if (days.length === 7) {
                rows.push(<View key={`row-${rows.length}`} style={styles.calRow}>{days}</View>);
                days = [];
            }
        }

        // Final row padding
        if (days.length > 0) {
            while (days.length < 7) {
                days.push(<View key={`empty-end-${days.length}`} style={styles.calDay} />);
            }
            rows.push(<View key={`row-${rows.length}`} style={styles.calRow}>{days}</View>);
        }

        return rows;
    };

    const getSelectedDayWorkouts = () => {
        if (!selectedDate) return [];
        return workouts.filter(w => {
            let wDate = w.scheduledDate instanceof Date ? w.scheduledDate : w.scheduledDate?.toDate();
            if (!wDate) return false;
            return wDate.getFullYear() === selectedDate.getFullYear() &&
                wDate.getMonth() === selectedDate.getMonth() &&
                wDate.getDate() === selectedDate.getDate();
        });
    }

    const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
    const selectedWorkouts = getSelectedDayWorkouts();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Kalender</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.m }}>
                {/* Month Navigation */}
                <View style={styles.monthNav}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                        <Ionicons name="chevron-back" size={24} color={palette.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</Text>
                    <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                        <Ionicons name="chevron-forward" size={24} color={palette.text.primary} />
                    </TouchableOpacity>
                </View>

                {/* Week Headers */}
                <View style={styles.weekHeaderRow}>
                    {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(d => (
                        <Text key={d} style={styles.weekHeaderLabel}>{d}</Text>
                    ))}
                </View>

                {/* Grid */}
                <View style={styles.calendarContainer}>
                    {renderCalendarGrid()}
                </View>

                {/* Agenda */}
                <View style={styles.agendaContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.m }}>
                        <Text style={styles.subTitle}>
                            {selectedDate.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </Text>
                        <TouchableOpacity style={styles.addWorkoutBtn} onPress={() => setWorkoutTypeModalVisible(true)}>
                            <Ionicons name="add" size={16} color="#FFF" />
                            <Text style={styles.addWorkoutBtnText}>Planera pass</Text>
                        </TouchableOpacity>
                    </View>

                    {selectedWorkouts.length > 0 ? (
                        <View style={{ gap: spacing.s }}>
                            {selectedWorkouts.map((workout: Workout) => (
                                <DayCard
                                    key={workout.id}
                                    day=""
                                    date=""
                                    title={workout.name}
                                    type={
                                        workout.category === 'löpning'
                                            ? (workout.subcategory as DayCardType || 'distans')
                                            : (workout.category === 'styrketräning'
                                                ? (workout.subcategory as DayCardType || 'styrka')
                                                : (workout.category === 'rörlighet' || workout.category === 'rehab'
                                                    ? 'rörlighet'
                                                    : (workout.category === 'övrigt' ? 'övrigt' : 'rest')))
                                    }
                                    // @ts-ignore
                                    status={workout.status === 'Completed' ? 'completed' : 'pending'}
                                    onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id!, title: workout.name, status: workout.status === 'Completed' ? 'completed' : 'planned' } })}
                                    showDragHandle={false}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>Inga pass planerade</Text>
                            <TouchableOpacity
                                style={styles.addBtn}
                                onPress={() => setWorkoutTypeModalVisible(true)}
                            >
                                <Ionicons name="add" size={16} color={palette.primary.main} />
                                <Text style={styles.addBtnText}>Lägg till pass</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

            </ScrollView>

            <WorkoutTypeSelector
                visible={isWorkoutTypeModalVisible}
                onClose={() => setWorkoutTypeModalVisible(false)}
                onSelectType={(type) => {
                    setWorkoutTypeModalVisible(false);
                    if (type === 'template') {
                        router.push('/workout/select');
                    } else if (type === 'custom') {
                        router.push('/workout/create-custom');
                    } else if (type === 'strava') {
                        // Small delay to ensure the previous modal handles its closing animation
                        // before the next one starts, especially useful on iOS and some Web environments.
                        setTimeout(() => setShowStravaPicker(true), 150);
                    } else {
                        router.push({
                            pathname: '/workout/log',
                            params: { workoutName: 'New Workout', category: type, date: selectedDate.toISOString() }
                        });
                    }
                }}
            />

            <StravaActivityPicker
                visible={showStravaPicker}
                onClose={() => setShowStravaPicker(false)}
                onSelect={handleStravaSelect}
            />

            {isSavingStrava && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={palette.primary.main} />
                    <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Sparar pass...</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background.default,
    },
    header: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        backgroundColor: palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: palette.border.default,
    },
    headerTitle: {
        fontSize: typography.size.l,
        fontWeight: 'bold',
        color: palette.text.primary,
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    navBtn: {
        padding: spacing.s,
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.m,
        ...shadows.small,
    },
    monthTitle: {
        fontSize: typography.size.l,
        fontWeight: '600',
        color: palette.text.primary,
    },
    weekHeaderRow: {
        flexDirection: 'row',
        marginBottom: spacing.s,
    },
    weekHeaderLabel: {
        flex: 1,
        textAlign: 'center',
        fontWeight: 'bold',
        color: palette.text.secondary,
        fontSize: 12,
        textTransform: 'uppercase',
    },
    calendarContainer: {
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.l,
        padding: spacing.s,
        ...shadows.small,
    },
    calRow: {
        flexDirection: 'row',
        height: 60,
    },
    calDay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderTopWidth: 1,
        borderTopColor: palette.border.default,
        paddingTop: 8,
        borderRadius: borderRadius.m,
    },
    calDayToday: {
        backgroundColor: isDark ? '#1A237E' : '#F0F9FF',
    },
    calDaySelected: {
        backgroundColor: palette.primary.main,
    },
    calDayText: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.text.primary,
        marginBottom: 4,
    },
    calDayTextToday: {
        color: palette.primary.main,
        fontWeight: 'bold',
    },
    calDayTextSelected: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    dotContainer: {
        flexDirection: 'row',
        gap: 2,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    agendaContainer: {
        marginTop: spacing.xl,
        paddingBottom: 40,
    },
    subTitle: {
        fontSize: typography.size.m,
        fontWeight: 'bold',
        color: palette.text.primary,
        textTransform: 'capitalize'
    },
    addIconBtn: {
        padding: 4,
    },
    addWorkoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.primary.main,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    addWorkoutBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 4,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.l,
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: palette.border.default,
    },
    emptyStateText: {
        color: palette.text.secondary,
        marginBottom: spacing.m,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: isDark ? palette.background.default : '#F0F9FF',
        borderRadius: 20,
    },
    addBtnText: {
        color: palette.primary.main,
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 4,
    }
});
