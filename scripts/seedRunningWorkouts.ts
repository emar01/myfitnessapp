
import 'dotenv/config';
import { addDoc, collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "../lib/firebaseConfig";
import { WorkoutTemplate } from '../types';

const workouts = [
    {
        id: 'run_back_10x45',
        name: 'Backpass 10 x 45',
        category: 'löpning',
        subcategory: 'intervall',
        exercises: [],
        note: `Du kör 10 x 45 sekunder i en längre backe (inte för brant).

Du ska springa 10 gånger uppför en backe, mysigt! Hitta om möjligt en lite flackare backe, dvs. inte för brant. Du kan springa passet lätt progressivt, dvs. att du ökar farten uppför backen efterhand. Första 1-2 stycken ska du ligga lite snabbare än distansfart för att sen öka lätt.

När du nått toppen av backen vänder du om och joggar (joggvila) nerför backen följt av att stå stilla i runt 30 sekunder (ståvila) i botten av backen innan du springer uppför igen.

Så passet är:
10 x 45 sekunder uppför en backe
Jogga lugnt ner efter varje avslutad backe
Stå stilla runt 30 sekunder i botten av backen mellan varje intervall

FÖR LÖPBAND: Om du kör passet på löpband, använd ca 4-6% lutning och använd enbart tiden för ståvilan.`
    },
    {
        id: 'run_distans_40_50',
        name: 'Distans 40-50min',
        category: 'löpning',
        subcategory: 'distans',
        exercises: [],
        note: `Distanspasset är ett av de viktigaste passen som bygger din löpargrund. Passet kan vara alltifrån 20-90 minuter och gör att kroppen och benen vänjer sig vid att vara i löparskorna.

Distanspassen fyller oftast upp större delen av din löpning och tumregeln är att du ska kunna prata när du springer (beror såklart på om du är nybörjare eller mer erfaren).

Ibland kanske du vill trycka på lite extra, för att andra gånger ta det lugnare. Ett lite tuffare distanspass kan med fördel springas lätt progressivt (dvs att du ökar farten lite efterhand). Om du väljer att trycka på under ett distanspass så ska det fortfarande vara ett kontrollerat flås.

Kom ihåg! Om du har ett annat tufft pass dagarna efter ett distanspass ska du hålla det lugnt och lätt.`
    },
    {
        id: 'run_long_75_90',
        name: 'Långpass 75-90',
        category: 'löpning',
        subcategory: 'långpass',
        exercises: [],
        note: `Långpasset är ett av de viktigaste passen för att bygga uthållighet och träna kroppen på att vara igång länge! Det är ett nyckelpass för alla distanser och ska i regel gå lugnt och behärskat.

Beroende på känslan i kroppen kan du springa någonstans mellan 60 - 75 minuter.

Om du känner dig mör i kroppen eller ovan vid distansen: ta korta pauser och fyll på vätska eller annan energi!`
    },
    {
        id: 'run_fartlek_pyramid',
        name: 'Fartlek 5-4-3-2-1 min',
        category: 'löpning',
        subcategory: 'intervall',
        exercises: [],
        note: `Du springer en minutstege som börjar på 5 minuter i strax över din milfart. Sen ökar du successivt farten för varje trappsteg (4-3-2-1 min). Mellan varje trappsteg joggar du lugnt i 90 sekunder.

Så passet blir:
 * 5 min
 * 90 sek jogg/gång
 * 4 min
 * 90 sek jogg/gång
 * 3 min
 * 90 sek jogg/gång
 * 2 min
 * 90 sek jogg/gång
 * 1 min

Springer du på löpband så kör istället 60 sekunder ståvila medan bandet rullar vidare!

Spellista till passet (Spotify)!
[https://open.spotify.com/playlist/2AvC9GcRrH5vCKGu6muo9h?si=6_CSPAFnSaCvbrGSr2mXfA]`
    },
    {
        id: 'run_tempo_5km',
        name: 'Fartpass 5km tempo',
        category: 'löpning',
        subcategory: 'intervall',
        exercises: [],
        note: `Dags att få upp farten! Tempopass är ett kanonbra sätt att bygga fart över längre tid. Du går inte på maxansträngning, men det ska kännas tufft. Förbered dig som om det vore tävling och försök springa 5 kilometer tempo som går i runt din milfart! Din milfart innebär den farten du kan hålla över en mil om du springer så snabbt du kan.

Vet du inte riktigt vad din milfart är? Gå på känsla på detta passet och försök hitta en ansträngningsnivå som ligger mellan 7-9 av 10. Detta kommer härda dig mentalt inför ev. tävling och du vänjer kropp och knopp för hur det kan kännas att springa lite längre i hög fart.`
    },
    {
        id: 'run_back_4x_mix',
        name: 'Backpass 4x(60-45-30s)',
        category: 'löpning',
        subcategory: 'intervall',
        exercises: [],
        note: `Du kör fyra set med 60-45-30 sekunder i en längre backe (inte för brant).

Du kan springa passet lätt progressivt, dvs. att du ökar farten ju kortare tid du springer i backen. OBS - Spring inte för hårt på 60s, det är lätt att bränna ut sig. Första 60s ska du ligga lite snabbare än distansfart för att sen öka när det blir kortare backe.

Du kör joggvila nerför backen följt av runt 30 sekunder ståvila i botten av backen innan du springer uppför igen.

När du kört färdigt ett set (60-45-30s) så joggar du nerför backen och vilar en minut istället för 30s.

FÖR LÖPBAND: Om du kör passet på löpband, använd ca 4-6% lutning och använd enbart tiden för ståvilan.`
    },
    {
        id: 'run_intervall_3x3',
        name: 'Fartpass 3x3',
        category: 'löpning',
        subcategory: 'intervall',
        exercises: [],
        note: `3 x 3 km i runt din halvmaratonfart.

4 minuter lugn jogg mellan varje. Syftet med passet är att träna din uthållighet och fart i just halvmaratonfart, som ett tempopass fast uppdelat.

Om du vill köra det som ett lite tuffare intervallpass kan du springa passet lätt progressivt med några sekunder per kilometer snabbare per 3 km. Men det lämpar sig mest om du känner att passet känns för lätt efterhand eller om du tränar mot ett millopp.`
    },
    {
        id: 'run_long_120_130',
        name: 'Långpass 120-130',
        category: 'löpning',
        subcategory: 'långpass',
        exercises: [],
        note: `Långpasset är ett av de viktigaste passen för att bygga uthållighet och träna kroppen på att vara igång länge! Det är ett nyckelpass för alla distanser och ska i regel gå lugnt och behärskat.

Beroende på känslan i kroppen kan du springa någonstans mellan 120 - 130 minuter.

Om du känner dig mör i kroppen eller ovan vid distansen: ta korta pauser och fyll på vätska eller annan energi!`
    },
    {
        id: 'run_progressiv_45',
        name: 'Fartpass progressivt 15/15/15',
        category: 'löpning',
        subcategory: 'intervall',
        exercises: [],
        note: `Du springer 45 min där du ökar farten varje 15 min. Så passet blir i tre olika fartzoner, ingen vila mellan utan progressivt hela vägen. Syftet med passet är att bygga din uthållighet, träna kroppen på att orka växla upp fart även när man är trött och att "bygga motorn" för längre distanser.

15 min i runt halvmaratonfart (ansträngande men kontrollerat)
15 min lite snabbare (några sekunder per kilometer)
15 min strax över milfart`
    },
    {
        id: 'run_test_5k',
        name: 'Testlopp 5k',
        category: 'löpning',
        subcategory: 'intervall',
        exercises: [],
        note: `Nu är det dags för testlopp! Ett utmärkt sätt att stämma av var man ligger till och få lov att bli trött. Dagarna innan detta passet gäller det att ladda mentalt och se till att hitta glädje och motivation. Och att se detta som något kul i din träning även om det är ett tufft pass! Kan du så se till att få bra med sömn dagen innan. Dagen för passet är det bra om du behandlar det som om det vore en tävling. Gör en mental plan, känn dig stark och se till att förbereda dig inför passet med ordentlig uppvärmning. Under ett sådant här pass kommer du att bli trött och det gäller att inte gå ut för hårt första och andra kilometern utan att jobba sig in i passet. Så summerat så ska du se till att springa 5 kilometer så snabbt du kan och orkar. Och när du börjar bli trött så fokuserar du på varje steg och meter och visualiserar mållinjen! Lycka till!

PS. tänk på att du efter passet också kan uppdatera din tid på 5km i "Tempozonen" i menyn och få ut nya fartzoner för din löpning!`
    },
    {
        id: 'run_intervall_5x2',
        name: 'Fartpass 5x2',
        category: 'löpning',
        subcategory: 'intervall',
        exercises: [],
        note: `Fartpass 5x2km – ett pass som ger dig energi och bygger din vana. Låt det bli ett steg i rätt riktning!

2-3min joggvila`
    },
    {
        id: 'run_distans_50_75',
        name: 'Distanspass 50-75',
        category: 'löpning',
        subcategory: 'distans',
        exercises: [],
        note: `Distanspasset är ett av de viktigaste passen som bygger din löpargrund. Passet kan vara alltifrån 20-90 minuter och gör att kroppen och benen vänjer sig vid att vara i löparskorna.

Distanspassen fyller oftast upp större delen av din löpning och tumregeln är att du ska kunna prata när du springer (beror såklart på om du är nybörjare eller mer erfaren).

Ibland kanske du vill trycka på lite extra, för att andra gånger ta det lugnare. Ett lite tuffare distanspass kan med fördel springas lätt progressivt (dvs att du ökar farten lite efterhand). Om du väljer att trycka på under ett distanspass så ska det fortfarande vara ett kontrollerat flås.

Kom ihåg! Om du har ett annat tufft pass dagarna efter ett distanspass ska du hålla det lugnt och lätt.`
    }
];

async function seedRunningWorkouts() {
    console.log('Seeding Running Workouts...');
    const templatesCollection = collection(db, 'workout_templates');

    for (const w of workouts) {
        // Use ID if available, otherwise just add
        const ref = doc(templatesCollection, w.id);
        // Using cast as any because explicit category strings might clash with exact union types if not careful, 
        // but here they match.
        await setDoc(ref, w as any, { merge: true });
        console.log(`Upserted: ${w.name}`);
    }
    console.log('Seeding complete.');
}

async function main() {
    try {
        await seedRunningWorkouts();
    } catch (error) {
        console.error('Error seeding data:', error);
    }
    if (typeof process !== 'undefined' && process.exit) {
        process.exit(0);
    }
}

main();
