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
    { name: "Spagetti och köttfärssås", calories: 140, protein: 6, carbs: 14, fat: 5, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Proteindryck (Vassle/Whey)", calories: 380, protein: 80, carbs: 5, fat: 4, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Lax (Ugnsbakad/Stekt)", calories: 206, protein: 22, carbs: 0, fat: 13, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Kokt Potatis", calories: 86, protein: 2, carbs: 20, fat: 0.1, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Ägg (Kokt)", calories: 155, protein: 13, carbs: 1, fat: 11, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Ägg (Stekt)", calories: 196, protein: 14, carbs: 1, fat: 15, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Kycklingbröst (Stekt/Ugnsbakad)", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Nötfärs (10% fett, stekt)", calories: 212, protein: 26, carbs: 0, fat: 11, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Havregrynsgröt", calories: 68, protein: 2.4, carbs: 12, fat: 1.4, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Mjölk (Mellan 1.5%)", calories: 47, protein: 3.4, carbs: 4.8, fat: 1.5, servingSize: 100, servingUnit: "ml", isPublic: true },
    { name: "Banan", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Äpple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Avokado", calories: 160, protein: 2, carbs: 8.5, fat: 15, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Ris (Kokt vit)", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Broccoli (Kokt)", calories: 35, protein: 2.4, carbs: 7, fat: 0.4, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Kvarg (Naturell 0.2%)", calories: 60, protein: 11, carbs: 3, fat: 0.2, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Bröd (Ljust, vete)", calories: 265, protein: 9, carbs: 49, fat: 3, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Bröd (Mörkt, råg)", calories: 250, protein: 8, carbs: 45, fat: 2, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Ost (Hårdost 28%)", calories: 350, protein: 25, carbs: 1.5, fat: 28, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Tomat", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Gurka", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Nötter (Blandade)", calories: 607, protein: 20, carbs: 21, fat: 54, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Kaffe (Svart)", calories: 2, protein: 0.1, carbs: 0, fat: 0, servingSize: 100, servingUnit: "ml", isPublic: true },
    { name: "Keso (Grynig färskost 4%)", calories: 93, protein: 12, carbs: 2, fat: 4, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Smör", calories: 717, protein: 0.9, carbs: 0.1, fat: 81, servingSize: 100, servingUnit: "g", isPublic: true },
    { name: "Olivolja", calories: 884, protein: 0, carbs: 0, fat: 100, servingSize: 100, servingUnit: "ml", isPublic: true },
    { name: "Pannkaka", calories: 95, protein: 3, carbs: 12, fat: 4, servingSize: 1, servingUnit: "st", isPublic: true },
    { name: "Jordnötssmör", calories: 94, protein: 4, carbs: 3.2, fat: 8, servingSize: 1, servingUnit: "msk", isPublic: true },
    { name: "Sylt", calories: 40, protein: 0.1, carbs: 10, fat: 0, servingSize: 1, servingUnit: "msk", isPublic: true }
];

async function seed() {
    try {
        const foodsRef = collection(db, 'foodItems');
        for (const item of foodItems) {
            await addDoc(foodsRef, item);
            console.log(`Added ${item.name}`);
        }
        console.log('Seeding complete!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
