
require('dotenv').config(); // Load .env before anything else
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, deleteDoc, doc, updateDoc, addDoc } = require('firebase/firestore');

// Manual config reconstruction
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to parse metadata
function parseMetadata(t: any) {
    let duration = t.duration;
    let distance = t.distance;

    // Check Duration in Name (e.g. "45 min")
    const durationMatch = t.name.match(/(\d+)\s?min/i);
    if (durationMatch) {
        duration = parseInt(durationMatch[1]);
    }

    // Check Distance in Name (e.g. "10 km", "10km")
    const distanceMatch = t.name.match(/(\d+)\s?km/i);
    if (distanceMatch) {
        distance = parseFloat(distanceMatch[1]);
    }

    // Heuristics/Defaults if missing
    if (!duration) {
        if (t.subcategory === 'långpass') duration = 90;
        else if (t.subcategory === 'distans') duration = 45;
        else if (t.subcategory === 'fartpass') duration = 45;
    }

    return { distance, duration };
}

async function main() {
    console.log("Starting DB Update...");

    // 1. Fetch Templates
    const templatesRef = collection(db, 'workout_templates');
    const snapshot = await getDocs(templatesRef);
    const templates = [];

    console.log(`Found ${snapshot.size} templates.`);

    // 2. Update Metadata
    for (const d of snapshot.docs) {
        const data = d.data();
        const { distance, duration } = parseMetadata(data);

        // Only update if changed or new
        const updates: any = {};
        if (duration !== undefined && duration !== data.duration) updates.duration = duration;
        if (distance !== undefined && distance !== data.distance) updates.distance = distance;

        if (Object.keys(updates).length > 0) {
            console.log(`Updating ${data.name}:`, updates);
            await updateDoc(d.ref, updates);
        }

        templates.push({ id: d.id, ...data, distance, duration });
    }

    // 3. Delete Old Program
    const programsRef = collection(db, 'programs');
    const oldProgQuery = query(programsRef, where('title', '==', 'Maratonprogram (bas)'));
    const oldProgSnap = await getDocs(oldProgQuery);

    for (const d of oldProgSnap.docs) {
        console.log(`Deleting old program: ${d.data().title}`);
        await deleteDoc(d.ref);
    }

    // 4. Create New 12-Week Program
    // Group templates
    // Ensure case-insensitive matching
    const distansTemplates = templates.filter(t => t.subcategory === 'distans' || (t.name && t.name.toLowerCase().includes('distans')));
    const speedTemplates = templates.filter(t => t.subcategory === 'fartpass' || t.subcategory === 'intervall' || (t.name && (t.name.toLowerCase().includes('fart') || t.name.toLowerCase().includes('intervall'))));
    const longTemplates = templates.filter(t => t.subcategory === 'långpass' || (t.name && t.name.toLowerCase().includes('långpass')));

    const schedule = [];
    const weeks = 12;

    for (let w = 0; w < weeks; w++) {
        // Week starts Monday.

        // Items to add this week
        let tuesdayWorkout;
        let thursdayWorkout;
        let sundayWorkout;

        if (w === weeks - 1) {
            // Week 12: Taper & Race using lighter generic templates or custom titles
            // Tuesday: Light speed
            tuesdayWorkout = {
                dayOffset: (w * 7) + 1, // Tue
                workoutTitle: "Lätt Fartlek (Taper)",
                description: "Korta intervaller för att hålla benen pigga inför loppet.",
                workoutTemplateId: speedTemplates[0] ? speedTemplates[0].id : undefined
            };

            // Thursday: Very short distans
            thursdayWorkout = {
                dayOffset: (w * 7) + 3, // Thu
                workoutTitle: "Jogg 20 min (Taper)",
                description: "Mycket lugn jogg för att väcka kroppen.",
                workoutTemplateId: distansTemplates[0] ? distansTemplates[0].id : undefined
            };

            // Sunday: THE RACE
            sundayWorkout = {
                dayOffset: (w * 7) + 6, // Sun
                workoutTitle: "MARATONLOPPET",
                description: "Idag gäller det! Lycka till på dina 42km.",
                // No template ID, just title
            };

        } else {
            // Normal Training Weeks
            const speedT = speedTemplates.length > 0 ? speedTemplates[w % speedTemplates.length] : null;
            const distT = distansTemplates.length > 0 ? distansTemplates[w % distansTemplates.length] : null;
            const longT = longTemplates.length > 0 ? longTemplates[w % longTemplates.length] : null;

            if (speedT) {
                tuesdayWorkout = {
                    dayOffset: (w * 7) + 1, // Tue
                    workoutTemplateId: speedT.id,
                    workoutTitle: speedT.name
                };
            }

            if (distT) {
                thursdayWorkout = {
                    dayOffset: (w * 7) + 3, // Thu
                    workoutTemplateId: distT.id,
                    workoutTitle: distT.name
                };
            }

            if (longT) {
                sundayWorkout = {
                    dayOffset: (w * 7) + 6, // Sun
                    workoutTemplateId: longT.id,
                    workoutTitle: longT.name
                };
            }
        }

        if (tuesdayWorkout) schedule.push(tuesdayWorkout);
        if (thursdayWorkout) schedule.push(thursdayWorkout);
        if (sundayWorkout) schedule.push(sundayWorkout);
    }

    const newProgram = {
        title: "Maratonprogram (12 veckor)",
        duration: "12 veckor",
        type: "period",
        category: "Löpning",
        description: "Ett 12-veckors program för dig som vill klara maraton. Blandad träning med distans, fartlek och långpass.",
        schedule: schedule, // The schedule items contain the template connections
        workoutIds: templates.map(t => t.id) // loosely associated templates
    };

    const docRef = await addDoc(collection(db, 'programs'), newProgram);
    console.log(`Created new program with ID: ${docRef.id}`);
}

main().catch(console.error);
