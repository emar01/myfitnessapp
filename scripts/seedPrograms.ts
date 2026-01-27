import { addDoc, collection, getDocs, limit, query } from "firebase/firestore";
import programsData from '../data/programs.json';
import { db } from "../lib/firebaseConfig";

export async function seedPrograms() {
    const programsRef = collection(db, "programs");

    // Check if any programs exist
    const q = query(programsRef, limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        console.log("Programs already seeded.");
        return;
    }

    console.log("Seeding programs from JSON source...");
    for (const program of programsData) {
        await addDoc(programsRef, program);
        console.log(`Added Program: ${program.title}`);
    }
    console.log("Programs seeding complete.");
}
