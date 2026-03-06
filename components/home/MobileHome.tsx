import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// NOTE: DraggableFlatList kept imported to avoid breaking other potential uses, but no longer used in schedule list

import { SafeAreaView } from 'react-native-safe-area-context';

import ConfirmationModal from '@/components/ConfirmationModal';
import DayCard, { DayCardType } from '@/components/DayCard';
import ProfileMenuModal from '@/components/ProfileMenuModal';
import StravaActivityPicker from '@/components/StravaActivityPicker';
import StravaSyncModal from '@/components/StravaSyncModal';
import WorkoutTypeSelector from '@/components/WorkoutTypeSelector';
import { useTheme } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { ListItem, useHomeData } from '@/hooks/useHomeData';
import { mapStravaType } from '@/services/stravaService';
import { workoutService } from '@/services/workoutService'; // Import Service
import { getScaleWeekNumber } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

// ... (keep helper imports if any were missed, but I think I got them)

export default function MobileHome() {
    const { palette, spacing, borderRadius, typography, shadows, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows, isDark);
    const { user, signOut, isLoading: sessionLoading } = useSession();
    const router = useRouter();

    // Use Custom Hook for Data & Logic
    const {
        dailyProgram,
        listData,
        weeklyStats,
        loading,
        currentDate,
        activePrograms,
        workouts,
        changeWeek,
        setListData, // We need this to update local state optimistically
        refresh
    } = useHomeData(user);

    useFocusEffect(
        useCallback(() => {
            refresh(true); // Silent refresh
        }, [refresh])
    );

    const [isProfileMenuVisible, setProfileMenuVisible] = useState(false);
    const [isStravaModalVisible, setStravaModalVisible] = useState(false);
    const [isWorkoutTypeModalVisible, setWorkoutTypeModalVisible] = useState(false);
    const [showStravaPicker, setShowStravaPicker] = useState(false);
    const [isSavingStrava, setIsSavingStrava] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [workoutToDelete, setWorkoutToDelete] = useState<{ id: string, isCompleted: boolean } | null>(null);

    const handleSignOut = () => {
        setProfileMenuVisible(false);
        signOut();
    };

    const handleProfileNavigation = () => {
        setProfileMenuVisible(false);
        router.push('/settings/profile');
    };



    const renderStartWorkoutButton = () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
                onPress={() => setWorkoutTypeModalVisible(true)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
            >
                <Ionicons name="add" size={20} color={palette.text.secondary} />
                <Text style={{ fontSize: typography.size.s, color: palette.text.secondary, marginLeft: 4 }}>Lägg till pass</Text>
            </TouchableOpacity>
        </View>
    );

    const renderActivePrograms = () => {
        if (!activePrograms || activePrograms.length === 0) return null;

        return (
            <View style={{ marginBottom: spacing.m }}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.m, marginTop: 0 }]}>Mina Aktiva Program</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: spacing.m, gap: spacing.s }}
                >
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
                </ScrollView>
            </View>
        );
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
            console.error("Failed to save Strava workout from home:", e);
        } finally {
            setIsSavingStrava(false);
        }
    };

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

    const renderRecentActivities = () => {
        // Filter and sort completed workouts
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
            <View style={{ marginBottom: spacing.m }}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.m, marginTop: 0 }]}>Senaste Aktiviteter</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: spacing.m, gap: spacing.s }}
                >
                    {recentWorkouts.map((w: any) => {
                        const isRunning = w.category === 'löpning';
                        const iconName = isRunning ? 'footsteps-outline' : 'barbell-outline';
                        const statText = isRunning && w.distance
                            ? `${w.distance} km`
                            : w.duration ? `${Math.round(w.duration / 60)} min` : '';

                        return (
                            <View key={w.id} style={styles.recentActivityCard}>
                                <TouchableOpacity
                                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                    onPress={() => router.push({ pathname: '/workout/[id]', params: { id: w.id! } })}
                                >
                                    <View style={styles.recentActivityIcon}>
                                        <Ionicons name={iconName as any} size={20} color={palette.text.secondary} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
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
                                                    const dateObj = d instanceof Date ? d : (d as any).toMillis();
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
                </ScrollView>
            </View>
        );
    };

    const renderWeeklyStats = () => {
        if (!weeklyStats) return null;

        return (
            <View style={{ marginBottom: spacing.m }}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.m, marginTop: 0 }]}>Min progress</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            {weeklyStats.completedWorkouts} / {weeklyStats.totalWorkouts}
                        </Text>
                        <Text style={styles.statLabel}>Pass i veckan</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            {Math.round((weeklyStats.completedDurationMinutes || 0) / 60)}h / {Math.round((weeklyStats.totalDurationMinutes || 0) / 60)}h
                        </Text>
                        <Text style={styles.statLabel}>Träningstid</Text>
                    </View>
                </View>
            </View>
        );
    };



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

                {renderActivePrograms()}
                {renderWeeklyStats()}
                {renderRecentActivities()}

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

    const renderItem = ({ item }: { item: ListItem }) => {
        if (item.type === 'header') {
            return (
                <View style={styles.dayHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={styles.dayHeaderText}>{item.dayName}</Text>
                        <Text style={[styles.dayDateText, { marginLeft: 6 }]}>{item.dateLabel}</Text>
                    </View>
                </View>
            );
        }

        // Workout Item
        return (
            <View style={styles.itemContainer}>
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
                    onPress={() => router.push({ pathname: '/workout/[id]', params: { id: item.workout.id!, title: item.workout.name, status: item.workout.status === 'Completed' ? 'completed' : 'planned' } })}
                    onToggleComplete={() => handleToggleComplete(item.workout.id!, item.workout.status)}
                    showDragHandle={false}
                />
            </View>
        );
    };

    const weekNumber = getScaleWeekNumber(currentDate);

    // showProfileMenu removed

    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView style={styles.safeArea}>
                {/* Main App Header */}
                <View style={styles.mainHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('@/assets/images/icon.png')} style={{ width: 32, height: 32, borderRadius: 8, marginRight: spacing.s }} />
                        <Text style={styles.mainHeaderTitle}>MyFitness</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setProfileMenuVisible(true)}
                        style={styles.mainHeaderProfile}
                    >
                        <Ionicons name="person-circle" size={32} color={palette.primary.main} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={palette.primary.main} />
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
        </View>
    );
}


