import ActivityChart from '@/components/stats/ActivityChart';
import CategoryBreakdown from '@/components/stats/CategoryBreakdown';
import StatsOverview from '@/components/stats/StatsOverview';
import { Text, View } from '@/components/Themed';
import { Layout, Palette, Spacing } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { statisticsService } from '@/services/statisticsService';
import { workoutService } from '@/services/workoutService';
import { Workout } from '@/types';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

export default function StatsScreen() {
  const { user } = useSession();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    try {
      const data = await workoutService.getUserWorkouts(user.uid);
      setWorkouts(data);
    } catch (error) {
      console.error("Error fetching workouts for stats:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const stats = {
    totalWorkouts: statisticsService.getTotalWorkouts(workouts),
    breakdown: statisticsService.getWorkoutsByCategory(workouts),
    running: statisticsService.getRunningStats(workouts),
    activity: statisticsService.getWeeklyActivity(workouts)
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Din Statistik</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary.main} />
        }
      >
        <StatsOverview
          totalWorkouts={stats.totalWorkouts}
          totalDistance={stats.running.totalDistance}
          totalDuration={stats.running.totalDuration}
          averagePace={stats.running.averagePace}
        />

        <ActivityChart data={stats.activity} />

        <CategoryBreakdown breakdown={stats.breakdown} />

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background.default,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.m,
    backgroundColor: Palette.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border.default,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Palette.primary.main,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    ...Layout.contentContainer,
    padding: Spacing.m,
  },
});
