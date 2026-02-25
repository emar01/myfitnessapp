import { WorkoutTemplate } from "@/types";

export const ultraWorkouts: Partial<WorkoutTemplate>[] = [
    {
        name: "Långpass Ultra 3h",
        category: "löpning",
        subcategory: "långpass",
        note: `Ett riktigt långt pass för att bygga sen-tålighet och uthållighet inför Ultravasan 90.
Detta pass görs med fördel i skog och på stigar (trail).

Fokus är inte på fart, utan på tid ute (Time on Feet).
Du ska springa extremt lugnt, och varva med att gå i alla branta backar.
Öva på att inta energi och vätska jämnt (var 20-30:e minut) under hela passet.

Om du blir sliten, gå mer. Det viktigaste är att vara ute i 3 timmar.`,
        exercises: [{
            exerciseId: 'running',
            name: 'Löpning',
            isBodyweight: true,
            sets: []
        }]
    },
    {
        name: "Långpass Ultra 4h",
        category: "löpning",
        subcategory: "långpass",
        note: `Nyckelpasset inför Ultravasan 90.
4 timmar ute i spåret. Gärna i obanad terräng och på stigar.

Fokus: "Time on Feet". Tempot är oviktigt.
Gå i alla uppförsbackar och i all svår terräng.
Fokusera på att få i dig sportdryck, gels eller energi varje 20:e minut. Din mage måste vänja sig vid att ta upp energi under ansträngning.

Detta är ett tufft pass mentalt och fysiskt. Belöna dig ordentligt efteråt!`,
        exercises: [{
            exerciseId: 'running',
            name: 'Löpning',
            isBodyweight: true,
            sets: []
        }]
    },
    {
        name: "Back-to-back: Långpass 2h",
        category: "löpning",
        subcategory: "långpass",
        note: `Detta är ett "back-to-back" pass, vilket betyder att du sprang ett långpass igår, och idag springer du ytterligare ett.

Syftet med detta är att träna på att springa på redan trötta ben, vilket simulerar hur det kommer kännas sista halvan av Ultravasan.
Spring väldigt lugnt och försiktigt i 2 timmar. Gå mycket. Var snäll mot kroppen, men håll igång rörelsen.`,
        exercises: [{
            exerciseId: 'running',
            name: 'Löpning',
            isBodyweight: true,
            sets: []
        }]
    },
    {
        name: "Traillöpning Distans 60 min",
        category: "löpning",
        subcategory: "distans",
        note: `Löpning på tekniska stigar (trail) i 60 minuter.

Eftersom Ultravasan går till stor del på Vasaloppsarenans stigar och skogsvägar är det viktigt att vänja fötter, fotleder och leder vid ojämnt underlag.
Spring i ett behagligt tempo, men fokusera på fotnedsättningen och titta några meter framåt så du kan planera dina steg.`,
        exercises: [{
            exerciseId: 'running',
            name: 'Löpning',
            isBodyweight: true,
            sets: []
        }]
    },
    {
        name: "Löparstyrka: Core & Ben",
        category: "styrketräning",
        subcategory: "styrka",
        note: `Ett specifikt styrkepass för att klara av 90km löpning. En stark core och starka sätesmuskler är nyckeln till att hålla en god hållning när du är som tröttast.

Kör 3-4 omgångar. Vila 1 minut mellan varje omgång.`,
        exercises: [
            {
                exerciseId: 'draken_enbensmarklyft',
                name: 'Draken (Enbensmarklyft)',
                isBodyweight: true,
                sets: [
                    { id: 's1', reps: 10, weight: 0, isCompleted: false },
                    { id: 's2', reps: 10, weight: 0, isCompleted: false },
                    { id: 's3', reps: 10, weight: 0, isCompleted: false },
                ]
            },
            {
                exerciseId: 'utfallssteg_lunges',
                name: 'Utfallssteg / Lunges',
                isBodyweight: true,
                sets: [
                    { id: 's1', reps: 10, weight: 0, isCompleted: false },
                    { id: 's2', reps: 10, weight: 0, isCompleted: false },
                    { id: 's3', reps: 10, weight: 0, isCompleted: false },
                ]
            },
            {
                exerciseId: 'tahavningar',
                name: 'Tåhävningar',
                isBodyweight: true,
                sets: [
                    { id: 's1', reps: 15, weight: 0, isCompleted: false },
                    { id: 's2', reps: 15, weight: 0, isCompleted: false },
                    { id: 's3', reps: 15, weight: 0, isCompleted: false },
                ]
            },
            {
                exerciseId: 'plankan',
                name: 'Plankan',
                isBodyweight: true,
                sets: [
                    { id: 's1', reps: 1, weight: 0, isCompleted: false, duration: 60 },
                    { id: 's2', reps: 1, weight: 0, isCompleted: false, duration: 60 },
                    { id: 's3', reps: 1, weight: 0, isCompleted: false, duration: 60 },
                ]
            },
            {
                exerciseId: 'sidoplankan',
                name: 'Sidoplankan',
                isBodyweight: true,
                sets: [
                    { id: 's1', reps: 1, weight: 0, isCompleted: false, duration: 45 },
                    { id: 's2', reps: 1, weight: 0, isCompleted: false, duration: 45 },
                    { id: 's3', reps: 1, weight: 0, isCompleted: false, duration: 45 },
                ]
            },
            {
                exerciseId: 'hoftlyft_enbens',
                name: 'Höftlyft (ett ben)',
                isBodyweight: true,
                sets: [
                    { id: 's1', reps: 15, weight: 0, isCompleted: false },
                    { id: 's2', reps: 15, weight: 0, isCompleted: false },
                    { id: 's3', reps: 15, weight: 0, isCompleted: false },
                ]
            },
        ]
    }
];
