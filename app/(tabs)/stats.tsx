import ActivityChart from '@/components/stats/ActivityChart';
import CategoryBreakdown from '@/components/stats/CategoryBreakdown';
import StatsOverview from '@/components/stats/StatsOverview';
import { Text, View } from '@/components/Themed';
import { useTheme } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { statisticsService } from '@/services/statisticsService';
import { workoutService } from '@/services/workoutService';
import { Workout } from '@/types';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

export default function StatsScreen() {
  const { palette, spacing, borderRadius, typography, shadows, isDark, layout } = useTheme();
  const styles = getStyles(palette, spacing, borderRadius, typography, shadows, layout);
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary.main} />
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

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, layout: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background.default,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.m,
    backgroundColor: palette.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: palette.border.default,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: palette.primary.main,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    ...layout.contentContainer,
    padding: spacing.m,
  },
});
