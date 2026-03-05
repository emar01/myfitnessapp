import { db } from '@/lib/firebaseConfig';
import { workoutService } from '@/services/workoutService';
import { Program, Workout } from '@/types';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';

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

// Helper to estimate duration from workout name or subcategory for planned workouts
const estimateDurationMinutes = (workout: Workout): number => {
    if (workout.duration) {
        return Math.round(workout.duration / 60);
    }

    // Try to parse from name
    if (workout.name) {
        const name = workout.name.toLowerCase();

        // e.g. "3h", "4h"
        const hourMatch = name.match(/(\d+)\s*h/);
        if (hourMatch) return parseInt(hourMatch[1], 10) * 60;

        // e.g. "60 min", "45min"
        const minMatch = name.match(/(\d+)\s*min/);
        if (minMatch) return parseInt(minMatch[1], 10);

        // e.g. "75-90", "40-50", "120-130"
        const rangeMatch = name.match(/(\d+)\s*-\s*(\d+)/);
        if (rangeMatch) return (parseInt(rangeMatch[1], 10) + parseInt(rangeMatch[2], 10)) / 2;
    }

    // Fallbacks
    if (workout.subcategory === 'långpass') return 90;
    if (workout.subcategory === 'distans') return 50;
    if (workout.subcategory === 'intervall' || workout.subcategory === 'fartpass') return 60;
    if (workout.category === 'styrketräning') return 45;

    return 45; // Default for anything else
};

export function useHomeData(user: any) {
    const [dailyProgram, setDailyProgram] = useState<Program | null>(null);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [activePrograms, setActivePrograms] = useState<any[]>([]); // New state for followed programs
    const [listData, setListData] = useState<ListItem[]>([]);
    const [weeklyStats, setWeeklyStats] = useState({
        totalWorkouts: 0,
        completedWorkouts: 0,
        totalDurationMinutes: 0,
        completedDurationMinutes: 0
    });
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const currentDateRef = useRef(currentDate);

    useEffect(() => {
        currentDateRef.current = currentDate;
    }, [currentDate]);

    const changeWeek = (direction: 'next' | 'prev') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // 1. Fetch Daily Program
            // Note: ideally this should also be in a programService
            const qDaily = query(collection(db, 'programs'), where('type', '==', 'daily'), limit(1));
            const dailySnap = await getDocs(qDaily);
            if (!dailySnap.empty) {
                setDailyProgram({ id: dailySnap.docs[0].id, ...dailySnap.docs[0].data() } as Program);
            }

            // 2. Fetch User's Workouts & Active Programs
            if (user) {
                const fetchedWorkouts = await workoutService.getUserWorkouts(user.uid);
                setWorkouts(fetchedWorkouts);

                // Fetch Active Programs
                const activeProgsRef = collection(db, 'users', user.uid, 'active_programs');
                const activeProgsSnap = await getDocs(activeProgsRef);
                const aProgs = activeProgsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setActivePrograms(aProgs);

                // 3. Construct List Data immediately
                constructListData(fetchedWorkouts, currentDateRef.current);
            }
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [user]);

    const refresh = useCallback((silent = false) => {
        if (user) fetchData(silent);
    }, [user, fetchData]);

    const constructListData = (currentWorkouts: Workout[], dateContext: Date) => {
        const dates = getWeekDates(dateContext);
        const newList: ListItem[] = [];

        let tWorkouts = 0;
        let cWorkouts = 0;
        let tDuration = 0;
        let cDuration = 0;

        dates.forEach(date => {
            // Create Header
            const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
            const dateLabel = `${date.getDate()}/${date.getMonth() + 1}`; // e.g. "3/2"
            const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

            // Push Header
            newList.push({
                type: 'header',
                id: `header-${dateStr}`,
                dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                dateLabel,
                dateObj: date
            });

            // Find workouts for this date - Robust Comparison
            const daysWorkouts = currentWorkouts.filter(w => {
                if (!w.scheduledDate) return false;
                // Normalize dates to local strings for comparison to avoid time issues
                const wDate = w.scheduledDate instanceof Date ? w.scheduledDate : (w.scheduledDate as any).toDate();

                return wDate.getDate() === date.getDate() &&
                    wDate.getMonth() === date.getMonth() &&
                    wDate.getFullYear() === date.getFullYear();
            });

            daysWorkouts.forEach(w => {
                newList.push({ type: 'workout', id: w.id!, workout: w });
                tWorkouts++;

                // Duration is expected to be stored in seconds for completed workouts, 
                // but planned workouts might lack it.
                let wDurMin = estimateDurationMinutes(w);

                tDuration += wDurMin;

                if (w.status === 'Completed') {
                    cWorkouts++;
                    cDuration += wDurMin;
                }
            });
        });

        setListData(newList);
        setWeeklyStats({
            totalWorkouts: tWorkouts,
            completedWorkouts: cWorkouts,
            totalDurationMinutes: tDuration,
            completedDurationMinutes: cDuration
        });
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
        weeklyStats,
        loading,
        currentDate,
        activePrograms, // Expose to screens
        changeWeek,
        refresh,
        setListData // Exposed for drag-and-drop optim updates
    };
}