// function getScaleWeekNumber removed


const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, isDark: boolean) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.background.default,
    },
    mainHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        backgroundColor: palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: palette.border.default,
    },
    mainHeaderTitle: {
        fontSize: typography.size.l,
        fontWeight: 'bold',
        color: palette.primary.main,
    },
    mainHeaderProfile: {
        padding: spacing.s,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m,
        backgroundColor: palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: palette.border.default,
    },
    headerTitle: {
        fontSize: typography.size.m,
        fontWeight: 'bold',
        color: palette.text.primary,
    },
    headerSubtitle: {
        fontSize: 10,
        color: palette.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    profileIcon: {
        padding: spacing.s,
    },
    sectionTitle: {
        fontSize: typography.size.l,
        fontWeight: 'bold',
        marginBottom: spacing.m,
        marginTop: spacing.s,
        color: palette.text.primary,
    },

    // Daily Card
    dailyCard: {
        backgroundColor: palette.primary.main,
        borderRadius: borderRadius.l,
        padding: spacing.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.l,
        ...shadows.medium,
    },
    dailyContent: { flex: 1 },
    dailyLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: typography.size.xs,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    dailyTitle: {
        color: '#FFF',
        fontSize: typography.size.l,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    dailySubtitle: { color: '#FFF', fontSize: typography.size.s },
    dailyIcon: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },

    // List Items
    dayHeader: {
        paddingHorizontal: spacing.m,
        paddingTop: spacing.m,
        paddingBottom: spacing.xs,
        marginTop: 0,
    },
    dayHeaderText: {
        fontSize: typography.size.s,
        color: palette.text.primary,
        fontWeight: 'normal',
    },
    dayDateText: {
        display: 'none', // Hide specific date label if only DayName is desired like "Måndag"
    },
    itemContainer: {
        paddingHorizontal: spacing.m,
    },

    // New Header Styles
    weekControlHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m,
    },
    weekRangeText: {
        fontSize: typography.size.xs,
        color: palette.text.secondary,
    },
    weekBadgeContainer: {
        backgroundColor: isDark ? palette.primary.main : '#C5A898',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    weekBadgeText: {
        color: '#FFF',
        fontSize: typography.size.s,
        fontWeight: 'bold',
    },

    // --- Recent Activities Styles ---
    recentActivityCard: {
        width: 180,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.background.paper,
        padding: spacing.s,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: palette.border.default,
        ...shadows.small,
    },
    recentActivityIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
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
        fontSize: typography.size.xs,
        color: palette.text.secondary,
    },
    recentActivityStat: {
        fontSize: typography.size.xs,
        fontWeight: '500',
        color: palette.primary.main,
    },

    activeProgramCard: {
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.m,
        padding: spacing.s,
        flexDirection: 'row',
        alignItems: 'center',
        width: 200,
        ...shadows.small,
        borderWidth: 1,
        borderColor: palette.border.default,
    },
    activeProgramIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.m,
        gap: spacing.m,
        marginBottom: spacing.m,
    },
    statCard: {
        flex: 1,
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        alignItems: 'flex-start',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: palette.border.default,
        ...shadows.small,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: palette.primary.main,
        marginBottom: 4
    },
    statLabel: {
        fontSize: 10,
        color: palette.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '600'
    }
});
