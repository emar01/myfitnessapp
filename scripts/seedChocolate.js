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

const chocolates = [
    { name: "Mjölkchoklad (Marabou)", calories: 28, protein: 0.2, carbs: 2.8, fat: 1.7, fiber: 0.1, servingSize: 1, servingUnit: "ruta (ca 5g)", isPublic: true, categories: ["godis", "choklad"] },
    { name: "Mjölkchoklad (Marabou)", calories: 138, protein: 1, carbs: 14, fat: 8.5, fiber: 0.5, servingSize: 1, servingUnit: "rad (ca 25g)", isPublic: true, categories: ["godis", "choklad"] },
    { name: "Mjölkchoklad (Marabou)", calories: 1100, protein: 8, carbs: 112, fat: 68, fiber: 4, servingSize: 1, servingUnit: "st (200g kaka)", isPublic: true, categories: ["godis", "choklad"] },
    { name: "Mörk choklad (70%)", calories: 55, protein: 0.8, carbs: 3.5, fat: 4.5, fiber: 1, servingSize: 1, servingUnit: "ruta (ca 10g)", isPublic: true, categories: ["godis", "choklad"] },
    { name: "Kexchoklad (60g)", calories: 300, protein: 4, carbs: 36, fat: 15, fiber: 0.8, servingSize: 1, servingUnit: "st (bar)", isPublic: true, categories: ["godis", "choklad"] },
    { name: "Snickers (50g)", calories: 242, protein: 4.3, carbs: 30, fat: 11, fiber: 0.7, servingSize: 1, servingUnit: "st (bar)", isPublic: true, categories: ["godis", "choklad"] },
    { name: "Mars (51g)", calories: 228, protein: 1.1, carbs: 35, fat: 8.5, fiber: 0, servingSize: 1, servingUnit: "st (bar)", isPublic: true, categories: ["godis", "choklad"] },
    { name: "Japp (60g)", calories: 270, protein: 1.5, carbs: 42, fat: 10, fiber: 0.5, servingSize: 1, servingUnit: "st (bar)", isPublic: true, categories: ["godis", "choklad"] },
    { name: "Center (Rulle)", calories: 375, protein: 3, carbs: 50, fat: 18, fiber: 0.5, servingSize: 1, servingUnit: "st (rulle 78g)", isPublic: true, categories: ["godis", "choklad"] },
    { name: "Center (Bit)", calories: 23, protein: 0.2, carbs: 3.1, fat: 1.1, fiber: 0, servingSize: 1, servingUnit: "st (bit)", isPublic: true, categories: ["godis", "choklad"] }
];

async function seed() {
    try {
        const foodsRef = collection(db, 'foodItems');
        for (const item of chocolates) {
            await addDoc(foodsRef, item);
            console.log(`Added ${item.name} (${item.servingUnit})`);
        }
        console.log('Chocolate seeding complete!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
