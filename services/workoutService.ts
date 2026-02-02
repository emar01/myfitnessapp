import { db } from '@/lib/firebaseConfig';
import { Workout } from '@/types';
import { addDoc, collection, doc, getDocs, query, updateDoc } from 'firebase/firestore';

export const workoutService = {
    /**
     * Fetch all workouts for a specific user.
     */
    getUserWorkouts: async (userId: string): Promise<Workout[]> => {
        try {
            const userWorkoutsRef = collection(db, 'users', userId, 'workouts');
            const qWorkouts = query(userWorkoutsRef);
            const wSnap = await getDocs(qWorkouts);
            return wSnap.docs.map(d => ({ id: d.id, ...d.data() } as Workout));
        } catch (error) {
            console.error("Error fetching user workouts:", error);
            throw error;
        }
    },

    /**
     * Update the scheduled date of a workout.
     */
    updateWorkoutDate: async (userId: string, workoutId: string, newDate: Date): Promise<void> => {
        try {
            const ref = doc(db, 'users', userId, 'workouts', workoutId);
            await updateDoc(ref, {
                scheduledDate: newDate
            });
        } catch (error) {
            console.error("Error updating workout date:", error);
            throw error;
        }
    },

    /**
     * Save a new workout.
     */
    saveWorkout: async (userId: string, workout: Omit<Workout, 'id'>): Promise<string> => {
        try {
            const workoutsRef = collection(db, `users/${userId}/workouts`);
            const docRef = await addDoc(workoutsRef, workout);
            return docRef.id;
        } catch (error) {
            console.error("Error saving workout:", error);
            throw error;
        }
    }
};
