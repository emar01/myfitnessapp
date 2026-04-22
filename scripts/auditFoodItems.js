require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

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

async function audit() {
    const snap = await getDocs(collection(db, 'foodItems'));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`\n=== FOOD ITEM AUDIT (${items.length} items) ===\n`);
    console.log(`${'Name'.padEnd(50)} ${'Cal'.padStart(6)} ${'Size'.padStart(8)} Unit`);
    console.log('-'.repeat(80));

    items
        .sort((a, b) => a.name.localeCompare(b.name, 'sv'))
        .forEach(item => {
            const flag = item.servingUnit === 'g' && item.servingSize === 100 && item.calories > 300 ? ' ⚠️  HIGH PER 100g' : '';
            console.log(`${item.name.substring(0,49).padEnd(50)} ${String(item.calories).padStart(6)} ${String(item.servingSize).padStart(8)} ${item.servingUnit}${flag}`);
        });

    process.exit(0);
}

audit().catch(e => { console.error(e); process.exit(1); });
