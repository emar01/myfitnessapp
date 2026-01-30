import { db } from '@/lib/firebaseConfig';
import { PersonalRecord, WorkoutExercise } from '@/types';
import { collection, doc, getDocs, query, serverTimestamp, setDoc } from 'firebase/firestore';

/**
 * Fetches all personal records for a user.
 */
export async function getUserPrs(userId: string): Promise<Record<string, PersonalRecord>> {
    try {
        const prRef = collection(db, 'users', userId, 'personalRecords');
        const q = query(prRef); // Could order by date
        const snapshot = await getDocs(q);

        const prMap: Record<string, PersonalRecord> = {};
        snapshot.forEach(doc => {
            const data = doc.data() as PersonalRecord;
            // Use exerciseId as key for fast lookup
            if (data.exerciseId) {
                prMap[data.exerciseId] = { ...data, id: doc.id };
            }
        });
        return prMap;
    } catch (e) {
        console.error("Error fetching PRs", e);
        return {};
    }
}

/**
 * Checks and updates PRs for a completed workout.
 * Returns a list of new PR strings to display (e.g., "Bench Press: 100kg").
 */
export async function checkAndSavePrs(
    userId: string,
    exercises: WorkoutExercise[],
    existingPrs: Record<string, PersonalRecord>,
    workoutId?: string
): Promise<string[]> {
    const newPrs: string[] = [];
    const batchUpdates: Promise<any>[] = [];

    for (const exercise of exercises) {
        if (!exercise.exerciseId) continue;

        // Find max weight lifted in this workout for this exercise
        let maxWeight = 0;
        let maxReps = 0;

        for (const set of exercise.sets) {
            if (set.isCompleted && set.weight && set.weight > maxWeight) {
                maxWeight = set.weight;
                maxReps = set.reps;
            }
        }

        if (maxWeight === 0) continue;

        const previousPr = existingPrs[exercise.exerciseId];

        // Check if it's a new record (strictly greater weight)
        if (!previousPr || maxWeight > previousPr.weight) {
            // It's a PR!
            const newRecord: PersonalRecord = {
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.name,
                weight: maxWeight,
                reps: maxReps,
                date: serverTimestamp(),
                workoutId: workoutId
            };

            // Use setDoc with exerciseId as ID to enforce one PR per exercise (simplest model)
            // Or addDoc to keep history. Let's keep history in a sub-collection 'history' later if needed.
            // For now, let's just overwrite the "current PR" document for easy querying.
            const prRef = doc(db, 'users', userId, 'personalRecords', exercise.exerciseId);
            batchUpdates.push(setDoc(prRef, newRecord));

            newPrs.push(`${exercise.name}: ${maxWeight}kg`);
        }
    }

    await Promise.all(batchUpdates);
    return newPrs;
}
