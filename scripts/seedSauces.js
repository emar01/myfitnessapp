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

const sauces = [
    { name: "Bearnaisesås", calories: 85, protein: 0.2, carbs: 0.3, fat: 9, fiber: 0, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Majonnäs", calories: 100, protein: 0.1, carbs: 0.2, fat: 11, fiber: 0, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Ketchup", calories: 18, protein: 0.2, carbs: 4, fat: 0.1, fiber: 0, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Senap", calories: 12, protein: 0.5, carbs: 1.5, fat: 0.4, fiber: 0, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "BBQ-sås", calories: 25, protein: 0.3, carbs: 6, fat: 0.1, fiber: 0, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Tzatziki", calories: 20, protein: 1, carbs: 1, fat: 1.5, fiber: 0, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Hummus", calories: 35, protein: 1.2, carbs: 2, fat: 2.5, fiber: 0.5, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Guacamole", calories: 32, protein: 0.4, carbs: 1, fat: 3, fiber: 1, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Hollandaisesås", calories: 85, protein: 0.5, carbs: 0.3, fat: 9, fiber: 0, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Sriracha", calories: 8, protein: 0.1, carbs: 1.5, fat: 0.1, fiber: 0.2, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Japansk Soja", calories: 8, protein: 1, carbs: 1, fat: 0, fiber: 0, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Sweetchilisås", calories: 28, protein: 0.1, carbs: 7, fat: 0.1, fiber: 0, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Remouladsås", calories: 65, protein: 0.3, carbs: 1, fat: 7, fiber: 0.2, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Vitlökssås (Kebab)", calories: 45, protein: 0.5, carbs: 1.5, fat: 4, fiber: 0, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Rhode Island Dressing", calories: 40, protein: 0.3, carbs: 3, fat: 3.5, fiber: 0.1, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Pesto", calories: 80, protein: 1.5, carbs: 1, fat: 8, fiber: 0.3, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] },
    { name: "Salsa", calories: 10, protein: 0.4, carbs: 2.5, fat: 0.1, fiber: 0.5, servingSize: 1, servingUnit: "msk", isPublic: true, categories: ["såser"] }
];

async function seed() {
    try {
        const foodsRef = collection(db, 'foodItems');
        for (const item of sauces) {
            await addDoc(foodsRef, item);
            console.log(`Added ${item.name}`);
        }
        console.log('Sauce seeding complete!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
