import 'dotenv/config';
import { collection, doc, setDoc } from "firebase/firestore";
import { ultraWorkouts } from "../data/ultraWorkouts";
import { db } from "../lib/firebaseConfig";

async function seedUltraWorkouts() {
    console.log('Seeding Ultra Workouts...');
    const templatesCollection = collection(db, 'workout_templates');

    let count = 0;
    for (const w of ultraWorkouts) {
        // Generate an ID based on name or use a specific format
        const idStr = w.name?.toLowerCase().replace(/ /g, '_').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9_]/g, '') || `ultra_workout_${count}`;

        const ref = doc(templatesCollection, idStr);
        await setDoc(ref, { id: idStr, isPublic: true, ...w }, { merge: true });
        console.log(`Upserted: ${w.name} (${idStr})`);
        count++;
    }
    console.log('Seeding complete.');
}

async function main() {
    try {
        await seedUltraWorkouts();
    } catch (error) {
        console.error('Error seeding data:', error);
    }
    if (typeof process !== 'undefined' && process.exit) {
        process.exit(0);
    }
}

main();
