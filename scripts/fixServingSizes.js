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

// Corrections: name must match exactly the stored name
const corrections = [
    // Fruits: per piece makes more sense
    { name: "Banan",    calories: 89,  protein: 1.1, carbs: 23,  fat: 0.3, servingSize: 1, servingUnit: "styck",  note: "Medium banan ~100g" },
    { name: "Äpple",   calories: 72,  protein: 0.4, carbs: 19,  fat: 0.2, servingSize: 1, servingUnit: "styck",  note: "Medium äpple ~140g" },
    { name: "Avokado",  calories: 240, protein: 3,   carbs: 13,  fat: 22,  servingSize: 1, servingUnit: "styck",  note: "Hel avokado ~150g" },

    // Proteindryck: per scoop (30g) is more realistic
    { name: "Proteindryck (Vassle/Whey)", calories: 114, protein: 24, carbs: 2, fat: 1.2, servingSize: 30, servingUnit: "g", note: "30g scoop" },

    // Nuts: per 25g handful
    { name: "Nötter (Blandade)", calories: 152, protein: 5, carbs: 5, fat: 13, servingSize: 25, servingUnit: "g", note: "En handfull ~25g" },

    // Cheese: per slice (~15g)
    { name: "Ost (Hårdost 28%)", calories: 53, protein: 3.8, carbs: 0.2, fat: 4.2, servingSize: 15, servingUnit: "g", note: "En skiva ~15g" },

    // Butter: per tablespoon (10g)
    { name: "Smör", calories: 72, protein: 0.1, carbs: 0, fat: 8.1, servingSize: 10, servingUnit: "g", note: "En matsked ~10g" },

    // Olive oil: per tablespoon (10ml)
    { name: "Olivolja", calories: 88, protein: 0, carbs: 0, fat: 10, servingSize: 10, servingUnit: "ml", note: "En matsked ~10ml" },

    // Milk: per glass (200ml)
    { name: "Mjölk (Mellan 1.5%)", calories: 94, protein: 6.8, carbs: 9.6, fat: 3, servingSize: 200, servingUnit: "ml", note: "Ett glas ~200ml" },
];

async function fix() {
    const snap = await getDocs(collection(db, 'foodItems'));
    let fixed = 0;
    for (const d of snap.docs) {
        const data = d.data();
        const correction = corrections.find(c => c.name === data.name);
        if (correction) {
            const { name, note, ...updates } = correction;
            await updateDoc(doc(db, 'foodItems', d.id), updates);
            console.log(`✅ Fixed "${data.name}"\n   ${data.calories} kcal/${data.servingSize}${data.servingUnit}  →  ${updates.calories} kcal/${updates.servingSize}${updates.servingUnit}  (${note})`);
            fixed++;
        }
    }
    console.log(`\nFixed ${fixed} items.`);
    process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
