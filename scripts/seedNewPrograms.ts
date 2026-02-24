import 'dotenv/config';
import { initializeApp } from "firebase/app";
import { collection, doc, getDocs, getFirestore, setDoc } from "firebase/firestore";

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

// Helper function to build 10km program
function build10kmProgram(templates: any[]) {
    const distans = templates.filter(t => t.subcategory === 'distans' && !t.name.toLowerCase().includes('trail'));
    const speed = templates.filter(t => t.subcategory === 'intervall' || t.subcategory === 'fartpass');
    const long = templates.filter(t => t.subcategory === 'långpass' && t.name.includes('75-90'));

    const schedule = [];
    const weeks = 10;

    for (let w = 0; w < weeks; w++) {
        // Tuesday: Speed
        if (w === weeks - 1) {
            schedule.push({
                dayOffset: w * 7 + 1,
                workoutTitle: "Lätt jogg 20 min (Taper)",
                description: "Lugn jogg för att hålla benen pigga."
            });
            schedule.push({
                dayOffset: w * 7 + 5, // Saturday Race
                workoutTitle: "10km LOPP",
                description: "Ge allt och ha kul!"
            });
        } else {
            const speedT = speed[w % speed.length];
            if (speedT) {
                schedule.push({ dayOffset: w * 7 + 1, workoutTemplateId: speedT.id, workoutTitle: speedT.name });
            }
            // Thursday: Distans
            const distT = distans[w % distans.length];
            if (distT) {
                schedule.push({ dayOffset: w * 7 + 3, workoutTemplateId: distT.id, workoutTitle: distT.name });
            }
            // Sunday: Long pass (only occasionally long, mostly 60 min or up to 90)
            const longT = (w >= 4 && long.length > 0) ? long[0] : distans[0];
            if (longT) {
                schedule.push({ dayOffset: w * 7 + 6, workoutTemplateId: longT.id, workoutTitle: longT.name });
            }
        }
    }

    return {
        id: "program_10km_10v",
        title: "Milstjärnan (10 veckor)",
        duration: "10 veckor",
        type: "period",
        category: "Löpning",
        description: "Bli stark och snabb på 10km. 3 pass i veckan: Intervaller, distans och ett längre pass på helgen.",
        schedule: schedule,
        isPublic: true,
        workoutIds: Array.from(new Set(schedule.map(s => s.workoutTemplateId).filter(id => id)))
    };
}

// Helper function to build 21km program
function build21kmProgram(templates: any[]) {
    const distans = templates.filter(t => t.subcategory === 'distans' && !t.name.toLowerCase().includes('trail'));
    const speed = templates.filter(t => t.subcategory === 'intervall' || t.subcategory === 'fartpass');
    // For 21km we use long passes 75-90m and 120-130m
    const long75 = templates.filter(t => t.subcategory === 'långpass' && t.name.includes('75'));
    const long120 = templates.filter(t => t.subcategory === 'långpass' && t.name.includes('120'));

    const schedule = [];
    const weeks = 12;

    for (let w = 0; w < weeks; w++) {
        if (w === weeks - 1) {
            schedule.push({ dayOffset: w * 7 + 1, workoutTitle: "Korta intervaller (Taper)", description: "5x1 min för benen." });
            schedule.push({ dayOffset: w * 7 + 3, workoutTitle: "Vilojogg 20 min", description: "Väldigt långsam jogg." });
            schedule.push({ dayOffset: w * 7 + 6, workoutTitle: "HALVMARATON 21,1 KM", description: "Loppdags!" });
        } else {
            // Monday: Lätt distans (Optional for more advanced)
            if (w % 2 !== 0 && distans.length > 1) {
                schedule.push({ dayOffset: w * 7 + 0, workoutTemplateId: distans[1].id, workoutTitle: "Lugn Distans" });
            }
            // Wednesday: Fartpass/Intervall
            const speedT = speed[w % speed.length];
            if (speedT) {
                schedule.push({ dayOffset: w * 7 + 2, workoutTemplateId: speedT.id, workoutTitle: speedT.name });
            }
            // Friday: Distans
            const distT = distans[w % distans.length];
            if (distT) {
                schedule.push({ dayOffset: w * 7 + 4, workoutTemplateId: distT.id, workoutTitle: distT.name });
            }
            // Sunday: Långpass
            let longT = null;
            if (w < 4) longT = long75[0] || distans[0];
            else if (w < 9) longT = long120[0] || (long75[0] || distans[0]);
            else longT = long75[0] || distans[0]; // Taper down slightly

            if (longT) {
                schedule.push({ dayOffset: w * 7 + 6, workoutTemplateId: longT.id, workoutTitle: longT.name });
            }
        }
    }

    return {
        id: "program_21km_12v",
        title: "Halvmaraton (12 veckor)",
        duration: "12 veckor",
        type: "period",
        category: "Löpning",
        description: "12 veckor mot 21,1 km. Ett gediget träningsprogram för att bygga uthållighet till halvmaran.",
        schedule: schedule,
        isPublic: true,
        workoutIds: Array.from(new Set(schedule.map(s => s.workoutTemplateId).filter(id => id)))
    };
}

