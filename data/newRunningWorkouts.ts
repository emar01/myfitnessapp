import { WorkoutTemplate } from "@/types";

export const newRunningWorkouts: Partial<WorkoutTemplate>[] = [
    {
        name: "Distans 45 min med 15 min fartökningar",
        category: "löpning",
        subcategory: "distans",
        note: `Distanspasset är ett av de viktigaste passen som bygger din löpargrund. Passet kan vara alltifrån 20-90 minuter och gör att kroppen och benen vänjer sig vid att vara i löparskorna.

Distanspassen fyller oftast upp större delen av din löpning och tumregeln är att du ska kunna prata när du springer (beror såklart på om du är nybörjare eller mer erfaren).

Börja med 30 minuter i distansfart.

Därefter kör du 20 sekunder fartökning varvat med 2 minuter och 40 sekunder jogg. Detta gör du 5 omgångar. Det vill säga totalt 15 minuter med fartökningar.`,
        exercises: [{
            exerciseId: 'running',
            name: 'Löpning',
            isBodyweight: true,
            sets: []
        }]
    },
    {
        name: "Progressivt Långpass 90-100 inkl 3x10min",
        category: "löpning",
        subcategory: "långpass",
        note: `Spring 90-100 min långpass och efter 30 min:

Kör 10 min i halvmarafart och sen 5 min jogg. Gör detta 3 gånger.

Sen efter det så kör du 20-30 min på slutet kvar i vanlig jogg.`,
        exercises: [{
            exerciseId: 'running',
            name: 'Löpning',
            isBodyweight: true,
            sets: []
        }]
    },
    {
        name: "Fartpass 10x90/30s",
        category: "löpning",
        subcategory: "fartpass",
        note: `Du springer 90 sekunder snabbt följt av 30 sekunder lätt jogg eller om du är riktigt trött kör du gång. Du upprepar detta 10 gånger.

Det viktigare är att inte springa för fort de första 90 sekunders intervallerna. Det är lätt att bränna sig!

Så hellre lite lätt progressivt (öka farten efterhand). Du ska inte sprinta på 90 sekundersintervallerna men det ska gå fort.`,
        exercises: [{
            exerciseId: 'running',
            name: 'Löpning',
            isBodyweight: true,
            sets: []
        }]
    },
    {
        name: "Distans 25 min + 4x200m",
        category: "löpning",
        subcategory: "distans", // Contains intervals but title starts with Distans. Could be 'fartpass' depending on definition but user asked to base on title.
        note: `Distanspasset är ett av de viktigaste passen som bygger din löpargrund. Passet kan vara alltifrån 20-90 minuter och gör att kroppen och benen vänjer sig vid att vara i löparskorna.

Just detta pass är bra för att få igång kroppen inför tävling. Börja med 25 minuter jogg. Efter det pustar du ut och kör sen 4 x 200 meter i din 3km fart med runt 1 minut jogg mellan varje.`,
        exercises: [{
            exerciseId: 'running',
            name: 'Löpning',
            isBodyweight: true,
            sets: []
        }]
    },
    {
        name: "Distans 25 min med fartökningar",
        category: "löpning",
        subcategory: "distans",
        note: `Distanspasset är ett av de viktigaste passen som bygger din löpargrund. Passet kan vara alltifrån 20-90 minuter och gör att kroppen och benen vänjer sig vid att vara i löparskorna.

Distanspassen fyller oftast upp större delen av din löpning och tumregeln är att du ska kunna prata när du springer (beror såklart på om du är nybörjare eller mer erfaren).

När du närmar dig slutet av detta pass (5-10 minuter kvar) så är det dags för fartökningar. Du ökar farten i 30 sek, sen går du ner till lugn jogg igen. Jogga runt en minut och sen gör du nästa fartökning på 30 sek, följt av jogg igen. Gör detta 3-5 omgångar beroende på känsla!`,
        exercises: [{
            exerciseId: 'running',
            name: 'Löpning',
            isBodyweight: true,
            sets: []
        }]
    }
];
