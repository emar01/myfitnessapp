import { db } from '@/lib/firebaseConfig';
import { FoodItem, FoodLogEntry, MealType } from '@/types';
import { addDoc, collection, deleteDoc, doc, getDocs, getDoc, increment, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { formatDateKey } from '@/utils/dateUtils';

export interface DailyNutritionSummary {
    date: string; // YYYY-MM-DD
    userId: string;
    consumedCalories: number;
    burnedCalories: number;
    dailyGoal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}

export const nutritionService = {
    /**
     * Log a food entry for a user
     */
    logFood: async (userId: string, entry: Omit<FoodLogEntry, 'id' | 'userId'>): Promise<string> => {
        try {
            const logsRef = collection(db, `users/${userId}/foodLogs`);
            const docRef = await addDoc(logsRef, { ...entry, userId });

            // Track usage for smart suggestions
            if (entry.foodItemId) {
                await nutritionService.trackFoodUsage(userId, entry.foodItemId, entry.mealType);
            }

            return docRef.id;
        } catch (error) {
            console.error("Error logging food:", error);
            throw error;
        }
    },

    /**
     * Get food logs for a specific user on a specific date.
     * We'll fetch all and filter client-side for simplicity if dates are tricky with timezones,
     * but preferably we use query. Assuming date is stored as a Timestamp or string.
     */
    getFoodLogsByDate: async (userId: string, targetDate: Date): Promise<FoodLogEntry[]> => {
        try {
            const logsRef = collection(db, `users/${userId}/foodLogs`);
            const q = query(logsRef); // Getting all for now, filter below to avoid complex indexes initially
            const snap = await getDocs(q);
            
            const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FoodLogEntry));
            
            // Filter locally by same Day, Month, Year
            return logs.filter(log => {
                if (!log.date) return false;
                const logDate = log.date.toDate ? log.date.toDate() : new Date(log.date);
                return logDate.getDate() === targetDate.getDate() &&
                       logDate.getMonth() === targetDate.getMonth() &&
                       logDate.getFullYear() === targetDate.getFullYear();
            });
        } catch (error) {
            console.error("Error fetching food logs:", error);
            throw error;
        }
    },

    /**
     * Delete a logged food entry
     */
    deleteFoodLog: async (userId: string, logId: string): Promise<void> => {
        try {
            const ref = doc(db, `users/${userId}/foodLogs`, logId);
            await deleteDoc(ref);
        } catch (error) {
            console.error("Error deleting food log:", error);
            throw error;
        }
    },

    /**
     * Save daily nutrition summary
     */
    saveDailySummary: async (userId: string, targetDate: Date, summary: Omit<DailyNutritionSummary, 'userId' | 'date'>): Promise<void> => {
        try {
            const dateStr = formatDateKey(targetDate);
            const ref = doc(db, `users/${userId}/dailySummaries`, dateStr);
            
            const payload: DailyNutritionSummary = {
                date: dateStr,
                userId,
                ...summary
            };
            
            await setDoc(ref, payload, { merge: true });
        } catch (error) {
            console.error("Error saving daily summary:", error);
            // Non-critical, so we don't necessarily need to throw
        }
    },

    /**
     * Search the global/public food database or the user's custom foods
     */
    searchFoods: async (searchQuery: string, userId: string): Promise<FoodItem[]> => {
        try {
            const foodsRef = collection(db, 'foodItems');
            const q = query(foodsRef, where('isPublic', '==', true));
            const publicSnap = await getDocs(q);
            const publicFoods = publicSnap.docs.map(d => ({ id: d.id, ...d.data() } as FoodItem));

            const customQ = query(foodsRef, where('createdBy', '==', userId));
            const customSnap = await getDocs(customQ);
            const customFoods = customSnap.docs.map(d => ({ id: d.id, ...d.data() } as FoodItem));

            const allFoods = [...publicFoods, ...customFoods];
            const lowerQuery = searchQuery.toLowerCase();
            return allFoods.filter(f => f.name.toLowerCase().includes(lowerQuery) || (f.brand && f.brand.toLowerCase().includes(lowerQuery)));
        } catch (error) {
            console.error("Error searching foods:", error);
            throw error;
        }
    },

    /**
     * Get suggested foods for a meal type, sorted by user frequency
     */
    getSuggestedFoods: async (userId: string, mealType: MealType): Promise<FoodItem[]> => {
        try {
            const foodsRef = collection(db, 'foodItems');
            const q = query(foodsRef, where('isPublic', '==', true));
            const snap = await getDocs(q);
            const allFoods = snap.docs.map(d => ({ id: d.id, ...d.data() } as FoodItem));

            // Filter to foods with matching category (or no category set = show all)
            const suited = allFoods.filter(f =>
                !f.categories || f.categories.length === 0 || f.categories.includes(mealType)
            );

            // Load usage counts for this user + mealType
            const usageRef = collection(db, `users/${userId}/foodUsage`);
            const usageSnap = await getDocs(usageRef);
            const usageMap: Record<string, number> = {};
            usageSnap.docs.forEach(d => {
                const data = d.data();
                const key = `${d.id}_${mealType}`;
                if (data[mealType]) usageMap[d.id] = data[mealType];
            });

            // Sort: most-used first, then alphabetically
            suited.sort((a, b) => {
                const aCount = a.id ? (usageMap[a.id] || 0) : 0;
                const bCount = b.id ? (usageMap[b.id] || 0) : 0;
                if (bCount !== aCount) return bCount - aCount;
                return a.name.localeCompare(b.name, 'sv');
            });

            return suited.slice(0, 20); // Return top 20
        } catch (error) {
            console.error("Error getting suggestions:", error);
            return [];
        }
    },

    /**
     * Track how often a food item is used per meal type
     */
    trackFoodUsage: async (userId: string, foodItemId: string, mealType: MealType): Promise<void> => {
        try {
            const ref = doc(db, `users/${userId}/foodUsage`, foodItemId);
            await setDoc(ref, { [mealType]: increment(1) }, { merge: true });
        } catch (e) {
            // Non-critical, don't throw
            console.warn('Could not track food usage', e);
        }
    },

    /**
     * Create a new food item in the database
     */
    createFoodItem: async (item: Omit<FoodItem, 'id'>): Promise<string> => {
        try {
            const foodsRef = collection(db, 'foodItems');
            const docRef = await addDoc(foodsRef, item);
            return docRef.id;
        } catch (error) {
            console.error("Error creating food item:", error);
            throw error;
        }
    }
};
