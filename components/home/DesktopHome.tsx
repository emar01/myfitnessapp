import ConfirmationModal from '@/components/ConfirmationModal';
import DayCard, { DayCardType } from '@/components/DayCard';
import ProfileMenuModal from '@/components/ProfileMenuModal';
import StravaSyncModal from '@/components/StravaSyncModal';
import WorkoutDetailsView from '@/components/WorkoutDetailsView';
import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { ListItem, useHomeData } from '@/hooks/useHomeData';
import { workoutService } from '@/services/workoutService';
import { Workout } from '@/types';
import { getScaleWeekNumber } from '@/utils/dateUtils';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DesktopHome() {
    const router = useRouter();
    const { user, signOut, isLoading: sessionLoading } = useSession();

    // Use Custom Hook
    const {
        dailyProgram,
        listData,
        weeklyStats,
        loading,
        currentDate,
        activePrograms,
        workouts,
        changeWeek,
        refresh
    } = useHomeData(user);

    useFocusEffect(
        useCallback(() => {
            refresh(true); // Silent refresh
        }, [refresh])
    );

    const [isStravaModalVisible, setStravaModalVisible] = useState(false);
    const [isProfileMenuVisible, setProfileMenuVisible] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [workoutToDelete, setWorkoutToDelete] = useState<{ id: string, isCompleted: boolean } | null>(null);

    const handleDeleteWorkout = (workoutId: string, isCompleted: boolean = false) => {
        setWorkoutToDelete({ id: workoutId, isCompleted });
        setDeleteModalVisible(true);
    };

    const confirmDeleteWorkout = async () => {
        if (!workoutToDelete || !user?.uid) return;

        await workoutService.deleteWorkout(user.uid, workoutToDelete.id);
        setDeleteModalVisible(false);
        setWorkoutToDelete(null);
        refresh(true);
    };


    const handleSignOut = () => {
        setProfileMenuVisible(false);
        signOut();
    };

    const handleProfileNavigation = () => {
        setProfileMenuVisible(false);
        router.push('/settings/profile');
    };



    const renderItem = (item: ListItem) => {
        if (item.type === 'header') {
            return (
                <View key={item.id} style={styles.dayHeader}>
                    <Text style={styles.dayHeaderText}>{item.dayName}</Text>
                    <Text style={styles.dayDateText}>{item.dateLabel}</Text>
                </View>
            );
        }

        return (
            <View key={item.id} style={styles.itemContainer}>
                <DayCard
                    day=""
                    date=""
                    title={item.workout.name}
                    type={
                        item.workout.category === 'löpning'
                            ? (item.workout.subcategory as DayCardType || 'distans')
                            : (item.workout.category === 'styrketräning'
                                ? (item.workout.subcategory as DayCardType || 'styrka')
                                : (item.workout.category === 'rörlighet' || item.workout.category === 'rehab'
                                    ? 'rörlighet'
                                    : 'rest'))
                    }
                    // @ts-ignore
                    status={item.workout.status === 'Completed' ? 'completed' : 'pending'}
                    onPress={() => setSelectedWorkout(item.workout)}
                    onDeletePress={() => handleDeleteWorkout(item.workout.id!, item.workout.status === 'Completed')}
                    showDragHandle={false}
                />
            </View>
        );
    };

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

                        {/* Active Programs Section */}
                        {activePrograms && activePrograms.length > 0 && (
                            <View>
                                <Text style={styles.sectionTitle}>Mina Aktiva Program</Text>
                                <View style={{ gap: Spacing.s }}>
                                    {activePrograms.map((prog) => (
                                        <TouchableOpacity
                                            key={prog.id}
                                            style={styles.activeProgramCard}
                                            onPress={() => router.push({ pathname: '/program/[id]', params: { id: prog.programId } })}
                                        >
                                            <View style={styles.activeProgramIcon}>
                                                <Ionicons name="fitness-outline" size={24} color={Palette.primary.main} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={styles.activeProgramTitle} numberOfLines={1}>{prog.title}</Text>
                                                <Text style={styles.activeProgramSubtitle}>
                                                    Startat: {prog.startedAt ? new Date(prog.startedAt.seconds * 1000).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) : 'Okänt'}
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={16} color={Palette.text.disabled} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        <View>
                            <Text style={styles.sectionTitle}>Min progress</Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>
                                        {weeklyStats?.completedWorkouts || 0} / {weeklyStats?.totalWorkouts || 0}
                                    </Text>
                                    <Text style={styles.statLabel}>Pass i veckan</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>
                                        {Math.round((weeklyStats?.completedDurationMinutes || 0) / 60)}h / {Math.round((weeklyStats?.totalDurationMinutes || 0) / 60)}h
                                    </Text>
                                    <Text style={styles.statLabel}>Träningstid</Text>
                                </View>
                            </View>
                        </View>

                        {(() => {
                            const recentWorkouts = workouts
                                .filter((w: any) => w.status === 'Completed')
                                .sort((a: any, b: any) => {
                                    const dateA = a.date instanceof Date ? a.date.getTime() : (a.date as any).toMillis();
                                    const dateB = b.date instanceof Date ? b.date.getTime() : (b.date as any).toMillis();
                                    return dateB - dateA;
                                })
                                .slice(0, 5);

                            if (recentWorkouts.length === 0) return null;

                            return (
                                <View>
                                    <Text style={styles.sectionTitle}>Senaste Aktiviteter</Text>
                                    <View style={{ gap: Spacing.s }}>
                                        {recentWorkouts.map((w) => {
                                            const isRunning = w.category === 'löpning';
                                            const iconName = isRunning ? 'footsteps-outline' : 'barbell-outline';
                                            const statText = isRunning && w.distance
                                                ? `${w.distance} km`
                                                : w.duration ? `${Math.round(w.duration / 60)} min` : '';

                                            return (
                                                <View
                                                    key={w.id}
                                                    style={styles.recentActivityCard}
                                                >
                                                    <TouchableOpacity
                                                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                                        onPress={() => router.push({ pathname: '/workout/[id]', params: { id: w.id! } })}
                                                    >
                                                        <View style={styles.recentActivityIcon}>
                                                            <Ionicons name={iconName as any} size={20} color={Palette.text.secondary} />
                                                        </View>
                                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                                            <Text style={styles.recentActivityTitle} numberOfLines={1}>{w.name}</Text>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <Text style={styles.recentActivitySubtitle}>
                                                                    {w.date ? new Date(w.date instanceof Date ? w.date : (w.date as any).toMillis()).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) : ''}
                                                                </Text>
                                                                {statText ? <Text style={styles.recentActivityStat}>{statText}</Text> : null}
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteWorkout(w.id!, true)}
                                                        style={{ padding: 6 }}
                                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                    >
                                                        <Ionicons name="trash-outline" size={16} color={Palette.text.disabled} />
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        })()}
                    </ScrollView>

                    {/* Right Column: Weekly Schedule */}
                    <View style={styles.rightColumn}>
                        <Text style={styles.sectionTitle}>Veckans Schema</Text>
                        {loading ? (
                            <ActivityIndicator />
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {listData.map(item => renderItem(item))}
                            </ScrollView>
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

            <ConfirmationModal
                visible={deleteModalVisible}
                title={workoutToDelete?.isCompleted ? "Ta bort aktivitet" : "Ta bort planerat pass"}
                message={workoutToDelete?.isCompleted
                    ? "Vill du ta bort denna genomförda aktivitet?"
                    : "Vill du ta bort detta planerade pass?"}
                onConfirm={confirmDeleteWorkout}
                onCancel={() => {
                    setDeleteModalVisible(false);
                    setWorkoutToDelete(null);
                }}
            />

            {/* Workout Detail Modal */}
            <Modal
                visible={!!selectedWorkout}
                animationType="fade"
                transparent={true}
                onRequestClose={() => {
                    setSelectedWorkout(null);
                    refresh(true); // Silent refresh
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedWorkout && (
                            <WorkoutDetailsView
                                workoutId={selectedWorkout.id!}
                                initialData={selectedWorkout}
                                onClose={() => {
                                    setSelectedWorkout(null);
                                    refresh(true); // Silent refresh
                                }}
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
        flex: 3,
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

    // --- Recent Activities Styles ---
    recentActivityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: Spacing.m,
        borderRadius: BorderRadius.m,
        borderWidth: 1,
        borderColor: Palette.border.default,
        ...Shadows.small,
    },
    recentActivityIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Palette.background.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recentActivityTitle: {
        fontSize: Typography.size.m,
        fontWeight: '600',
        color: Palette.text.primary,
        marginBottom: 2,
    },
    recentActivitySubtitle: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
    recentActivityStat: {
        fontSize: Typography.size.s,
        fontWeight: '500',
        color: Palette.primary.main,
    },

    activeProgramCard: {
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        ...Shadows.small,
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    activeProgramIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Palette.background.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeProgramTitle: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
        marginBottom: 2,
    },
    activeProgramSubtitle: {
        fontSize: Typography.size.xs,
        color: Palette.text.secondary,
    }
});
