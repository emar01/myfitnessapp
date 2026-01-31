import DayCard, { DayCardType } from '@/components/DayCard';
import StravaSyncModal from '@/components/StravaSyncModal';
import { BorderRadius, Palette, Shadows, Spacing } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { db } from '@/lib/firebaseConfig';
import { Program, Workout } from '@/types';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { getWeekDates, ListItem } from './MobileHome';

export default function DesktopHome() {
    const router = useRouter();
    const { user, signOut, isLoading: sessionLoading } = useSession();
    const [dailyProgram, setDailyProgram] = useState<Program | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [listData, setListData] = useState<ListItem[]>([]);
    const [isStravaModalVisible, setStravaModalVisible] = useState(false);

    useEffect(() => {
        if (!sessionLoading) {
            if (user) {
                fetchData();
            } else {
                setLoading(false);
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
                        // router.replace('/login'); 
                    }
                }
            ]
        );
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const qDaily = query(collection(db, 'programs'), where('type', '==', 'daily'), limit(1));
            const dailySnap = await getDocs(qDaily);
            if (!dailySnap.empty) {
                setDailyProgram({ id: dailySnap.docs[0].id, ...dailySnap.docs[0].data() } as Program);
            }

            // Fetch user workouts
            if (user) {
                // Fetch ALL workouts to ensure nothing is missed due to date logic
                const userWorkoutsRef = collection(db, 'users', user.uid, 'workouts');
                const qWorkouts = query(userWorkoutsRef);
                const wSnap = await getDocs(qWorkouts);
                const workouts = wSnap.docs.map(d => ({ id: d.id, ...d.data() } as Workout));

                // Construct List Data
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
            }
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async ({ data }: { data: ListItem[] }) => {
        console.log('DesktopHome: Drag Ended. New List Length:', data.length);
        console.log('Ids:', data.map(i => i.id).join(', '));

        setListData(data);

        // Logic to update dates
        let currentHeaderDate: Date | null = null;
        const updates: Promise<any>[] = [];

        for (const item of data) {
            if (item.type === 'header') {
                currentHeaderDate = item.dateObj;
                // console.log('Found Header:', item.dateLabel);
            } else if (item.type === 'workout' && currentHeaderDate) {
                // Check if this workout's date needs update
                const oldDate = item.workout.scheduledDate instanceof Date
                    ? item.workout.scheduledDate
                    : (item.workout.scheduledDate as any).toDate();

                const isSameDay = oldDate.getFullYear() === currentHeaderDate.getFullYear() &&
                    oldDate.getMonth() === currentHeaderDate.getMonth() &&
                    oldDate.getDate() === currentHeaderDate.getDate();

                if (!isSameDay) {
                    console.log(`Moving workout ${item.workout.name} from ${oldDate.toDateString()} to ${currentHeaderDate.toDateString()}`);
                    // Update Local State (optimistic)
                    item.workout.scheduledDate = currentHeaderDate;
                    if (item.workout.id && user) {
                        const ref = doc(db, 'users', user.uid, 'workouts', item.workout.id);
                        updates.push(updateDoc(ref, { scheduledDate: currentHeaderDate }));
                    }
                }
            }
        }

        if (updates.length > 0) {
            console.log(`Pushing ${updates.length} updates to Firestore...`);
            try {
                await Promise.all(updates);
                console.log('Firestore updates successful');
            } catch (e) {
                console.error("Failed to batch update workouts", e);
            }
        } else {
            console.log('No date changes detected.');
        }
    };

    const changeWeek = (direction: 'next' | 'prev') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<ListItem>) => {
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
            <View style={[styles.itemContainer, isActive && { opacity: 0.5 }]}>
                <DayCard
                    day="" // Hidden in list view as header handles it
                    date=""
                    title={item.workout.name}
                    type={item.workout.category === 'löpning' ? (item.workout.subcategory as DayCardType || 'distans') : (item.workout.category === 'styrketräning' ? (item.workout.subcategory as DayCardType || 'styrka') : 'rest')}
                    // @ts-ignore
                    status={item.workout.status === 'Completed' ? 'completed' : 'pending'}
                    onPress={() => router.push({ pathname: '/workout/[id]', params: { id: item.workout.id!, title: item.workout.name, status: item.workout.status === 'Completed' ? 'completed' : 'planned' } })}
                    onLongPress={drag}
                    showDragHandle={true}
                />
            </View>
        );
    }, []);

    return (
        <View style={styles.container}>
            {/* Sidebar removed - now in global layout */}

            {/* Main Content */}
            <View style={styles.mainContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Välkommen tillbaka!</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.weekControl}>
                            <TouchableOpacity onPress={() => changeWeek('prev')} style={styles.arrowBtn}>
                                <Ionicons name="chevron-back" size={20} color={Palette.text.primary} />
                            </TouchableOpacity>
                            <Text style={styles.weekLabel}>Vecka {getScaleWeekNumber(currentDate)}</Text>
                            <TouchableOpacity onPress={() => changeWeek('next')} style={styles.arrowBtn}>
                                <Ionicons name="chevron-forward" size={20} color={Palette.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.startWorkoutButton, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', marginRight: 16 }]}
                            onPress={() => setStravaModalVisible(true)}
                        >
                            <Ionicons name="sync" size={20} color="#FC4C02" />
                            <Text style={[styles.startWorkoutText, { color: Palette.text.primary }]}>Synka</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.startWorkoutButton} onPress={() => router.push({ pathname: '/workout/log', params: { workoutName: 'New Workout' } })}>
                            <Ionicons name="add" size={20} color="#FFF" />
                            <Text style={styles.startWorkoutText}>Starta pass</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSignOut} style={styles.profileAvatar}>
                            <FontAwesome name="user" size={20} color={Palette.text.secondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dashboard Grid - Wrapped in plain View, List inside Right Column */}
                <View style={styles.gridContainer}>
                    {/* Left Column: Daily & Stats (Scrollable if needed, or fixed) */}
                    <ScrollView style={styles.leftColumn} contentContainerStyle={{ gap: Spacing.l }}>
                        {dailyProgram && (
                            <TouchableOpacity style={styles.dailyCard} onPress={() => router.push({ pathname: '/program/[id]', params: { id: dailyProgram.id! } })}>
                                <View>
                                    <Text style={styles.cardLabel}>DAGENS PASS</Text>
                                    <Text style={styles.cardTitle}>{dailyProgram.title}</Text>
                                    <Text style={styles.cardSubtitle}>{dailyProgram.duration} • {dailyProgram.category}</Text>
                                </View>
                                <Ionicons name="flame" size={48} color="#FFF" />
                            </TouchableOpacity>
                        )}

                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>3</Text>
                                <Text style={styles.statLabel}>Pass i veckan</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>12h</Text>
                                <Text style={styles.statLabel}>Träningstid</Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Right Column: Weekly Schedule (Draggable List) */}
                    <View style={styles.rightColumn}>
                        <Text style={styles.sectionTitle}>Veckans Schema</Text>
                        {/* DraggableFlatList needs bounded height */}
                        {loading ? (
                            <ActivityIndicator />
                        ) : (
                            <DraggableFlatList
                                data={listData}
                                onDragEnd={handleDragEnd}
                                onDragBegin={() => console.log('DesktopHome: Drag Began')}
                                onPlaceholderIndexChange={(index) => console.log('DesktopHome: Placeholder Index Changed to:', index)}
                                keyExtractor={(item) => item.id}
                                renderItem={renderItem}
                                containerStyle={{ flex: 1 }}
                                autoscrollThreshold={50}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>
                </View>
            </View>
            <StravaSyncModal
                visible={isStravaModalVisible}
                onClose={() => setStravaModalVisible(false)}
                userId={user?.uid || ''}
            />
        </View>
    );
}

