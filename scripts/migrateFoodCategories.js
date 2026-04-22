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

// Map item names to categories
const categoryMap = [
    // Frukost
    { match: ['havregrynsgröt', 'gröt', 'ostfralla', 'chiapudding', 'yoghurt', 'kvarg', 'müsli', 'granola', 'pannkakor', 'knäckebröd', 'smoothie', 'mjölk', 'kaffe', 'ägg', 'banan', 'bröd'], categories: ['Frukost', 'Mellanmål'] },
    // Lunch
    { match: ['spagetti', 'köttbullar', 'lax', 'ris', 'potatis', 'kyckling', 'nötfärs', 'wok', 'sushi', 'pizza', 'kebab', 'shawarma', 'pokébowl', 'tikka', 'paneer', 'butter chicken', 'tallrik', 'sallad', 'sidosallad'], categories: ['Lunch', 'Middag'] },
    // Mellanmål
    { match: ['proteindryck', 'smoothie', 'banan', 'äpple', 'nötter', 'kvarg', 'keso', 'knäckebröd'], categories: ['Mellanmål'] },
];

function getCategories(name) {
    const lower = name.toLowerCase();
    const cats = new Set();

    for (const rule of categoryMap) {
        for (const keyword of rule.match) {
            if (lower.includes(keyword)) {
                rule.categories.forEach(c => cats.add(c));
                break;
            }
        }
    }

    return [...cats];
}

async function migrate() {
    const snap = await getDocs(collection(db, 'foodItems'));
    let updated = 0;
    for (const d of snap.docs) {
        const data = d.data();
        if (data.categories && data.categories.length > 0) continue; // already has categories
        const cats = getCategories(data.name);
        if (cats.length > 0) {
            await updateDoc(doc(db, 'foodItems', d.id), { categories: cats });
            console.log(`Updated "${data.name}" → ${cats.join(', ')}`);
            updated++;
        }
    }
    console.log(`\nDone! Updated ${updated} items.`);
    process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
