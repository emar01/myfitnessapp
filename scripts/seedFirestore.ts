import { addDoc, collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import exercisesData from '../data/exercises.json';
import { db } from "../lib/firebaseConfig";

export async function seedExercises() {
    console.log("Seeding/Updating exercises from JSON source...");
    const exercisesRef = collection(db, "exercises");

    for (const exercise of exercisesData) {
        // match by name
        const q = query(exercisesRef, where("name", "==", exercise.name));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Exercise exists - Update it (e.g. videoLink might be new)
            const docId = querySnapshot.docs[0].id;
            const docRef = doc(db, "exercises", docId);
            await setDoc(docRef, exercise, { merge: true });
            console.log(`Updated: ${exercise.name}`);
        } else {
            // New exercise - Add it
            await addDoc(exercisesRef, exercise);
            console.log(`Added: ${exercise.name}`);
        }
    }
    console.log("Exercises seeding complete.");
}

export async function seedDailyProgram() {
    console.log('Checking for Daily Program...');
    const programsCollection = collection(db, 'programs');
    const q = query(programsCollection, where('type', '==', 'daily'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        const dailyProgram = {
            title: 'Dagens Utmaning',
            duration: '30 min',
            type: 'daily',
            category: 'Styrketräning',
            description: 'Ett nytt pass varje dag för att hålla igång kroppen!',
            workoutIds: [],
        };
        await addDoc(programsCollection, dailyProgram);
        console.log('Daily Program created!');
    } else {
        console.log('Daily Program already exists.');
    }
}

async function main() {
    try {
        await seedExercises();
        await seedDailyProgram();
    } catch (error) {
        console.error('Error seeding data:', error);
    }
    // Force exit to ensure script ends
    if (typeof process !== 'undefined' && process.exit) {
        process.exit(0);
    }
}

main();
