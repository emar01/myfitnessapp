
import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';

// Config
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

const workouts = [
    {
        id: 'run_back_10x45',
        name: 'Backpass 10 x 45',
        category: 'löpning',
        subcategory: 'intervall',
        exercises: [],
        note: `Du kör 10 x 45 sekunder i en längre backe (inte för brant).\n\nDu ska springa 10 gånger uppför en backe, mysigt! Hitta om möjligt en lite flackare backe, dvs. inte för brant. Du kan springa passet lätt progressivt, dvs. att du ökar farten uppför backen efterhand. Första 1-2 stycken ska du ligga lite snabbare än distansfart för att sen öka lätt.\n\nNär du nått toppen av backen vänder du om och joggar (joggvila) nerför backen följt av att stå stilla i runt 30 sekunder (ståvila) i botten av backen innan du springer uppför igen.`
    },
    {
        id: 'run_distans_40_50',
        name: 'Distans 40-50min',
        category: 'löpning',
        subcategory: 'distans',
        exercises: [],
        note: `Distanspasset är ett av de viktigaste passen som bygger din löpargrund. Passet kan vara alltifrån 20-90 minuter och gör att kroppen och benen vänjer sig vid att vara i löparskorna.`
    },
    {
        id: 'run_long_75_90',
        name: 'Långpass 75-90',
        category: 'löpning',
        subcategory: 'långpass',
        exercises: [],
        note: `Långpasset är ett av de viktigaste passen för att bygga uthållighet och träna kroppen på att vara igång länge! Beroende på känslan i kroppen kan du springa någonstans mellan 60 - 75 minuter.`
    },
    {
        id: 'run_fartlek_pyramid',
        name: 'Fartlek 5-4-3-2-1 min',
        category: 'löpning',
        subcategory: 'intervall',
        exercises: [],
        note: `Du springer en minutstege som börjar på 5 minuter i strax över din milfart. Sen ökar du successivt farten för varje trappsteg (4-3-2-1 min). Mellan varje trappsteg joggar du lugnt i 90 sekunder.`
    },
    {
        id: 'run_tempo_5km',
        name: 'Fartpass 5km tempo',
        category: 'löpning',
        subcategory: 'intervall',
        exercises: [],
        note: `Dags att få upp farten! Förbered dig som om det vore tävling och försök springa 5 kilometer tempo som går i runt din milfart!`
    },
    // Add more if needed, but these basics cover the logic
];

async function main() {
    console.log("Starting Marathon Rebuild...");

    // 1. Upsert Templates
    const templatesRef = collection(db, 'workout_templates');
    const validTemplateIds: string[] = [];

    for (const w of workouts) {
        const ref = doc(templatesRef, w.id);
        // Add duration/distance metadata for program logic
        let duration = 45;
        let distance = 0;
        if (w.subcategory === 'långpass') duration = 90;
        if (w.subcategory === 'distans') duration = 50;

        await setDoc(ref, { ...w, duration, distance }, { merge: true });
        console.log(`Upserted Template: ${w.name}`);
        validTemplateIds.push(w.id);
    }

    // 2. Build Schedule
    const schedule = [];
    const weeks = 12;

    // We cycle through our static list for variety
    const speed = workouts.filter(w => w.subcategory === 'intervall');
    const dist = workouts.filter(w => w.subcategory === 'distans');
    const long = workouts.filter(w => w.subcategory === 'långpass');

    for (let w = 0; w < weeks; w++) {
        // Week ends with Race
        if (w === weeks - 1) {
            schedule.push({
                dayOffset: (w * 7) + 1, // Tue
                workoutTitle: "Lätt Fartlek (Taper)",
                description: "Korta intervaller för att hålla benen pigga inför loppet.",
                workoutTemplateId: speed[0]?.id
            });
            schedule.push({
                dayOffset: (w * 7) + 3, // Thu
                workoutTitle: "Jogg 20 min (Taper)",
                description: "Mycket lugn jogg för att väcka kroppen.",
                workoutTemplateId: dist[0]?.id
            });
            schedule.push({
                dayOffset: (w * 7) + 6, // Sun
                workoutTitle: "MARATONLOPPET",
                description: "Idag gäller det! Lycka till på dina 42km.",
                // No template
            });
        } else {
            // Tue: Speed
            if (speed.length > 0) {
                const t = speed[w % speed.length];
                schedule.push({
                    dayOffset: (w * 7) + 1,
                    workoutTemplateId: t.id,
                    workoutTitle: t.name
                });
            }
            // Thu: Distans
            if (dist.length > 0) {
                const t = dist[w % dist.length];
                schedule.push({
                    dayOffset: (w * 7) + 3,
                    workoutTemplateId: t.id,
                    workoutTitle: t.name
                });
            }
            // Sun: Long
            if (long.length > 0) {
                const t = long[w % long.length];
                schedule.push({
                    dayOffset: (w * 7) + 6,
                    workoutTemplateId: t.id,
                    workoutTitle: t.name
                });
            }
        }
    }

    // 3. Delete Old Program
    const programsRef = collection(db, 'programs');
    const q = query(programsRef, where('title', '==', 'Maratonprogram (12 veckor)'));
    const oldSnap = await getDocs(q);
    for (const d of oldSnap.docs) {
        console.log(`Deleting old program version: ${d.id}`);
        await deleteDoc(d.ref);
    }

    // 4. Create New Program
    const newProgram = {
        title: "Maratonprogram (12 veckor)",
        duration: "12 veckor",
        type: "period",
        category: "Löpning",
        description: "Ett 12-veckors program för dig som vill klara maraton. Blandad träning med distans, fartlek och långpass.",
        schedule: schedule,
        workoutIds: validTemplateIds,
        createdAt: new Date()
    };

    const docRef = await addDoc(programsRef, newProgram);
    console.log(`Created NEW Marathon Program: ${docRef.id}`);
}

main().catch(console.error);
