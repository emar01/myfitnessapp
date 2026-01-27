import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import exercisesData from '../data/exercises.json';
import { db } from "../lib/firebaseConfig";

export async function seedExercises() {
    const exercisesRef = collection(db, "exercises");

    // Check if already seeded (simple check)
    // We check for "Bench Press" specifically as a marker
    const q = query(exercisesRef, where("name", "==", "Bench Press"));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        console.log("Exercises already seeded.");
        return;
    }

    console.log("Seeding exercises from JSON source...");
    // Sequential add (could be Promise.all but this is safer for rate limits locally)
    for (const exercise of exercisesData) {
        await addDoc(exercisesRef, exercise);
        console.log(`Added: ${exercise.name}`);
    }
    console.log("Seeding complete.");
}
