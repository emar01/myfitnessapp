import { SYSTEM_PROMPT_TEMPLATE } from '@/utils/aiContext';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export async function isAiGloballyDisabled(): Promise<boolean> {
    try {
        const configRef = doc(db, 'config', 'global');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
            return configSnap.data().aiDisabledGlobally === true;
        }
    } catch (e) {
        console.error("Error checking global AI status:", e);
    }
    return false;
}

// ---------------------------------------------------------
// VIKTIGT: Byt ut denna sträng mot din riktiga Google AI Studio / Firebase API-nyckel
// Du kan skaffa en på https://aistudio.google.com/app/apikey
// ---------------------------------------------------------
const WEEKLY_PLAN_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_AI_KEY || '';
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${WEEKLY_PLAN_API_KEY}`;

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function generateAtlasResponse(
    messages: ChatMessage[],
    contextJson: string
): Promise<string> {

    if (await isAiGloballyDisabled()) {
        return "⚠️ AI-tjänster är för närvarande avstängda av en administratör.";
    }

    if (WEEKLY_PLAN_API_KEY.includes('YOUR_OPENAI_API_KEY')) {
        return "⚠️ Du måste lägga in din Google API-nyckel i `services/aiService.ts`.";
    }

    try {
        // Prepare Gemini format: contents: [{ role: 'user'|'model', parts: [{ text: '...' }] }]
        // System instructions are passed separately or as the first user message for some models. 
        // For gemini-1.5-flash, standard is separate 'systemInstruction' or context injection.

        // We will inject context + system prompt into the first message for robust behavior
        const fullSystemContext = SYSTEM_PROMPT_TEMPLATE + contextJson;

        const geminiContent = messages.map(m => {
            // Map 'assistant' -> 'model'
            const role = m.role === 'assistant' ? 'model' : 'user';

            // If it's the very first message or system message, prepend context (simplified approach)
            // But here we receive a history array where the first item is 'system'.
            // Gemini REST API doesn't support 'system' role in 'contents' array directly for all endpoints.
            // Best practice: Merge system prompt into the first user message or use systemInstruction field.

            let text = m.content;
            if (m.role === 'system') {
                return null; // Handle system prompt separately
            }

            return {
                role: role,
                parts: [{ text: text }]
            };
        }).filter(Boolean) as any[];

        // Add the system context to the beginning or via system_instruction (if supported)
        // gemini-1.5-flash supports system_instruction.

        const payload = {
            contents: geminiContent,
            system_instruction: {
                parts: [{ text: fullSystemContext }]
            },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
            }
        };

        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini Error:", data.error);
            return `Fel vid kommunikation med Atlas (Google): ${data.error.message}`;
        }

        // Gemini response structure
        // candidates[0].content.parts[0].text
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiText) {
            return "Atlas fick inget svar. (Tomt svar från Google).";
        }

        return aiText;

    } catch (e) {
        console.error("Network/API Error:", e);
        return "Kunde inte nå Atlas just nu. Kontrollera din internetanslutning.";
    }
}

export async function parseWorkoutImage(base64Image: string, availableExercises: { id: string, name: string }[]): Promise<any | null> {
    if (await isAiGloballyDisabled()) {
        return { error: 'AI_DISABLED', message: 'AI-tjänster är för närvarande avstängda av en administratör.' };
    }
    if (!WEEKLY_PLAN_API_KEY || WEEKLY_PLAN_API_KEY.includes('YOUR_OPENAI_API_KEY')) {
        console.error("API Key missing");
        return null;
    }

    try {
        const prompt = `
Du är en AI-assistent i en träningsapp. Din uppgift är att tolka en bild på ett träningspass (kanske skrivet på en whiteboard eller papper) och konvertera det till JSON-format som appen kan logga.

Här är en lista på alla tillgängliga styrkeövningar i databasen:
${JSON.stringify(availableExercises)}

Regler:
1. Identifiera alla övningar i bilden.
2. Mappa namnet i bilden mot den mest troliga övningen i "availableExercises" och använd det ID:t ('exerciseId') och namnet ('name').
3. Om en övning helt saknar en bra matchning, använd exerciseId: "custom" och name: det som stod i bilden.
4. Tolka set och reps. Exempel: "3x10" = 3 set med 10 reps. "12, 10, 8" = 3 set med 12, 10 och 8 reps. 
5. Om vikt anges, inkludera det i setet.
6. Returnera ENDAST ett giltigt JSON-objekt med denna struktur, INGEN extatext eller markdown-block:
{
  "workoutName": "Titel på passet (tolkat eller genererat)",
  "exercises": [
    {
      "exerciseId": "matching-id-eller-custom",
      "name": "Övningens namn",
      "sets": [
         { "reps": 10, "weight": 50 },
         { "reps": 8, "weight": 55 }
      ]
    }
  ]
}
`;

        const payload = {
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Image
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.1, // Låg temp för mer exakt JSON
                maxOutputTokens: 2000,
            }
        };

        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini Image Error:", data.error);
            if (data.error.code === 429) {
                return { error: 'RATE_LIMIT', message: 'Tjänsten är hårt belastad just nu. Vänta en minut och försök igen.' };
            }
            return null;
        }

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) return null;

        // Clean up potential markdown formatting block
        const jsonStr = aiText.replace(/```json/i, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("Failed to parse AI response as JSON", aiText);
            return null;
        }

    } catch (e) {
        console.error("Network/API Error Parsing Image:", e);
        return null;
    }
}

