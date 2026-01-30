import { SYSTEM_PROMPT_TEMPLATE } from '@/utils/aiContext';

// ---------------------------------------------------------
// VIKTIGT: Byt ut denna sträng mot din riktiga Google AI Studio / Firebase API-nyckel
// Du kan skaffa en på https://aistudio.google.com/app/apikey
// ---------------------------------------------------------
const WEEKLY_PLAN_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_AI_KEY || '';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function generateAtlasResponse(
    messages: ChatMessage[],
    contextJson: string
): Promise<string> {

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

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${WEEKLY_PLAN_API_KEY}`, {
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
