import { db } from '@/lib/firebaseConfig';
import { workoutService } from '@/services/workoutService';
import { Program, Workout } from '@/types';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

// Helper to get week dates based on a reference date
export const getWeekDates = (referenceDate: Date = new Date()) => {
    const curr = new Date(referenceDate);
    const week = [];

    // Ensure we start on Monday
    const day = curr.getDay() || 7; // M=1, Su=7
    if (day !== 1) {
        curr.setHours(-24 * (day - 1));
    }

    // Reset to midnight
    curr.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
        const next = new Date(curr);
        next.setDate(curr.getDate() + i);
        week.push(next);
    }
    return week;
};

// Types for the List Items
export type ListItem =
    | { type: 'header'; id: string; dayName: string; dateLabel: string; dateObj: Date }
    | { type: 'workout'; id: string; workout: Workout; };

export function useHomeData(user: any) {
    const [dailyProgram, setDailyProgram] = useState<Program | null>(null);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [listData, setListData] = useState<ListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const refresh = () => {
        if (user) fetchData();
    };

    const changeWeek = (direction: 'next' | 'prev') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Daily Program
            // Note: ideally this should also be in a programService
            const qDaily = query(collection(db, 'programs'), where('type', '==', 'daily'), limit(1));
            const dailySnap = await getDocs(qDaily);
            if (!dailySnap.empty) {
                setDailyProgram({ id: dailySnap.docs[0].id, ...dailySnap.docs[0].data() } as Program);
            }

            // 2. Fetch User's Workouts
            if (user) {
                const fetchedWorkouts = await workoutService.getUserWorkouts(user.uid);
                setWorkouts(fetchedWorkouts);

                // 3. Construct List Data immediately
                constructListData(fetchedWorkouts, currentDate);
            }
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };

    const constructListData = (currentWorkouts: Workout[], dateContext: Date) => {
        const dates = getWeekDates(dateContext);
        const newList: ListItem[] = [];

        dates.forEach(date => {
            // Create Header
            const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
            const dateLabel = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
            const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

            // Push Header
            newList.push({
                type: 'header',
                id: `header-${dateStr}`,
                dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                dateLabel,
                dateObj: date
            });

            // Find workouts for this date
            const daysWorkouts = currentWorkouts.filter(w => {
                if (!w.scheduledDate) return false;
                const wDate = w.scheduledDate instanceof Date ? w.scheduledDate : (w.scheduledDate as any).toDate();
                return wDate.getFullYear() === date.getFullYear() &&
                    wDate.getMonth() === date.getMonth() &&
                    wDate.getDate() === date.getDate();
            });

            daysWorkouts.forEach(w => {
                newList.push({ type: 'workout', id: w.id!, workout: w });
            });
        });

        setListData(newList);
    };

    // Re-construct list if Date changes (without re-fetching from DB)
    useEffect(() => {
        if (workouts.length > 0) {
            constructListData(workouts, currentDate);
        }
    }, [currentDate]); // workouts dependency purposely omitted to avoid loops, handled in fetchData

    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [user]);

    return {
        dailyProgram,
        workouts,
        listData,
        loading,
        currentDate,
        changeWeek,
        refresh,
        setListData // Exposed for drag-and-drop optim updates
    };
}
