import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { useRouter } from 'expo-router';

// ... (keep helper imports if any were missed, but I think I got them)

export default function MobileHome() {
    const { user, signOut, isLoading: sessionLoading } = useSession();
    const router = useRouter();

    // Use Custom Hook for Data & Logic
    const {
        dailyProgram,
        listData,
        loading,
        currentDate,
        changeWeek,
        setListData // We need this to update local state optimistically
    } = useHomeData(user);

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
                        console.log(`Moving ${item.workout.name} to ${currentHeaderDate.toDateString()}`);
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
});
