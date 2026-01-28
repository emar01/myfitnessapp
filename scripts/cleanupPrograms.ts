import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebaseConfig";

const KEEP_TITLES = [
    'Maratonprogram (Bas)',
    'Rehab/Prehab: Knä & Rygg',
    'Styrka för Löpare'
];

async function cleanupPrograms() {
    console.log("Cleaning up old programs...");
    const programsRef = collection(db, "programs");
    const snapshot = await getDocs(programsRef);

    if (snapshot.empty) {
        console.log("No programs found.");
        return;
    }

    let deletedCount = 0;

    for (const d of snapshot.docs) {
        const data = d.data();
        if (!KEEP_TITLES.includes(data.title)) {
            console.log(`Deleting: ${data.title} (${d.id})`);
            await deleteDoc(doc(db, "programs", d.id));
            deletedCount++;
        } else {
            console.log(`Keeping: ${data.title}`);
        }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} programs.`);
}

async function main() {
    try {
        await cleanupPrograms();
    } catch (error) {
        console.error('Error cleaning up:', error);
    }
    if (typeof process !== 'undefined' && process.exit) {
        process.exit(0);
    }
}

main();
