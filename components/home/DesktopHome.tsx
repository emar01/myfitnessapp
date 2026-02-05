import DayCard, { DayCardType } from '@/components/DayCard';
import ProfileMenuModal from '@/components/ProfileMenuModal';
import StravaSyncModal from '@/components/StravaSyncModal';
import WorkoutDetailsView from '@/components/WorkoutDetailsView';
import { BorderRadius, Palette, Shadows, Spacing } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { ListItem, useHomeData } from '@/hooks/useHomeData';
import { workoutService } from '@/services/workoutService';
import { Workout } from '@/types';
import { getScaleWeekNumber } from '@/utils/dateUtils';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

export default function DesktopHome() {
    const router = useRouter();
    const { user, signOut, isLoading: sessionLoading } = useSession();

    // Use Custom Hook
    const {
        dailyProgram,
        listData,
        loading,
        currentDate,
        changeWeek,
        setListData
    } = useHomeData(user);

    const [isStravaModalVisible, setStravaModalVisible] = useState(false);
    const [isProfileMenuVisible, setProfileMenuVisible] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

    const handleSignOut = () => {
        setProfileMenuVisible(false);
        signOut();
    };

    const handleProfileNavigation = () => {
        setProfileMenuVisible(false);
        router.push('/settings/profile');
    };

    const handleDragEnd = async ({ data }: { data: ListItem[] }) => {
        setListData(data);

        // Logic to update dates
        let currentHeaderDate: Date | null = null;
        const updates: Promise<any>[] = [];

        for (const item of data) {
            if (item.type === 'header') {
                currentHeaderDate = item.dateObj;
            } else if (item.type === 'workout' && currentHeaderDate) {
                // Check if this workout's date needs update
                const oldDate = item.workout.scheduledDate instanceof Date
                    ? item.workout.scheduledDate
                    : (item.workout.scheduledDate as any).toDate();

                const isSameDay = oldDate.getFullYear() === currentHeaderDate.getFullYear() &&
                    oldDate.getMonth() === currentHeaderDate.getMonth() &&
                    oldDate.getDate() === currentHeaderDate.getDate();

                if (!isSameDay) {
                    // Update Local State (optimistic)
                    item.workout.scheduledDate = currentHeaderDate;
                    if (item.workout.id && user) {
                        updates.push(workoutService.updateWorkoutDate(user.uid, item.workout.id, currentHeaderDate));
                    }
                }
            }
        }

        if (updates.length > 0) {
            try {
                await Promise.all(updates);
            } catch (e) {
                console.error("Failed to batch update workouts", e);
            }
        }
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
                    onPress={() => setSelectedWorkout(item.workout)}
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



                        <TouchableOpacity style={styles.startWorkoutButton} onPress={() => router.push({ pathname: '/workout/log', params: { workoutName: 'New Workout' } })}>
                            <Ionicons name="add" size={20} color="#FFF" />
                            <Text style={styles.startWorkoutText}>Starta pass</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setProfileMenuVisible(true)} style={styles.profileAvatar}>
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

            {/* Strava Modal */}
            <StravaSyncModal
                visible={isStravaModalVisible}
                onClose={() => setStravaModalVisible(false)}
                userId={user?.uid || ''}
            />
            <ProfileMenuModal
                visible={isProfileMenuVisible}
                onClose={() => setProfileMenuVisible(false)}
                onProfile={handleProfileNavigation}
                onLogout={handleSignOut}
                userEmail={user?.email}
            />

            {/* Workout Detail Modal */}
            <Modal
                visible={!!selectedWorkout}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectedWorkout(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedWorkout && (
                            <WorkoutDetailsView
                                workoutId={selectedWorkout.id!}
                                initialData={selectedWorkout}
                                onClose={() => setSelectedWorkout(null)}
                                isModal={true}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// function getScaleWeekNumber removed

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

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxWidth: 600,
        height: '80%',
        backgroundColor: Palette.background.default,
        borderRadius: BorderRadius.l,
        overflow: 'hidden',
        ...Shadows.large,
    },
});
