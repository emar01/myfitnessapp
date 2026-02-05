const { collection, getDocs, writeBatch, doc } = require('firebase/firestore');
const { db } = require('../lib/firebaseConfigScript');

const collectionsToUpdate = ['programs', 'workout_templates', 'exercises'];

async function migratePrivacy() {
    console.log('Starting privacy migration...');

    for (const colName of collectionsToUpdate) {
        console.log(`Processing collection: ${colName}...`);
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);

        if (snapshot.empty) {
            console.log(`No documents found in ${colName}.`);
            continue;
        }

        const batch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach((d: any) => {
            const ref = doc(db, colName, d.id);
            // Check if already has fields to avoid unnecessary writes?
            // For now, just overwrite to ensure consistency.
            batch.update(ref, {
                isPublic: true,
                createdBy: 'admin' // System owned
            });
            count++;
        });

        await batch.commit();
        console.log(`Updated ${count} documents in ${colName}.`);
    }

    console.log('Migration complete.');
}

async function main() {
    try {
        await migratePrivacy();
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

main();