// Helper function to build Ultravasan 90km program
function buildUltravasanProgram(templates: any[]) {
    // 40 weeks program (approximated for Ultra 90)
    // We sample a block of 4 weeks and extend it to 40, to avoid hardcoding 40 independent weeks.
    // For simplicity, we create a structured 40 week plan.

    // Categorizing workouts
    const distans = templates.filter(t => t.subcategory === 'distans' && !t.name.toLowerCase().includes('trail'));
    const trail = templates.filter(t => t.name.toLowerCase().includes('trail'));
    const speed = templates.filter(t => t.subcategory === 'intervall' || t.subcategory === 'fartpass');

    const long120 = templates.filter(t => t.subcategory === 'långpass' && t.name.includes('120'));
    const long3h = templates.find(t => t.id === 'langpass_ultra_3h' || (t.name && t.name.includes('3h')));
    const long4h = templates.find(t => t.id === 'langpass_ultra_4h' || (t.name && t.name.includes('4h')));
    const backToBack = templates.find(t => t.id === 'backtoback_langpass_2h' || (t.name && t.name.includes('back-to-back')));

    const strength = templates.find(t => t.id === 'loparstyrka_core__ben' || t.name === 'Löparstyrka: Core & Ben');

    const schedule = [];
    const weeks = 40;

    for (let w = 0; w < weeks; w++) {
        // Week ends
        if (w === weeks - 1) {
            // Race week
            schedule.push({ dayOffset: w * 7 + 1, workoutTitle: "Vilojogg 30 min", description: "Luta dig tillbaka, allt jobb är gjort!" });
            schedule.push({ dayOffset: w * 7 + 5, workoutTitle: "ULTRAVASAN 90KM", description: "Bara att stoppa in fötterna i mål!" });
            continue;
        }

        // Phase 1: Base (Weeks 0-12)
        // Phase 2: Capacity (Weeks 13-24)
        // Phase 3: Specific Ultra Prep (Weeks 25-36)
        // Phase 4: Taper (Weeks 37-38)

        let isBackToBackWeek = (w >= 26 && w <= 34 && w % 2 === 0);
        let longP = null;
        let is3h = (w >= 14 && w <= 22);
        let is4h = (w >= 24 && w <= 34);

        if (is4h) longP = long4h || long120[0];
        else if (is3h) longP = long3h || long120[0];
        else longP = long120[0] || distans[0];

        // Tuesday: Strength + Short Run (if early phase) or Speed
        if (w < 20) {
            if (strength) schedule.push({ dayOffset: w * 7 + 1, workoutTemplateId: strength.id, workoutTitle: strength.name });
            if (distans.length > 0) schedule.push({ dayOffset: w * 7 + 2, workoutTemplateId: distans[0].id, workoutTitle: distans[0].name });
        } else {
            const speedT = speed[w % speed.length];
            if (speedT) schedule.push({ dayOffset: w * 7 + 1, workoutTemplateId: speedT.id, workoutTitle: speedT.name });
        }

        // Thursday: Trail
        const trailT = trail[0] || distans[0];
        if (trailT && w % 2 === 0) {
            schedule.push({ dayOffset: w * 7 + 3, workoutTemplateId: trailT.id, workoutTitle: trailT.name });
        } else if (distans.length > 1) {
            schedule.push({ dayOffset: w * 7 + 3, workoutTemplateId: distans[1].id, workoutTitle: distans[1].name });
        }

        // Weekend: Long + potentially back-to-back
        if (longP) {
            schedule.push({ dayOffset: w * 7 + 5, workoutTemplateId: longP.id, workoutTitle: longP.name }); // Saturday
        }

        if (isBackToBackWeek && backToBack) {
            schedule.push({ dayOffset: w * 7 + 6, workoutTemplateId: backToBack.id, workoutTitle: backToBack.name }); // Sunday
        } else if (strength && w % 3 === 0) {
            schedule.push({ dayOffset: w * 7 + 6, workoutTemplateId: strength.id, workoutTitle: strength.name }); // Sunday alternative
        }

    }

    return {
        id: "program_ultravasan90_40v",
        title: "Ultravasan 90 (40 veckor)",
        duration: "40 veckor",
        type: "period", // period means it's a fixed plan
        category: "Löpning",
        description: "Den ultimata utmaningen: 90km löpning. Ett 10 månaders program för att bygga pannben, uthållighet och sen-tålighet för dig som satsar på Ultravasan.",
        schedule: schedule,
        isPublic: true,
        workoutIds: Array.from(new Set(schedule.map(s => s.workoutTemplateId).filter(id => id)))
    };
}

async function main() {
    console.log("Fetching templates...");
    const templatesRef = collection(db, 'workout_templates');
    const snapshot = await getDocs(templatesRef);
    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`Loaded ${templates.length} templates. Building programs...`);

    const p10k = build10kmProgram(templates);
    const p21k = build21kmProgram(templates);
    const pUlt = buildUltravasanProgram(templates);

    const programsRef = collection(db, 'programs');

    for (const prog of [p10k, p21k, pUlt]) {
        console.log(`Saving program: ${prog.title}`);
        await setDoc(doc(programsRef, prog.id), prog, { merge: true });
    }

    console.log("All programs seeded successfully!");
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
