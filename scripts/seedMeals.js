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
    { name: "Ostfralla (Ljust bröd med ost & smör)", calories: 290, protein: 9, carbs: 32, fat: 14, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Yoghurt med Granola (1 skål)", calories: 280, protein: 8, carbs: 40, fat: 9, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Kvarg med Müsli och bär (1 skål)", calories: 240, protein: 22, carbs: 28, fat: 4, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Havregrynsgröt med mjölk och sylt", calories: 220, protein: 8, carbs: 35, fat: 4, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Chiapudding (Gjord på mandelmjölk)", calories: 180, protein: 6, carbs: 12, fat: 11, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Pannkakor (3 st med sylt)", calories: 450, protein: 12, carbs: 65, fat: 15, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Knäckebröd med ost (2 st)", calories: 150, protein: 6, carbs: 16, fat: 7, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Köttbullar med makaroner", calories: 550, protein: 25, carbs: 60, fat: 22, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Kycklingsallad (Med dressing)", calories: 420, protein: 35, carbs: 15, fat: 25, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Tacos (2 st tortillas med färs och grönsaker)", calories: 580, protein: 30, carbs: 55, fat: 26, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Sushi (10 bitar)", calories: 380, protein: 18, carbs: 65, fat: 5, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Pizza (Vesuvio - 1/2 pizza)", calories: 600, protein: 28, carbs: 70, fat: 22, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Lax med potatis och dillsås", calories: 480, protein: 30, carbs: 35, fat: 24, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Wok med nudlar och kyckling", calories: 450, protein: 32, carbs: 55, fat: 12, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Smoothie (Bär, banan, mjölk)", calories: 210, protein: 7, carbs: 40, fat: 3, servingSize: 1, servingUnit: "portion", isPublic: true }
];

async function seed() {
    try {
        const foodsRef = collection(db, 'foodItems');
        for (const item of foodItems) {
            await addDoc(foodsRef, item);
            console.log(`Added ${item.name}`);
        }
        console.log('Seeding composite meals complete!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
