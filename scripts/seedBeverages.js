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

const drinks = [
    // === ÖL ===
    { name: "Öl (Lager, 33cl, ~5%)", calories: 150, protein: 1.3, carbs: 12, fat: 0, servingSize: 330, servingUnit: "ml", isPublic: true, categories: ["Mellanmål"] },
    { name: "Öl (Lager, 50cl, ~5%)", calories: 225, protein: 2, carbs: 18, fat: 0, servingSize: 500, servingUnit: "ml", isPublic: true, categories: ["Mellanmål"] },
    { name: "Öl (IPA, 33cl, ~6.5%)", calories: 195, protein: 1.5, carbs: 18, fat: 0, servingSize: 330, servingUnit: "ml", isPublic: true, categories: ["Mellanmål"] },
    { name: "Öl (Mörk/Porter, 33cl)", calories: 185, protein: 2, carbs: 20, fat: 0, servingSize: 330, servingUnit: "ml", isPublic: true, categories: ["Mellanmål"] },
    { name: "Lättöl (33cl, ~2.2%)", calories: 65, protein: 0.7, carbs: 6, fat: 0, servingSize: 330, servingUnit: "ml", isPublic: true, categories: ["Mellanmål"] },
    { name: "Alkoholfri öl (33cl)", calories: 55, protein: 0.5, carbs: 10, fat: 0, servingSize: 330, servingUnit: "ml", isPublic: true, categories: ["Mellanmål"] },

    // === VIN ===
    { name: "Rödvin (ett glas, 15cl)", calories: 127, protein: 0.1, carbs: 4, fat: 0, servingSize: 150, servingUnit: "ml", isPublic: true, categories: ["Middag", "Mellanmål"] },
    { name: "Vitt vin (ett glas, 15cl)", calories: 120, protein: 0.1, carbs: 4, fat: 0, servingSize: 150, servingUnit: "ml", isPublic: true, categories: ["Middag", "Mellanmål"] },
    { name: "Rosévin (ett glas, 15cl)", calories: 118, protein: 0.1, carbs: 5, fat: 0, servingSize: 150, servingUnit: "ml", isPublic: true, categories: ["Middag", "Mellanmål"] },
    { name: "Champagne / Prosecco (ett glas, 12cl)", calories: 90, protein: 0.2, carbs: 5, fat: 0, servingSize: 120, servingUnit: "ml", isPublic: true, categories: ["Middag", "Mellanmål"] },
    { name: "Alkoholfritt vin (ett glas, 15cl)", calories: 30, protein: 0, carbs: 6, fat: 0, servingSize: 150, servingUnit: "ml", isPublic: true, categories: ["Middag", "Mellanmål"] },

    // === LÄSK & DRYCKER ===
    { name: "Coca-Cola (33cl)", calories: 139, protein: 0, carbs: 35, fat: 0, servingSize: 330, servingUnit: "ml", isPublic: true, categories: ["Mellanmål", "Lunch", "Middag"] },
    { name: "Coca-Cola Zero / Light (33cl)", calories: 1, protein: 0, carbs: 0, fat: 0, servingSize: 330, servingUnit: "ml", isPublic: true, categories: ["Mellanmål", "Lunch", "Middag"] },
    { name: "Fanta / Festis (33cl)", calories: 132, protein: 0, carbs: 33, fat: 0, servingSize: 330, servingUnit: "ml", isPublic: true, categories: ["Mellanmål"] },
    { name: "Juice (Apelsin, 25cl)", calories: 110, protein: 1.5, carbs: 26, fat: 0.5, servingSize: 250, servingUnit: "ml", isPublic: true, categories: ["Frukost"] },
    { name: "Vatten", calories: 0, protein: 0, carbs: 0, fat: 0, servingSize: 1, servingUnit: "styck", isPublic: true, categories: ["Frukost", "Lunch", "Middag", "Mellanmål"] },
    { name: "Energidryck (33cl, t.ex. Monster/Redbull)", calories: 140, protein: 0, carbs: 34, fat: 0, servingSize: 330, servingUnit: "ml", isPublic: true, categories: ["Mellanmål"] },
    { name: "Proteinshake (färdig, 330ml)", calories: 170, protein: 25, carbs: 8, fat: 3, servingSize: 330, servingUnit: "ml", isPublic: true, categories: ["Mellanmål", "Frukost"] },

    // === DRINKAR & SPRIT ===
    { name: "Gin & Tonic (1 drink)", calories: 170, protein: 0, carbs: 16, fat: 0, servingSize: 1, servingUnit: "drink", isPublic: true, categories: ["Mellanmål"] },
    { name: "Vodka Soda (1 drink)", calories: 96, protein: 0, carbs: 0, fat: 0, servingSize: 1, servingUnit: "drink", isPublic: true, categories: ["Mellanmål"] },
    { name: "Whisky (4cl, neat)", calories: 105, protein: 0, carbs: 0, fat: 0, servingSize: 40, servingUnit: "ml", isPublic: true, categories: ["Mellanmål"] },
    { name: "Vodka (4cl, neat)", calories: 96, protein: 0, carbs: 0, fat: 0, servingSize: 40, servingUnit: "ml", isPublic: true, categories: ["Mellanmål"] },
    { name: "Mojito (1 drink)", calories: 165, protein: 0, carbs: 18, fat: 0, servingSize: 1, servingUnit: "drink", isPublic: true, categories: ["Mellanmål"] },
    { name: "Aperol Spritz (1 drink)", calories: 158, protein: 0, carbs: 15, fat: 0, servingSize: 1, servingUnit: "drink", isPublic: true, categories: ["Mellanmål"] },
    { name: "Margarita (1 drink)", calories: 168, protein: 0, carbs: 11, fat: 0, servingSize: 1, servingUnit: "drink", isPublic: true, categories: ["Mellanmål"] },
    { name: "Cider (33cl, ~4.5%)", calories: 145, protein: 0, carbs: 18, fat: 0, servingSize: 330, servingUnit: "ml", isPublic: true, categories: ["Mellanmål"] },
];

async function seed() {
    const foodsRef = collection(db, 'foodItems');
    for (const item of drinks) {
        await addDoc(foodsRef, item);
        console.log(`Added: ${item.name}`);
    }
    console.log(`\nDone! Added ${drinks.length} beverages.`);
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