export async function parseFoodImage(base64Image: string): Promise<any | null> {
    if (await isAiGloballyDisabled()) {
        return { error: 'AI_DISABLED', message: 'AI-tjänster är för närvarande avstängda av en administratör.' };
    }
    if (!WEEKLY_PLAN_API_KEY || WEEKLY_PLAN_API_KEY.includes('YOUR_OPENAI_API_KEY')) {
        console.error("API Key missing");
        return null;
    }

    try {
        const prompt = `
Du är en AI-assistent i en träningsapp som hanterar kost. Din uppgift är att tolka en bild av en måltid eller matvara och konvertera det till JSON-format med näringsinformation.

Regler:
1. Identifiera vad maten på bilden är.
2. Uppskatta mängden mat (i gram eller portioner) samt uppskatta kalorier, protein, kolhydrater, fett och fibrer för hela mängden som syns.
3. Returnera ENDAST ett giltigt JSON-objekt med denna struktur, INGEN extatext eller markdown-block:
{
  "foodName": "Namn på maträtten/livsmedlet",
  "calories": 450,
  "protein": 30,
  "carbs": 40,
  "fat": 15,
  "fiber": 5,
  "amountConsumed": 1,
  "servingUnit": "portion"
}
Om du är osäker, gör din bästa kvalificerade gissning.
`;

        const payload = {
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Image
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.2, // Låg temp för mer exakt JSON men tillräckligt hög för gissningar
                maxOutputTokens: 2000,
            }
        };

        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini Food Image Error:", data.error);
            if (data.error.code === 429) {
                return { error: 'RATE_LIMIT', message: 'Tjänsten är hårt belastad just nu. Vänta en minut och försök igen.' };
            }
            return null;
        }

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) return null;

        // Clean up potential markdown formatting block
        const jsonStr = aiText.replace(/```json/i, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("Failed to parse AI food response as JSON", aiText);
            return null;
        }

    } catch (e) {
        console.error("Network/API Error Parsing Food Image:", e);
        return null;
    }
}

export async function estimateFoodNutrition(foodName: string, mealType?: string): Promise<any | null> {
    if (await isAiGloballyDisabled()) {
        return { error: 'AI_DISABLED', message: 'AI-tjänster är för närvarande avstängda av en administratör.' };
    }
    if (!WEEKLY_PLAN_API_KEY || WEEKLY_PLAN_API_KEY.includes('YOUR_OPENAI_API_KEY')) {
        console.error("API Key missing for estimateFoodNutrition");
        return null;
    }

    try {
        const mealContext = mealType ? ` Användaren äter detta som en del av sin "${mealType}".` : "";
        const prompt = `
Du är en AI-assistent i en träningsapp som hanterar kost. Användaren vill lägga till en ny matvara: "${foodName}".${mealContext}
Din uppgift är att uppskatta näringsinformation för detta. 

Om namnet är otydligt eller har flera vanliga varianter (t.ex. "Mjölk" kan vara 3%, 1.5%, 0.5%), ge upp till 3 olika alternativ.

Regler för portion:
1. Om det är en hel rätt (t.ex. "Lax med potatis"), ange per normal portion.
2. Om det är en sås eller ett tillbehör (t.ex. "Béarnaise", "Majonnäs", "Ketchup"), ange ALLTID portionen i "msk" (matskedar) som enhet, och uppskatta näring för 1 msk. 
3. För andra tillbehör som inte är flytande, uppskatta en rimlig mängd (t.ex. 30g).
4. Är det en råvara utan kontext, välj rimlig standardenhet (t.ex. 100g eller 1 st).

Returnera ENDAST ett giltigt JSON-objekt med denna struktur, INGEN extatext eller markdown-block:
{
  "confidence": 0.8, // Hur säker du är på din tolkning (0-1)
  "message": "En kort beskrivning av vad du hittade, t.ex. 'Hittade flera varianter av mjölk'.",
  "alternatives": [
    {
      "name": "Namn på varianten (t.ex. Mellanmjölk 1.5%)",
      "calories": 45,
      "protein": 3.5,
      "carbs": 5,
      "fat": 1.5,
      "fiber": 0,
      "servingSize": 100,
      "servingUnit": "g"
    }
  ]
}
`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1000,
            }
        };

        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini Estimate Error:", data.error);
            if (data.error.code === 429) {
                return { error: 'RATE_LIMIT', message: 'Tjänsten är hårt belastad just nu. Vänta en minut och försök igen.' };
            }
            return null;
        }

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) return null;

        const jsonStr = aiText.replace(/```json/i, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("Failed to parse AI estimate response as JSON", aiText);
            return null;
        }

    } catch (e) {
        console.error("Network/API Error Estimating Food Nutrition:", e);
        return null;
    }
}
