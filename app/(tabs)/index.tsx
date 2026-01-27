import { useSession } from '@/app/ctx';
import DayCard from '@/components/DayCard';
import Button from '@/components/ui/Button';
import { Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WeeklyScheduleScreen() {
  const router = useRouter();
  const { user } = useSession();

  // Mock Data for "Vecka 44" as per screenshot
  const weekData = [
    { day: 'Måndag', date: 'Måndag 18 mars', title: 'Distans 30 - 40 min', type: 'distance', status: 'completed' },
    { day: 'Tisdag', date: 'Tisdag 19 mars', type: 'rest' },
    { day: 'Onsdag', date: 'Onsdag 20 mars', title: 'Fartpass 8-6-4-2 km', type: 'interval' }, // Using interval for Fartpass
    { day: 'Torsdag', date: 'Torsdag 21 mars', title: 'Distans 30 - 40 min', type: 'distance' },
    { day: 'Fredag', date: 'Fredag 22 mars', type: 'rest' },
    { day: 'Lördag', date: 'Lördag 23 mars', title: 'Långpass 60 - 70 min', type: 'long' },
    { day: 'Söndag', date: 'Söndag 24 mars', type: 'rest' },
  ];

  const handleWorkoutPress = (workoutItem: any) => {
    // Navigate to workout details
    router.push({
      pathname: '/workout/[id]',
      params: {
        id: 'mock-id',
        title: workoutItem.title,
        date: workoutItem.date,
        status: workoutItem.status,
        type: workoutItem.type
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileIcon} onPress={() => router.push('/login')}>
          <FontAwesome name="user-circle" size={24} color={Palette.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vecka 44</Text>
        <TouchableOpacity style={styles.profileIcon} onPress={() => router.push('/program/settings')}>
          <FontAwesome name="sliders" size={24} color={Palette.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {weekData.map((item, index) => (
          <DayCard
            key={index}
            day={item.day}
            date={item.date} // This is actually redundant in the UI logic as day is above, but matching visual
            title={item.title}
            // @ts-ignore
            type={item.type}
            // @ts-ignore
            status={item.status}
            onPress={() => item.type !== 'rest' && handleWorkoutPress(item)}
          />
        ))}

        <View style={styles.footer}>
          <Button
            title="Se hela schemat"
            variant="secondary"
            style={{ width: '100%' }}
            onPress={() => alert('View full schedule')}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background.default,
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
    fontFamily: Typography.fontFamily.bold,
  },
  profileIcon: {
    padding: Spacing.xs,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.m,
  },
  footer: {
    marginTop: Spacing.l,
    marginBottom: Spacing.xl,
  },
});
