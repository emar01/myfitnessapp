import 'dotenv/config';
import { initializeApp } from "firebase/app";
import { collection, doc, getFirestore, setDoc } from "firebase/firestore";

function getFirebaseConfig() {
    return {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };
}

const app = initializeApp(getFirebaseConfig());
const db = getFirestore(app);

const strengthTemplates = [
    {
        id: 'template_strength_runner_leg',
        name: 'Benstyrka för löpare',
        category: 'styrketräning',
        subcategory: 'styrka',
        isPublic: true,
        exercises: [
            {
                exerciseId: 'ex_lunge',
                name: 'Utfall',
                isBodyweight: false,
                sets: [
                    { id: 's1', reps: 10, weight: 10, isCompleted: false, type: 'normal' },
                    { id: 's2', reps: 10, weight: 10, isCompleted: false, type: 'normal' },
                    { id: 's3', reps: 10, weight: 10, isCompleted: false, type: 'normal' },
                ]
            },
            {
                exerciseId: 'ex_dl',
                name: 'Marklyft',
                isBodyweight: false,
                sets: [
                    { id: 's1', reps: 8, weight: 40, isCompleted: false, type: 'normal' },
                    { id: 's2', reps: 8, weight: 40, isCompleted: false, type: 'normal' },
                    { id: 's3', reps: 8, weight: 40, isCompleted: false, type: 'normal' },
                ]
            },
            {
                exerciseId: 'ex_calf',
                name: 'Tåhävningar',
                isBodyweight: true,
                sets: [
                    { id: 's1', reps: 20, weight: 0, isCompleted: false, type: 'normal' },
                    { id: 's2', reps: 20, weight: 0, isCompleted: false, type: 'normal' },
                    { id: 's3', reps: 20, weight: 0, isCompleted: false, type: 'normal' },
                ]
            },
            {
                exerciseId: 'ex_squat',
                name: 'Knäböj',
                isBodyweight: false,
                sets: [
                    { id: 's1', reps: 10, weight: 40, isCompleted: false, type: 'normal' },
                    { id: 's2', reps: 10, weight: 40, isCompleted: false, type: 'normal' },
                    { id: 's3', reps: 10, weight: 40, isCompleted: false, type: 'normal' },
                ]
            },
            {
                exerciseId: 'ex_single_leg_dl',
                name: 'Enbensmarklyft',
                isBodyweight: false,
                sets: [
                    { id: 's1', reps: 10, weight: 15, isCompleted: false, type: 'normal' },
                    { id: 's2', reps: 10, weight: 15, isCompleted: false, type: 'normal' },
                    { id: 's3', reps: 10, weight: 15, isCompleted: false, type: 'normal' },
                ]
            },
        ],
    },
    {
        id: 'template_strength_rehab_knee',
        name: 'Knästabilitet & Prehab',
        category: 'rehab',
        isPublic: true,
        exercises: [
            {
                exerciseId: 'ex_squat',
                name: 'Knäböj (kroppsvikt)',
                isBodyweight: true,
                sets: [
                    { id: 's1', reps: 15, weight: 0, isCompleted: false, type: 'normal' },
                    { id: 's2', reps: 15, weight: 0, isCompleted: false, type: 'normal' },
                    { id: 's3', reps: 15, weight: 0, isCompleted: false, type: 'normal' },
                ]
            },
            {
                exerciseId: 'ex_stepup',
                name: 'Step-ups',
                isBodyweight: true,
                sets: [
                    { id: 's1', reps: 12, weight: 0, isCompleted: false, type: 'normal' },
                    { id: 's2', reps: 12, weight: 0, isCompleted: false, type: 'normal' },
                    { id: 's3', reps: 12, weight: 0, isCompleted: false, type: 'normal' },
                ]
            },
            {
                exerciseId: 'ex_plank',
                name: 'Plankan',
                isBodyweight: true,
                sets: [
                    { id: 's1', reps: 1, weight: 0, isCompleted: false, type: 'normal', duration: 60 },
                    { id: 's2', reps: 1, weight: 0, isCompleted: false, type: 'normal', duration: 60 },
                    { id: 's3', reps: 1, weight: 0, isCompleted: false, type: 'normal', duration: 60 },
                ]
            },
            {
                exerciseId: 'ex_glute_bridge',
                name: 'Höftlyft / Glute Bridge',
                isBodyweight: true,
                sets: [
                    { id: 's1', reps: 15, weight: 0, isCompleted: false, type: 'normal' },
                    { id: 's2', reps: 15, weight: 0, isCompleted: false, type: 'normal' },
                    { id: 's3', reps: 15, weight: 0, isCompleted: false, type: 'normal' },
                ]
            },
            {
                exerciseId: 'ex_side_plank',
                name: 'Sidoplankan',
                isBodyweight: true,
                sets: [
                    { id: 's1', reps: 1, weight: 0, isCompleted: false, type: 'normal', duration: 45 },
                    { id: 's2', reps: 1, weight: 0, isCompleted: false, type: 'normal', duration: 45 },
                    { id: 's3', reps: 1, weight: 0, isCompleted: false, type: 'normal', duration: 45 },
                ]
            },
        ],
        note: 'Fokus på kontroll och balans. Vila 60 sek mellan set.',
    },
];

async function seedStrengthTemplates() {
    console.log('Seeding strength templates...');
    const templatesCollection = collection(db, 'workout_templates');

    for (const t of strengthTemplates) {
        const ref = doc(templatesCollection, t.id);
        await setDoc(ref, t, { merge: true });
        console.log(`Upserted: ${t.name} (${t.id})`);
    }
    console.log('Done!');
}

async function main() {
    try {
        await seedStrengthTemplates();
    } catch (error) {
        console.error('Error:', error);
    }
    if (typeof process !== 'undefined' && process.exit) {
        process.exit(0);
    }
}

main();
