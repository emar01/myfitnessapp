require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, updateDoc } = require("firebase/firestore");

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

// Correct calorie/macro values PER PIECE (one medium egg ~50g)
const corrections = [
    { name: "Ägg (Kokt)", calories: 78, protein: 6.5, carbs: 0.6, fat: 5.3, servingSize: 1, servingUnit: "styck" },
    { name: "Ägg (Stekt)", calories: 90, protein: 6.3, carbs: 0.4, fat: 7.2, servingSize: 1, servingUnit: "styck" },
];

async function fixEggs() {
    const snap = await getDocs(collection(db, 'foodItems'));
    let fixed = 0;
    for (const d of snap.docs) {
        const data = d.data();
        const correction = corrections.find(c => c.name === data.name);
        if (correction) {
            const { name, ...updates } = correction;
            await updateDoc(doc(db, 'foodItems', d.id), updates);
            console.log(`Fixed "${data.name}": ${updates.calories} kcal / ${updates.servingSize} ${updates.servingUnit}`);
            fixed++;
        }
    }
    console.log(`\nFixed ${fixed} items.`);
    process.exit(0);
}

fixEggs().catch(e => { console.error(e); process.exit(1); });
