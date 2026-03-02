import { Workout, WorkoutCategory } from '@/types';

export const statisticsService = {
    getTotalWorkouts: (workouts: Workout[]): number => {
        return workouts.filter(w => w.status === 'Completed').length;
    },

    getWorkoutsByCategory: (workouts: Workout[]): Record<WorkoutCategory, number> => {
        const completedWorkouts = workouts.filter(w => w.status === 'Completed');
        const breakdown: Record<WorkoutCategory, number> = {
            'löpning': 0,
            'styrketräning': 0,
            'rehab': 0,
            'rörlighet': 0,
            'övrigt': 0
        };

        completedWorkouts.forEach(w => {
            if (w.category) {
                breakdown[w.category] = (breakdown[w.category] || 0) + 1;
            }
        });

        return breakdown;
    },

    getRunningStats: (workouts: Workout[]) => {
        const completedRunning = workouts.filter(w => w.status === 'Completed' && w.category === 'löpning');

        const totalDistance = completedRunning.reduce((sum, w) => sum + (w.distance || 0), 0);
        const totalDuration = completedRunning.reduce((sum, w) => sum + (w.duration || 0), 0);

        let averagePace = 0;
        if (totalDistance > 0) {
            averagePace = totalDuration / totalDistance; // seconds per km
        }

        return {
            totalDistance: parseFloat(totalDistance.toFixed(2)),
            totalDuration,
            averagePace: Math.round(averagePace)
        };
    },

    getWeeklyActivity: (workouts: Workout[]) => {
        const now = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const activityMap: Record<string, number> = {};
        last7Days.forEach(date => {
            activityMap[date] = 0;
        });

        workouts.forEach(w => {
            if (w.status === 'Completed' && w.date) {
                try {
                    // Check if w.date is a Firestore Timestamp (has toDate method)
                    let dateObj: Date;
                    if (typeof (w.date as any).toDate === 'function') {
                        dateObj = (w.date as any).toDate();
                    } else {
                        // Otherwise try to parse it as a normal Date or string
                        dateObj = new Date(w.date);
                    }

                    // Ensure it's a valid date before calling toISOString
                    if (!isNaN(dateObj.getTime())) {
                        const workoutDate = dateObj.toISOString().split('T')[0];
                        if (activityMap[workoutDate] !== undefined) {
                            activityMap[workoutDate]++;
                        }
                    }
                } catch (error) {
                    console.error("Invalid date found for workout:", w.id, w.date);
                }
            }
        });

        return last7Days.map(date => ({
            date,
            count: activityMap[date],
            dayName: new Date(date).toLocaleDateString('sv-SE', { weekday: 'short' })
        }));
    }
};
