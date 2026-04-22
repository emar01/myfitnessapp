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
    // Kebabtallrik
    { name: "Kebabtallrik med pommes (Vit/Röd sås)", calories: 1050, protein: 45, carbs: 85, fat: 55, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Kebabtallrik med ris (Vit/Röd sås)", calories: 950, protein: 48, carbs: 90, fat: 42, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Kebabtallrik med bulgur (Vit/Röd sås)", calories: 920, protein: 49, carbs: 88, fat: 40, servingSize: 1, servingUnit: "portion", isPublic: true },
    
    // Shawarma
    { name: "Shawarmatallrik med pommes", calories: 1100, protein: 50, carbs: 85, fat: 60, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Shawarmatallrik med ris", calories: 980, protein: 52, carbs: 90, fat: 45, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Shawarmatallrik med bulgur", calories: 950, protein: 53, carbs: 88, fat: 43, servingSize: 1, servingUnit: "portion", isPublic: true },

    // Pokebowl
    { name: "Pokébowl (Lax, ris, edamame, mayo)", calories: 650, protein: 28, carbs: 70, fat: 26, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Pokébowl (Tofu/Vegetarisk)", calories: 580, protein: 20, carbs: 75, fat: 22, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Pokébowl (Tonfisk, ris)", calories: 620, protein: 35, carbs: 68, fat: 20, servingSize: 1, servingUnit: "portion", isPublic: true },

    // Indiska rätter
    { name: "Chicken Tikka Masala med ris & naan", calories: 850, protein: 40, carbs: 95, fat: 32, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Palak Paneer med ris", calories: 720, protein: 25, carbs: 65, fat: 38, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Butter Chicken med ris", calories: 900, protein: 38, carbs: 70, fat: 48, servingSize: 1, servingUnit: "portion", isPublic: true },

    // Sallader
    { name: "Räksallad (Rhode Island-dressing)", calories: 450, protein: 35, carbs: 12, fat: 28, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Tonfisksallad (Ägg, oliver, vinaigrette)", calories: 480, protein: 42, carbs: 15, fat: 25, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Caesarsallad (Kyckling, bacon, krutonger)", calories: 650, protein: 45, carbs: 20, fat: 42, servingSize: 1, servingUnit: "portion", isPublic: true },
    { name: "Grekisk sallad (Fetaost, oliver)", calories: 420, protein: 12, carbs: 10, fat: 35, servingSize: 1, servingUnit: "portion", isPublic: true }
];

async function seed() {
    try {
        const foodsRef = collection(db, 'foodItems');
        for (const item of foodItems) {
            await addDoc(foodsRef, item);
            console.log(`Added ${item.name}`);
        }
        console.log('Seeding more composite meals complete!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
