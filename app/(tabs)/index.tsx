import { useSession } from '@/app/ctx';
import DayCard, { DayCardType } from '@/components/DayCard';
import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { db } from '@/lib/firebaseConfig';
import { Program, Workout } from '@/types';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Helper to get current week dates
const getWeekDates = () => {
  const curr = new Date();
  const week = [];
  // Ensure we start on Monday
  const first = curr.getDate() - curr.getDay() + 1; // 1 is Monday
  for (let i = 0; i < 7; i++) {
    const next = new Date(curr.getTime());
    next.setDate(first + i);
    week.push(next);
  }
  return week;
};

// Types for the FlatList
type ListItem =
  | { type: 'header'; id: string; dayName: string; dateLabel: string; dateObj: Date }
  | { type: 'workout'; id: string; workout: Workout; };

export default function WeeklyScheduleScreen() {
  const router = useRouter();
  const { user } = useSession();
  const [dailyProgram, setDailyProgram] = useState<Program | null>(null);
  const [listData, setListData] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Daily Program
      const qDaily = query(collection(db, 'programs'), where('type', '==', 'daily'), limit(1));
      const dailySnap = await getDocs(qDaily);
      if (!dailySnap.empty) {
        setDailyProgram({ id: dailySnap.docs[0].id, ...dailySnap.docs[0].data() } as Program);
      }

      // 2. Fetch Planned Workouts
      // In a real app, strict date filtering would apply. Here we fetch all 'Planned' for demo.
      // Or just fetch all workouts and filter client side for the "Current Week" view.
      const qWorkouts = query(collection(db, 'workouts')); // Fetching all for simplicity in demo
      const wSnap = await getDocs(qWorkouts);
      const workouts = wSnap.docs.map(d => ({ id: d.id, ...d.data() } as Workout));

      // 3. Construct List Data
      const dates = getWeekDates();
      const newList: ListItem[] = [];

      dates.forEach(date => {
        // Create Header
        const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
        const dateLabel = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
        const dateStr = date.toISOString().split('T')[0];

        // Push Header
        newList.push({
          type: 'header',
          id: `header-${dateStr}`,
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          dateLabel,
          dateObj: date
        });

        // Find workouts for this date
        // Note: scheduledDate should be a Timestamp in real Firestore, handled as Date here locally if converted
        // Fallback to simple date matching or 'status' check
        const daysWorkouts = workouts.filter(w => {
          if (!w.scheduledDate) return false;
          // Handle Firestore Timestamp to Date conversion if needed
          const wDate = w.scheduledDate instanceof Date ? w.scheduledDate : (w.scheduledDate as any).toDate();
          return wDate.toISOString().split('T')[0] === dateStr;
        });

        daysWorkouts.forEach(w => {
          newList.push({ type: 'workout', id: w.id!, workout: w });
        });
      });

      setListData(newList);

    } catch (e) {
      console.error('Failed to fetch data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async ({ data }: { data: ListItem[] }) => {
    setListData(data);

    // Logic to update dates
    // Iterate through list, keep track of current "Header" date
    let currentDate: Date | null = null;
    const updates: Promise<any>[] = [];

    for (const item of data) {
      if (item.type === 'header') {
        currentDate = item.dateObj;
      } else if (item.type === 'workout' && currentDate) {
        // Check if this workout's date needs update
        const oldDate = item.workout.scheduledDate instanceof Date
          ? item.workout.scheduledDate
          : (item.workout.scheduledDate as any).toDate();

        const isSameDay = oldDate.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0];

        if (!isSameDay) {
          // Update Local State (optimistic optimization usually, but here we just queue DB update)
          item.workout.scheduledDate = currentDate;
          if (item.workout.id) {
            const ref = doc(db, 'workouts', item.workout.id);
            updates.push(updateDoc(ref, { scheduledDate: currentDate }));
          }
        }
      }
    }

    try {
      await Promise.all(updates);
      if (updates.length > 0) {
        console.log(`Updated ${updates.length} workouts`);
      }
    } catch (e) {
      console.error("Failed to batch update workouts", e);
    }
  };

  const renderDailyCard = () => {
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
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[styles.itemContainer, isActive && { opacity: 0.5 }]}
        >
          <DayCard
            day="" // Hidden in list view as header handles it
            date=""
            title={item.workout.name}
            type={item.workout.category === 'löpning' ? (item.workout.subcategory as DayCardType || 'distans') : (item.workout.category === 'styrketräning' ? (item.workout.subcategory as DayCardType || 'styrka') : 'rest')}
            // @ts-ignore
            status={item.workout.status === 'Completed' ? 'completed' : 'pending'}
            onPress={() => router.push({ pathname: '/workout/[id]', params: { id: item.workout.id!, title: item.workout.name } })}
          />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.profileIcon} onPress={() => router.push('/login')}>
            <FontAwesome name="user-circle" size={24} color={Palette.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vecka {getScaleWeekNumber(new Date())}</Text>
          <TouchableOpacity style={styles.profileIcon} onPress={() => router.push('/program/settings')}>
            <FontAwesome name="sliders" size={24} color={Palette.text.primary} />
          </TouchableOpacity>
        </View>

        <DraggableFlatList
          data={listData}
          onDragEnd={handleDragEnd}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderDailyCard}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// Simple week number helper
function getScaleWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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
  },
  profileIcon: {
    padding: Spacing.xs,
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
    paddingVertical: Spacing.s,
    marginTop: Spacing.s,
    backgroundColor: Palette.background.default, // Sticky header look?
  },
  dayHeaderText: {
    fontSize: Typography.size.m,
    fontWeight: 'bold',
    color: Palette.text.primary,
  },
  dayDateText: {
    fontSize: Typography.size.s,
    color: Palette.text.secondary,
  },
  itemContainer: {
    paddingHorizontal: Spacing.m,
  }
});
