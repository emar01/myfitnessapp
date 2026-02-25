import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

import DayCard, { DayCardType } from '@/components/DayCard';
import ProfileMenuModal from '@/components/ProfileMenuModal';
import StravaSyncModal from '@/components/StravaSyncModal';
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
                onPress={() => router.push({ pathname: '/workout/log', params: { workoutName: 'New Workout' } })}
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

    const handleDeleteActivity = (workoutId: string) => {
        Alert.alert(
            'Ta bort aktivitet',
            'Vill du ta bort denna genomförda aktivitet?',
            [
                { text: 'Avbryt', style: 'cancel' },
                {
                    text: 'Ta bort', style: 'destructive',
                    onPress: async () => {
                        if (!user?.uid) return;
                        await workoutService.deleteWorkout(user.uid, workoutId);
                        refresh(true);
                    }
                }
            ]
        );
    };

    const renderRecentActivities = () => {
        // Filter and sort completed workouts
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
                                    onPress={() => handleDeleteActivity(w.id!)}
                                    style={{ padding: 6 }}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="trash-outline" size={16} color={Palette.text.disabled} />
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

    const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<ListItem>) => {
        if (item.type === 'header') {
            return (
                <View style={[styles.dayHeader, { opacity: isActive ? 0.5 : 1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={styles.dayHeaderText}>{item.dayName}</Text>
                        <Text style={[styles.dayDateText, { marginLeft: 6, display: 'flex' }]}>{item.dateLabel}</Text>
                    </View>
                </View>
            );
        }

        // Workout Item
        const content = (
            <View style={[styles.itemContainer, { opacity: isActive ? 0.8 : 1 }]}>
                <DayCard
                    day="" // Hidden in list view as header handles it
                    date=""
                    title={item.workout.name}
                    type={item.workout.category === 'löpning' ? (item.workout.subcategory as DayCardType || 'distans') : (item.workout.category === 'styrketräning' ? (item.workout.subcategory as DayCardType || 'styrka') : 'rest')}
                    // @ts-ignore
                    status={item.workout.status === 'Completed' ? 'completed' : 'pending'}
                    onPress={() => router.push({ pathname: '/workout/[id]', params: { id: item.workout.id!, title: item.workout.name, status: item.workout.status === 'Completed' ? 'completed' : 'planned' } })}
                    onLongPress={drag} // Enable drag on long press
                    showDragHandle={false} // User requested "Hela träningen...", so we use natural long press
                />
            </View>
        );

        if (Platform.OS === 'web') {
            return content;
        }

        return (
            <ScaleDecorator>
                {content}
            </ScaleDecorator>
        );
    }, [user, currentDate]); // Added deps just in case

    const onDragEnd = async ({ data }: { data: ListItem[] }) => {
        setListData(data); // Optimistic update

        let currentHeaderDate: Date | null = null;

        for (const item of data) {
            if (item.type === 'header') {
                currentHeaderDate = item.dateObj;
            } else if (item.type === 'workout') {
                if (currentHeaderDate) {
                    // Check if date changed
                    const workoutDate = item.workout.scheduledDate instanceof Date ?
                        item.workout.scheduledDate :
                        (item.workout.scheduledDate as any).toDate();

                    // Compare YYYY-MM-DD to avoid time diffs
                    const isSameDay =
                        workoutDate.getFullYear() === currentHeaderDate.getFullYear() &&
                        workoutDate.getMonth() === currentHeaderDate.getMonth() &&
                        workoutDate.getDate() === currentHeaderDate.getDate();

                    if (!isSameDay) {
                        // Update Local Object Ref (for consistency until refresh)
                        item.workout.scheduledDate = currentHeaderDate;
                        // API Call
                        if (user && item.workout.id) {
                            try {
                                await workoutService.updateWorkoutDate(user.uid, item.workout.id, currentHeaderDate);
                            } catch (e) {
                                console.error("Failed to update date", e);
                                // Optional: revert list data if failure
                            }
                        }
                    }
                }
            }
        }
    };

    const weekNumber = getScaleWeekNumber(currentDate);

    // showProfileMenu removed

    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView style={styles.safeArea}>
                {/* Main App Header */}
                <View style={styles.mainHeader}>
                    <Text style={styles.mainHeaderTitle}>MyFitness</Text>
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
                    Platform.OS === 'web' ? (
                        <FlatList
                            data={listData}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => renderItem({ item, drag: () => { }, isActive: false } as any)}
                            ListHeaderComponent={renderHeader}
                            contentContainerStyle={{ paddingBottom: 100 }}
                        />
                    ) : (
                        <DraggableFlatList
                            data={listData}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            ListHeaderComponent={renderHeader}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            onDragEnd={onDragEnd}
                            activationDistance={10} // Slight tolerance
                        />
                    )
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
