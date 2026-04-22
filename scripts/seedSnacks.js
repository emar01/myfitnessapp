require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc } = require("firebase/firestore");

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

const snacks = [
    { name: "Lösgodis", calories: 300, protein: 3, carbs: 65, fat: 4, fiber: 0, servingSize: 1, servingUnit: "dl", isPublic: true, categories: ["snacks", "godis"] },
    { name: "Chips", calories: 80, protein: 1, carbs: 8, fat: 5, fiber: 0.6, servingSize: 1, servingUnit: "dl", isPublic: true, categories: ["snacks"] },
    { name: "Popcorn (poppade)", calories: 20, protein: 0.5, carbs: 3, fat: 0.8, fiber: 0.7, servingSize: 1, servingUnit: "dl", isPublic: true, categories: ["snacks"] },
    { name: "Ostbågar", calories: 50, protein: 0.8, carbs: 5, fat: 3, fiber: 0.2, servingSize: 1, servingUnit: "dl", isPublic: true, categories: ["snacks"] }
];

async function seed() {
    try {
        const foodsRef = collection(db, 'foodItems');
        
        // 1. Update Kaffe
        const kaffeQuery = query(foodsRef, where('name', '==', 'Kaffe (Svart)'));
        const kaffeSnap = await getDocs(kaffeQuery);
        
        if (!kaffeSnap.empty) {
            for (const d of kaffeSnap.docs) {
                await updateDoc(doc(db, 'foodItems', d.id), {
                    name: "Kaffe (Svart)",
                    calories: 2,
                    servingSize: 1,
                    servingUnit: "kopp",
                    protein: 0.1,
                    carbs: 0.3,
                    fat: 0
                });
                console.log("Updated Kaffe (Svart) to '1 kopp'");
            }
        } else {
            // Also check for just "Kaffe"
            const kaffeQuery2 = query(foodsRef, where('name', '==', 'Kaffe'));
            const kaffeSnap2 = await getDocs(kaffeQuery2);
            if (!kaffeSnap2.empty) {
                for (const d of kaffeSnap2.docs) {
                    await updateDoc(doc(db, 'foodItems', d.id), {
                        name: "Kaffe (Svart)",
                        calories: 2,
                        servingSize: 1,
                        servingUnit: "kopp"
                    });
                    console.log("Updated Kaffe to '1 kopp'");
                }
            } else {
                // Add it if missing
                await addDoc(foodsRef, { name: "Kaffe (Svart)", calories: 2, protein: 0.1, carbs: 0.3, fat: 0, servingSize: 1, servingUnit: "kopp", isPublic: true, categories: ["dryck"] });
                console.log("Added Kaffe (Svart)");
            }
        }

        // 2. Add Snacks
        for (const item of snacks) {
            await addDoc(foodsRef, item);
            console.log(`Added ${item.name}`);
        }
        
        console.log('Snacks and Coffee update complete!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
