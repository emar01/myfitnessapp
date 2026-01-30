
import 'dotenv/config';
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, query } from "firebase/firestore";

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

async function checkPrograms() {
    console.log("Checking programs...");
    const q = query(collection(db, "programs"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log("No programs found!");
        return;
    }

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Program: ${data.title}`);
        console.log(`- Schedule Items: ${data.schedule ? data.schedule.length : 0}`);
        if (data.schedule && data.schedule.length > 0) {
            console.log(`- First item dayOffset: ${data.schedule[0].dayOffset}`);
        }
    });
}

checkPrograms();
