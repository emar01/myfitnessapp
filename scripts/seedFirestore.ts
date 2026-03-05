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

export async function seedPrograms() {
    console.log('Seeding Programs...');
    const programsCollection = collection(db, 'programs');
    const templatesCollection = collection(db, 'workout_templates');

    // 1. Define Templates needed for the programs
    const templates = [
        {
            id: 'template_run_distans_5km',
            name: 'Distanspass 5km',
            category: 'löpning',
            subcategory: 'distans',
            exercises: [],
            note: 'Lugnt tempo, fokus på teknik.'
        },
        {
            id: 'template_run_intervall_4x4',
            name: 'Intervaller 4x4 min',
            category: 'löpning',
            subcategory: 'intervall',
            exercises: [],
            note: '4 min hårt, 3 min vila. Upprepa 4 gånger.'
        },
        {
            id: 'template_run_long_15km',
            name: 'Långpass 15km',
            category: 'löpning',
            subcategory: 'långpass',
            exercises: [],
            note: 'Långsamt tempo, vänj kroppen vid belastning.'
        },
        {
            id: 'template_strength_rehab_knee',
            name: 'Knästabilitet & Prehab',
            category: 'rehab',
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
            note: 'Fokus på kontroll och balans. Vila 60 sek mellan set.'
        },
        {
            id: 'template_strength_runner_leg',
            name: 'Benstyrka för löpare',
            category: 'styrketräning',
            subcategory: 'styrka',
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
        }
    ];

    // Upload Templates
    for (const t of templates) {
        const ref = doc(templatesCollection, t.id);
        await setDoc(ref, t, { merge: true });
    }

    // 2. Define Programs

    // Helper to create Marathon Schedule
    const createMarathonSchedule = () => {
        const schedule = [];
        for (let week = 0; week < 12; week++) {
            // Tuesday: Short Distance
            schedule.push({ dayOffset: week * 7 + 1, workoutTemplateId: 'template_run_distans_5km', workoutTitle: `Distans ${5 + Math.floor(week / 2)}km` }); // Increase distance every 2 weeks conceptually (title only)

            // Thursday: Intervals
            schedule.push({ dayOffset: week * 7 + 3, workoutTemplateId: 'template_run_intervall_4x4', workoutTitle: 'Intervaller 4x4' });

            // Sunday: Long Run
            const longDist = 10 + week;
            if (week % 4 === 3) { // Recovery week every 4th
                schedule.push({ dayOffset: week * 7 + 6, workoutTemplateId: 'template_run_distans_5km', workoutTitle: 'Återhämtning 6km' });
            } else {
                schedule.push({ dayOffset: week * 7 + 6, workoutTemplateId: 'template_run_long_15km', workoutTitle: `Långpass ${longDist}km` });
            }
        }
        return schedule;
    };

    const marathonProgram = {
        title: 'Maratonprogram (Bas)',
        duration: '12 veckor',
        type: 'period',
        category: 'Löpning',
        description: 'Ett 12-veckors program för att klara ditt första maraton. Fokus på gradvis ökning.',
        schedule: createMarathonSchedule()
    };

    // Helper for Rehab
    const createRehabSchedule = () => {
        const schedule = [];
        for (let week = 0; week < 4; week++) {
            schedule.push({ dayOffset: week * 7 + 0, workoutTemplateId: 'template_strength_rehab_knee', workoutTitle: 'Pass 1: Stabilitet' });
            schedule.push({ dayOffset: week * 7 + 2, workoutTemplateId: 'template_strength_rehab_knee', workoutTitle: 'Pass 2: Stabilitet' });
            schedule.push({ dayOffset: week * 7 + 5, workoutTemplateId: 'template_strength_rehab_knee', workoutTitle: 'Pass 3: Stabilitet' });
        }
        return schedule;
    };

    const rehabProgram = {
        title: 'Rehab/Prehab: Knä & Rygg',
        duration: '4 veckor',
        type: 'period',
        category: 'Rehab',
        description: 'Stärk upp säte, lår och core för att skydda knän och ryggslut.',
        schedule: createRehabSchedule()
    };

    // Helper for Strength
    const createStrengthSchedule = () => {
        const schedule = [];
        for (let week = 0; week < 8; week++) {
            schedule.push({ dayOffset: week * 7 + 1, workoutTemplateId: 'template_strength_runner_leg', workoutTitle: 'Benstyrka' });
            schedule.push({ dayOffset: week * 7 + 3, workoutTemplateId: 'template_strength_rehab_knee', workoutTitle: 'Core & Balans' });
            schedule.push({ dayOffset: week * 7 + 5, workoutTemplateId: 'template_strength_runner_leg', workoutTitle: 'Benstyrka Tungt' });
        }
        return schedule;
    }

    const strengthRunnersProgram = {
        title: 'Styrka för Löpare',
        duration: '8 veckor',
        type: 'period',
        category: 'Styrketräning',
        description: '3 pass i veckan för att bygga en hållbar löparkropp.',
        schedule: createStrengthSchedule()
    };

    const existingPrograms = [marathonProgram, rehabProgram, strengthRunnersProgram];

    for (const p of existingPrograms) {
        // Check if exists by title to avoid dups or just add
        const q = query(programsCollection, where('title', '==', p.title));
        const snap = await getDocs(q);
        if (snap.empty) {
            await addDoc(programsCollection, p);
            console.log(`Created Program: ${p.title}`);
        } else {
            // Update
            const docId = snap.docs[0].id;
            await setDoc(doc(programsCollection, docId), p, { merge: true });
            console.log(`Updated Program: ${p.title}`);
        }
    }
}

async function main() {
    try {
        await seedExercises();
        await seedPrograms();
    } catch (error) {
        console.error('Error seeding data:', error);
    }
    // Force exit to ensure script ends
    if (typeof process !== 'undefined' && process.exit) {
        process.exit(0);
    }
}

main();
