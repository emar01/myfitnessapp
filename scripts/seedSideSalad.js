require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

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

const foodItems = [
    { name: "Sidosallad (Liten salladstallrik från lunchbuffé inkl. lite dressing/pizzasallad)", calories: 85, protein: 1.5, carbs: 6, fat: 5.5, servingSize: 1, servingUnit: "portion", isPublic: true }
];

async function seed() {
    try {
        const foodsRef = collection(db, 'foodItems');
        for (const item of foodItems) {
            await addDoc(foodsRef, item);
            console.log(`Added ${item.name}`);
        }
        console.log('Seeding side salad complete!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
