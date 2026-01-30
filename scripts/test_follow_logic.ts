import 'dotenv/config';
import { collection, doc, getDoc, getDocs, limit, query, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebaseConfig";

const TEST_USER_ID = "test_user_logic_verification";

async function verifyProgramLogic() {
    console.log("Starting Logic Verification...");

    // 1. Fetch a program
    console.log("Fetching a program...");
    const programsRef = collection(db, 'programs');
    const q = query(programsRef, limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
        console.error("No programs found in DB! Cannot test.");
        return;
    }

    const programDoc = snap.docs[0];
    const program = { id: programDoc.id, ...programDoc.data() } as any; // simplified type
    console.log(`Found program: ${program.title} (${program.id})`);

    if (!program.schedule || program.schedule.length === 0) {
        console.error("Program has no schedule.");
        return;
    }

    // 2. Simulate "Follow" Logic
    console.log("Simulating 'Follow' logic...");

    try {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0); // Normalize

        const workoutsToCreate = [];

        for (const item of program.schedule) {
            const scheduledDate = new Date(startDate);
            scheduledDate.setDate(startDate.getDate() + item.dayOffset);

            // Fetch template (simplified simulation)
            let exerciseData: any[] = [];
            if (item.workoutTemplateId) {
                // In real app we fetch template. Let's try one.
                try {
                    const tRef = doc(db, 'workout_templates', item.workoutTemplateId);
                    const tSnap = await getDoc(tRef);
                    if (tSnap.exists()) {
                        exerciseData = (tSnap.data() as any).exercises || [];
                    }
                } catch (e) {
                    console.log("Template fetch warning (expected in test if IDs mismatch):", e);
                }
            }

            workoutsToCreate.push({
                userId: TEST_USER_ID,
                name: item.workoutTitle || 'Test Workout',
                status: 'Planned',
                date: new Date(),
                scheduledDate: scheduledDate,
                exercises: exerciseData,
                programId: program.id,
                notes: `TEST ENTRY`
            });
        }

        console.log(`Prepared ${workoutsToCreate.length} workouts.`);

        // 3. Perform Batch Write
        const batch = writeBatch(db);
        let count = 0;

        workoutsToCreate.slice(0, 10).forEach(w => { // Limit to 10 for test
            const newRef = doc(collection(db, `users/${TEST_USER_ID}/workouts`));
            batch.set(newRef, w);
            count++;
        });

        // Add Active Program
        const activeRef = doc(db, 'users', TEST_USER_ID, 'active_programs', program.id);
        batch.set(activeRef, {
            programId: program.id,
            startedAt: new Date(),
            title: program.title
        });

        console.log(`Committing batch of ${count} items...`);
        await batch.commit();
        console.log("Batch commit SUCCESSFUL.");
        console.log("Logic Verification Passed: Firestore writes are working.");

    } catch (e: any) {
        console.error("Logic Verification FAILED:");
        console.error(e);
        if (e.code === 'permission-denied') {
            console.error("CAUSE: Firestore Rules are blocking the write.");
        }
    }
}

async function main() {
    await verifyProgramLogic();
    if (typeof process !== 'undefined' && process.exit) {
        process.exit(0);
    }
}

main();
