import { db } from '@/lib/firebaseConfig';
import { UserProfile } from '@/types';
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';

export async function buildAiContext(userId: string): Promise<string> {
    try {
        console.log("Building AI Context for user:", userId);

        // 1. Fetch Recent Workouts (Last 14 days)
        // We calculate the date 14 days ago
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const workoutsRef = collection(db, 'users', userId, 'workouts');
        // Note: Firestore querying by date requires the field to be a Timestamp or Date. 
        // Assuming scheduledDate is stored correctly. If complex, we fetch last 20 and filter in JS.
        const qWorkouts = query(
            workoutsRef,
            orderBy('scheduledDate', 'desc'),
            limit(20)
        );

        const wSnap = await getDocs(qWorkouts);
        const workouts = wSnap.docs
            .map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    title: data.name || data.title,
                    date: data.scheduledDate?.toDate ? data.scheduledDate.toDate().toISOString().split('T')[0] : 'Unknown',
                    type: data.category,
                    status: data.status,
                    // Include specific details if available (distance, weight etc)
                    duration: data.duration,
                    description: data.description,
                } as any;
            })
            .filter(w => new Date(w.date) >= twoWeeksAgo); // Client-side filter to be safe

        console.log(`Found ${workouts.length} recent workouts`);

        // 1. User Profile & Stats
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data() as UserProfile;
        const profileStats = [];
        if (userData) {
            if (userData.age) profileStats.push(`Ålder: ${userData.age} år`);
            if (userData.height) profileStats.push(`Längd: ${userData.height} cm`);
            if (userData.weight) profileStats.push(`Vikt: ${userData.weight} kg`);
            if (userData.gender) profileStats.push(`Kön: ${userData.gender}`);
        }
        const statsString = profileStats.length > 0 ? `ANVÄNDARPROFIL:\n${profileStats.join('\n')}` : '';

        // 2. Fetch Memories
        const memRef = collection(db, 'users', userId, 'memories');
        const memSnap = await getDocs(memRef);
        const memories = memSnap.docs.map(d => d.data().content).join('\n- ');
        const memorySection = memories ? `MINNEN (Saker du sparat om användaren):\n- ${memories}` : '';

        const knownFacts = [
            statsString,
            memorySection,
            `Nuvarande datum: ${new Date().toLocaleDateString()}`
        ].filter(Boolean).join('\n\n');

        // 3. Construct the System Prompt Context
        const contextData = {
            profile: {
                focus: "Running & Strength", // Placeholder or fetch from DB
            },
            knownFacts: memories, // New Field
            recentActivity: workouts,
            currentDate: new Date().toISOString().split('T')[0],
        };

        return JSON.stringify(contextData, null, 2);

    } catch (e) {
        console.error("Error building AI context:", e);
        return "Error fetching context. Proceed with general advice.";
    }
}

export const SYSTEM_PROMPT_TEMPLATE = `
Du är "Atlas", en expert inom idrottsmedicin, löpcoachning och styrketräning. 
Din uppgift är att ge konkreta, datadrivna råd baserat på användarens träningslogg.

LÅNGTIDSMINNE PROTOKOLL:
Om användaren delger viktig personlig information (skador, mål, kost, utrustning) som bör kommas ihåg för framtiden, SKA du spara detta genom att skriva på en ny rad:
[[MEMORY: <Kortfattad fakta>]]

Exempel:
"Jag har ont i höger knä." -> [[MEMORY: Smärta i höger knä]]
"Jag vill springa milen under 50." -> [[MEMORY: Mål: Milen < 50 min]]

DINA RIKTLINJER:
1. **Analysera Kontexten**: Titta alltid på "recentActivity" och "knownFacts" innan du svarar.
   - Har användaren några skador lagrade i "knownFacts"? Ta hänsyn till det!
2. **Var Konkret**: Säg inte "vila mer", säg "Du har kört 3 hårda pass på 4 dagar, vila imorgon".
3. **Ton**: Professionell, peppande, men seriös. Som en riktig coach.
4. **Säkerhet**: Vid smärta, rekommendera vård.

ANVÄNDARDATA (JSON):
`;
