import ConfirmationModal from '@/components/ConfirmationModal';
import DayCard, { DayCardType } from '@/components/DayCard';
import ProfileMenuModal from '@/components/ProfileMenuModal';
import StravaActivityPicker from '@/components/StravaActivityPicker';
import StravaSyncModal from '@/components/StravaSyncModal';
import WorkoutDetailsView from '@/components/WorkoutDetailsView';
import WorkoutTypeSelector from '@/components/WorkoutTypeSelector';
import { useTheme } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { ListItem, useHomeData } from '@/hooks/useHomeData';
import { mapStravaType } from '@/services/stravaService';
import { workoutService } from '@/services/workoutService';
import { Workout } from '@/types';
import { getScaleWeekNumber } from '@/utils/dateUtils';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DesktopHome() {
    const { palette, spacing, borderRadius, typography, shadows, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows, isDark);
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
    const [isWorkoutTypeModalVisible, setWorkoutTypeModalVisible] = useState(false);
    const [showStravaPicker, setShowStravaPicker] = useState(false);
    const [isSavingStrava, setIsSavingStrava] = useState(false);
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

    const handleToggleComplete = async (workoutId: string, currentStatus: string) => {
        if (!user?.uid) return;
        const newStatus = currentStatus === 'Completed' ? 'Planned' : 'Completed';
        const updatePayload: any = {
            status: newStatus,
            completedAt: newStatus === 'Completed' ? new Date() : null,
            date: newStatus === 'Completed' ? new Date() : new Date(), // Keep date updated for sorting
        };
        await workoutService.updateWorkout(user.uid, workoutId, updatePayload);
        refresh(true);
    };

    const handleStravaSelect = async (activity: any) => {
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

            await workoutService.saveWorkout(user.uid, workoutData);
            refresh(true);
        } catch (e) {
            console.error("Failed to save Strava workout from desktop home:", e);
        } finally {
            setIsSavingStrava(false);
        }
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
                                    : (item.workout.category === 'övrigt' ? 'övrigt' : 'rest')))
                    }
                    // @ts-ignore
                    status={item.workout.status === 'Completed' ? 'completed' : 'pending'}
                    onPress={() => setSelectedWorkout(item.workout)}
                    onToggleComplete={() => handleToggleComplete(item.workout.id!, item.workout.status)}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('@/assets/images/icon.png')} style={{ width: 40, height: 40, borderRadius: 10, marginRight: spacing.m }} />
                        <Text style={styles.headerTitle}>Välkommen tillbaka!</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.weekControl}>
                            <TouchableOpacity onPress={() => changeWeek('prev')} style={styles.arrowBtn}>
                                <Ionicons name="chevron-back" size={20} color={palette.text.primary} />
                            </TouchableOpacity>
                            <Text style={styles.weekLabel}>Vecka {getScaleWeekNumber(currentDate)}</Text>
                            <TouchableOpacity onPress={() => changeWeek('next')} style={styles.arrowBtn}>
                                <Ionicons name="chevron-forward" size={20} color={palette.text.primary} />
                            </TouchableOpacity>
                        </View>



                        <TouchableOpacity style={styles.startWorkoutButton} onPress={() => setWorkoutTypeModalVisible(true)}>
                            <Ionicons name="add" size={20} color="#FFF" />
                            <Text style={styles.startWorkoutText}>Starta pass</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setProfileMenuVisible(true)} style={styles.profileAvatar}>
                            <FontAwesome name="user" size={20} color={palette.text.secondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dashboard Grid - Wrapped in plain View, List inside Right Column */}
                <View style={styles.gridContainer}>
                    {/* Left Column: Daily & Stats (Scrollable if needed, or fixed) */}
                    <ScrollView style={styles.leftColumn} contentContainerStyle={{ gap: spacing.l }}>

                        {/* Active Programs Section */}
                        {activePrograms && activePrograms.length > 0 && (
                            <View>
                                <Text style={styles.sectionTitle}>Mina Aktiva Program</Text>
                                <View style={{ gap: spacing.s }}>
                                    {activePrograms.map((prog) => (
                                        <TouchableOpacity
                                            key={prog.id}
                                            style={styles.activeProgramCard}
                                            onPress={() => router.push({ pathname: '/program/[id]', params: { id: prog.programId } })}
                                        >
                                            <View style={styles.activeProgramIcon}>
                                                <Ionicons name="fitness-outline" size={24} color={palette.primary.main} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={styles.activeProgramTitle} numberOfLines={1}>{prog.title}</Text>
                                                <Text style={styles.activeProgramSubtitle}>
                                                    Startat: {prog.startedAt ? new Date(prog.startedAt.seconds * 1000).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) : 'Okänt'}
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={16} color={palette.text.disabled} />
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
                                    const getSortDate = (w: any) => {
                                        const d = w.completedAt || w.date;
                                        if (!d) return 0;
                                        return d instanceof Date ? d.getTime() : (d as any).toMillis();
                                    };
                                    return getSortDate(b) - getSortDate(a);
                                })
                                .slice(0, 5);

                            if (recentWorkouts.length === 0) return null;

                            return (
                                <View>
                                    <Text style={styles.sectionTitle}>Senaste Aktiviteter</Text>
                                    <View style={{ gap: spacing.s }}>
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
                                                            <Ionicons name={iconName as any} size={20} color={palette.text.secondary} />
                                                        </View>
                                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <Text style={styles.recentActivityTitle} numberOfLines={1}>{w.name}</Text>
                                                                <TouchableOpacity
                                                                    onPress={() => handleToggleComplete(w.id!, w.status)}
                                                                    style={{ marginLeft: 6 }}
                                                                >
                                                                    <Ionicons name="checkmark-circle" size={18} color={palette.primary.main} />
                                                                </TouchableOpacity>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <Text style={styles.recentActivitySubtitle}>
                                                                    {(() => {
                                                                        const d = w.completedAt || w.date;
                                                                        if (!d) return '';
                                                                        const dateObj = d instanceof Date ? d : (d as any).toMillis ? (d as any).toMillis() : d;
                                                                        return new Date(dateObj).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
                                                                    })()}
                                                                </Text>
                                                                {statText ? <Text style={styles.recentActivityStat}>{statText}</Text> : null}
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        })()}
                    </ScrollView>

                    {/* Middle Column: Weekly Schedule */}
                    <View style={styles.middleColumn}>
                        <Text style={styles.sectionTitle}>Veckans Schema</Text>
                        {loading ? (
                            <ActivityIndicator />
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {listData.map(item => renderItem(item))}
                            </ScrollView>
                        )}
                    </View>

                    {/* Right Column: Empty for now */}
                    <View style={styles.rightColumn}>
                        {/* Placeholder for future content */}
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
                        setTimeout(() => setShowStravaPicker(true), 150);
                    } else {
                        router.push({
                            pathname: '/workout/log',
                            params: { workoutName: 'New Workout', category: type }
                        });
                    }
                }}
            />

            {/* Workout Detail Modal */}
            {Platform.OS === 'web' ? (
                /* Custom overlay for Web to avoid z-index/portal issues with nested Modals */
                !!selectedWorkout && (
                    <View style={[StyleSheet.absoluteFill, { zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }]}>
                        <View style={styles.modalContent}>
                            <WorkoutDetailsView
                                workoutId={selectedWorkout.id!}
                                initialData={selectedWorkout}
                                onClose={() => {
                                    setSelectedWorkout(null);
                                    refresh(true); // Silent refresh
                                }}
                                isModal={true}
                            />
                        </View>
                    </View>
                )
            ) : (
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
            )}
        </View>
    );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: palette.background.default,
    },

    mainContent: {
        flex: 1,
        backgroundColor: palette.background.default,
    },
    header: {
        height: 80,
        backgroundColor: palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: palette.border.default,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.l,
        width: '100%',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: palette.text.primary,
    },
    startWorkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.primary.main,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: borderRadius.m,
        marginRight: spacing.m,
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
        backgroundColor: palette.background.paper,
        borderRadius: 30, // Pill shape
        padding: 4,
        marginRight: spacing.l,
        borderWidth: 1,
        borderColor: palette.border.default,
        ...shadows.small,
    },
    arrowBtn: {
        padding: 8,
        backgroundColor: isDark ? palette.background.default : '#F7F7F7',
        borderRadius: 20,
    },
    weekLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: palette.text.primary,
        marginHorizontal: spacing.m,
        minWidth: 70,
        textAlign: 'center',
    },
    profileAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isDark ? palette.background.default : '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridContainer: {
        flex: 1, // Fill remaining space
        flexDirection: 'row',
        gap: spacing.l,
        padding: spacing.l,
        width: '100%',
    },
    leftColumn: {
        flex: 1,
    },
    middleColumn: {
        flex: 1,
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.l,
        padding: spacing.l,
        ...shadows.small,
    },
    rightColumn: {
        flex: 1,
        // Empty panel for future use
    },
    dailyCard: {
        backgroundColor: palette.primary.main,
        borderRadius: borderRadius.l,
        padding: spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.medium,
        minHeight: 180,
        marginBottom: spacing.l,
    },
    cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
    cardTitle: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
    cardSubtitle: { color: '#FFF', fontSize: 16 },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.l,
    },
    statCard: {
        flex: 1,
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.l,
        padding: spacing.l,
        alignItems: 'flex-start', // Left align
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: palette.border.default,
        // No shadow for flatter look
    },
    statValue: { fontSize: 36, fontWeight: '800', color: palette.primary.main, marginBottom: 4 },
    statLabel: { fontSize: 13, color: palette.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.l, color: palette.text.primary },

    // Draggable List Styles
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingVertical: spacing.s,
        marginTop: spacing.l,
        marginBottom: spacing.xs,
        paddingHorizontal: spacing.xs,
    },
    dayHeaderText: {
        fontSize: 16,
        fontWeight: '800',
        color: palette.text.primary,
        marginRight: 8,
    },
    dayDateText: {
        fontSize: 14,
        color: palette.text.secondary,
        fontWeight: '500',
    },
    itemContainer: {
        marginBottom: spacing.s,
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
        backgroundColor: palette.background.default,
        borderRadius: borderRadius.l,
        overflow: 'hidden',
        ...shadows.large,
    },

    // --- Recent Activities Styles ---
    recentActivityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.background.paper,
        padding: spacing.m,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: palette.border.default,
        ...shadows.small,
    },
    recentActivityIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: palette.background.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recentActivityTitle: {
        fontSize: typography.size.m,
        fontWeight: '600',
        color: palette.text.primary,
        marginBottom: 2,
    },
    recentActivitySubtitle: {
        fontSize: typography.size.s,
        color: palette.text.secondary,
    },
    recentActivityStat: {
        fontSize: typography.size.s,
        fontWeight: '500',
        color: palette.primary.main,
    },

    activeProgramCard: {
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.small,
        borderWidth: 1,
        borderColor: palette.border.default,
    },
    activeProgramIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: palette.background.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeProgramTitle: {
        fontSize: typography.size.m,
        fontWeight: 'bold',
        color: palette.text.primary,
        marginBottom: 2,
    },
    activeProgramSubtitle: {
        fontSize: typography.size.xs,
        color: palette.text.secondary,
    }
});
