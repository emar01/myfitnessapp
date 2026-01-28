import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { db } from '@/lib/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Basic Month Grid Implementation
export default function CalendarScreen() {
    const router = useRouter();
    const { user } = useSession();
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchWorkouts();
    }, [user, currentDate]); // Refetch if month changes if we optimized, but fetching all for now

    const fetchWorkouts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

            const userWorkoutsRef = collection(db, 'users', user.uid, 'workouts');
            // Depending on index, simple range check might need a composite index if we sorted.
            // But just filtering should be fine.
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

            days.push(
                <TouchableOpacity key={d} style={[styles.calDay, isToday && styles.calDayToday]} onPress={() => { }}>
                    <Text style={[styles.calDayText, isToday && styles.calDayTextToday]}>{d}</Text>
                    <View style={styles.dotContainer}>
                        {dayWorkouts.slice(0, 3).map((w, i) => (
                            <View key={i} style={[styles.dot, { backgroundColor: Palette.primary.main }]} />
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

    const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Kalender</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: Spacing.m }}>
                {/* Month Navigation */}
                <View style={styles.monthNav}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                        <Ionicons name="chevron-back" size={24} color={Palette.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</Text>
                    <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                        <Ionicons name="chevron-forward" size={24} color={Palette.text.primary} />
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

                {/* Placeholder for Agenda below */}
                <Text style={[styles.subTitle, { marginTop: Spacing.xl }]}>Kommande</Text>
                {/* List could go here */}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Palette.background.default,
    },
    header: {
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        backgroundColor: Palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
    },
    headerTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.l,
    },
    navBtn: {
        padding: Spacing.s,
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.m,
        ...Shadows.small,
    },
    monthTitle: {
        fontSize: Typography.size.l,
        fontWeight: '600',
        color: Palette.text.primary,
    },
    weekHeaderRow: {
        flexDirection: 'row',
        marginBottom: Spacing.s,
    },
    weekHeaderLabel: {
        flex: 1,
        textAlign: 'center',
        fontWeight: 'bold',
        color: Palette.text.secondary,
        fontSize: 12,
        textTransform: 'uppercase',
    },
    calendarContainer: {
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.l,
        padding: Spacing.s,
        ...Shadows.small,
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
        borderTopColor: '#F5F5F7',
        paddingTop: 8,
    },
    calDayToday: {
        backgroundColor: '#F0F9FF',
    },
    calDayText: {
        fontSize: 14,
        fontWeight: '600',
        color: Palette.text.primary,
        marginBottom: 4,
    },
    calDayTextToday: {
        color: Palette.primary.main,
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
    subTitle: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
    }
});
