import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// NOTE: DraggableFlatList kept imported to avoid breaking other potential uses, but no longer used in schedule list

import { SafeAreaView } from 'react-native-safe-area-context';

import ConfirmationModal from '@/components/ConfirmationModal';
import DayCard, { DayCardType } from '@/components/DayCard';
import ProfileMenuModal from '@/components/ProfileMenuModal';
import StravaSyncModal from '@/components/StravaSyncModal';
import WorkoutTypeSelector from '@/components/WorkoutTypeSelector';
import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { ListItem, useHomeData } from '@/hooks/useHomeData';
import { workoutService } from '@/services/workoutService'; // Import Service
import { getScaleWeekNumber } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

// ... (keep helper imports if any were missed, but I think I got them)

export default function MobileHome() {
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
                <Ionicons name="add" size={20} color={Palette.text.secondary} />
                <Text style={{ fontSize: Typography.size.s, color: Palette.text.secondary, marginLeft: 4 }}>Lägg till pass</Text>
            </TouchableOpacity>
        </View>
    );

    const renderActivePrograms = () => {
        if (!activePrograms || activePrograms.length === 0) return null;

        return (
            <View style={{ marginBottom: Spacing.m }}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: Spacing.m, marginTop: 0 }]}>Mina Aktiva Program</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: Spacing.m, gap: Spacing.s }}
                >
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
            <View style={{ marginBottom: Spacing.m }}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: Spacing.m, marginTop: 0 }]}>Senaste Aktiviteter</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: Spacing.m, gap: Spacing.s }}
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
                                        <Ionicons name={iconName as any} size={20} color={Palette.text.secondary} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.recentActivityTitle} numberOfLines={1}>{w.name}</Text>
                                            <TouchableOpacity
                                                onPress={() => handleToggleComplete(w.id!, w.status)}
                                                style={{ marginLeft: 6 }}
                                            >
                                                <Ionicons name="checkmark-circle" size={18} color={Palette.primary.main} />
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
            <View style={{ marginBottom: Spacing.m }}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: Spacing.m, marginTop: 0 }]}>Min progress</Text>
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
                    onDeletePress={() => handleDeleteWorkout(item.workout.id!, item.workout.status === 'Completed')}
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
                        <Image source={require('@/assets/images/icon.png')} style={{ width: 32, height: 32, borderRadius: 8, marginRight: Spacing.s }} />
                        <Text style={styles.mainHeaderTitle}>MyFitness</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setProfileMenuVisible(true)}
                        style={styles.mainHeaderProfile}
                    >
                        <Ionicons name="person-circle" size={32} color={Palette.primary.main} />
                    </TouchableOpacity>
                </View>

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
            <WorkoutTypeSelector
                visible={isWorkoutTypeModalVisible}
                onClose={() => setWorkoutTypeModalVisible(false)}
                onSelectType={(type) => {
                    setWorkoutTypeModalVisible(false);
                    if (type === 'template') {
                        router.push('/workout/select');
                    } else if (type === 'custom') {
                        router.push('/workout/create-custom');
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

    // --- Recent Activities Styles ---
    recentActivityCard: {
        width: 180, // Slightly smaller for better fit on small mobile screens
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: Spacing.s, // Smaller padding
        borderRadius: BorderRadius.m,
        borderWidth: 1,
        borderColor: Palette.border.default,
        ...Shadows.small,
    },
    recentActivityIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
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
        fontSize: Typography.size.xs,
        color: Palette.text.secondary,
    },
    recentActivityStat: {
        fontSize: Typography.size.xs,
        fontWeight: '500',
        color: Palette.primary.main,
    },

    activeProgramCard: {
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.m,
        padding: Spacing.s, // Consistent with Activities
        flexDirection: 'row',
        alignItems: 'center',
        width: 200, // Reduced from 250
        ...Shadows.small,
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    activeProgramIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.m,
        gap: Spacing.m,
        marginBottom: Spacing.m,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        alignItems: 'flex-start',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Palette.border.default,
        ...Shadows.small,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: Palette.primary.main,
        marginBottom: 4
    },
    statLabel: {
        fontSize: 10,
        color: Palette.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '600'
    }
});