// Reuse helper for week number 
function getScaleWeekNumber(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#F5F7FA', // Lighter background for desktop
    },

    mainContent: {
        flex: 1,
    },
    header: {
        height: 80,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.l,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    startWorkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Palette.primary.main,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: BorderRadius.m,
        marginRight: Spacing.m,
    },
    startWorkoutText: {
        color: '#FFF',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    // Week Control Styles
    weekControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 30, // Pill shape
        padding: 4,
        marginRight: Spacing.l,
        borderWidth: 1,
        borderColor: '#EEE',
        ...Shadows.small,
    },
    arrowBtn: {
        padding: 8,
        backgroundColor: '#F7F7F7',
        borderRadius: 20,
    },
    weekLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Palette.text.primary,
        marginHorizontal: Spacing.m,
        minWidth: 70,
        textAlign: 'center',
    },
    profileAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridContainer: {
        flex: 1, // Fill remaining space
        flexDirection: 'row',
        gap: Spacing.l,
        padding: Spacing.l,
    },
    leftColumn: {
        flex: 2,
        // gap handled in contentContainerStyle
    },
    rightColumn: {
        flex: 3,
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.l,
        padding: Spacing.l,
        ...Shadows.small,
    },
    dailyCard: {
        backgroundColor: Palette.primary.main,
        borderRadius: BorderRadius.l,
        padding: Spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Shadows.medium,
        minHeight: 180,
        marginBottom: Spacing.l,
    },
    cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
    cardTitle: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
    cardSubtitle: { color: '#FFF', fontSize: 16 },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.l,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.l,
        padding: Spacing.l,
        alignItems: 'flex-start', // Left align
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EFEFEF',
        // No shadow for flatter look
    },
    statValue: { fontSize: 36, fontWeight: '800', color: Palette.primary.main, marginBottom: 4 },
    statLabel: { fontSize: 13, color: Palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: Spacing.l, color: Palette.text.primary },

    // Draggable List Styles
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingVertical: Spacing.s,
        marginTop: Spacing.l,
        marginBottom: Spacing.xs,
        paddingHorizontal: Spacing.xs,
    },
    dayHeaderText: {
        fontSize: 16,
        fontWeight: '800',
        color: Palette.text.primary,
        marginRight: 8,
    },
    dayDateText: {
        fontSize: 14,
        color: Palette.text.secondary,
        fontWeight: '500',
    },
    itemContainer: {
        marginBottom: Spacing.s,
    },
});
