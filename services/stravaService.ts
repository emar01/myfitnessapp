import { db } from '@/lib/firebaseConfig';
import { RunningSubcategory, StrengthSubcategory, WorkoutCategory } from '@/types';
import { makeRedirectUri } from 'expo-auth-session';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || '';
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || '';

export const getStravaAuthRequestConfig = () => {
    return {
        clientId: STRAVA_CLIENT_ID,
        scopes: ['activity:read_all'],
        redirectUri: makeRedirectUri({
            scheme: 'myfitnessapp'
        }),
    };
};

// Save tokens to Firestore
export const saveStravaCredentials = async (userId: string, tokenData: any) => {
    try {
        const ref = doc(db, 'users', userId, 'integrations', 'strava');
        const payload: any = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: tokenData.expires_at,
            updated_at: new Date()
        };

        if (tokenData.athlete !== undefined) {
            payload.athlete = tokenData.athlete;
        }

        await setDoc(ref, payload, { merge: true });
        // console.log('Strava credentials saved.');
    } catch (e) {
        console.error('Failed to save Strava credentials', e);
        throw e;
    }
};

export const getValidStravaToken = async (userId: string): Promise<string> => {
    const ref = doc(db, 'users', userId, 'integrations', 'strava');
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        throw new Error("No Strava connection found. Please connect in Profile.");
    }

    const data = snap.data();
    const now = Math.floor(Date.now() / 1000);

    // Refresh if expired or about to expire (within 5 mins)
    if (data.expires_at && data.expires_at < now + 300) {
        // console.log("Strava token expired, refreshing...");
        return await refreshStravaToken(userId, data.refresh_token);
    }

    return data.access_token;
};

const refreshStravaToken = async (userId: string, refreshToken: string): Promise<string> => {
    try {
        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: STRAVA_CLIENT_ID,
                client_secret: STRAVA_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });

        const data = await response.json();
        if (data.access_token) {
            await saveStravaCredentials(userId, data);
            return data.access_token;
        } else {
            throw new Error("Failed to refresh token");
        }
    } catch (e) {
        console.error("Error refreshing token", e);
        throw e;
    }
};

export const exchangeToken = async (code: string) => {
    try {
        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: STRAVA_CLIENT_ID,
                client_secret: STRAVA_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
            }),
        });
        const data = await response.json();
        if (data.access_token) {
            // Caller must handle saving with userId
            return data;
        }
        throw new Error('No access token in response');
    } catch (e) {
        console.error("Token exchange failed", e);
        throw e;
    }
};

export interface StravaActivity {
    id: number;
    name: string;
    distance: number; // meters
    moving_time: number; // seconds
    elapsed_time: number;
    total_elevation_gain: number;
    type: string;
    start_date: string;
    calories?: number;
    kilojoules?: number;
    map: {
        summary_polyline: string;
    };
}

export const getStravaActivities = async (userId: string, page = 1, perPage = 30): Promise<StravaActivity[]> => {
    const token = await getValidStravaToken(userId);

    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch Strava activities");
    }

    return await response.json();
};

export const mapStravaType = (stravaType: string): { category: WorkoutCategory, subcategory?: RunningSubcategory | StrengthSubcategory } => {
    const type = stravaType.toLowerCase();

    switch (type) {
        // Running / Walking
        case 'run':
        case 'trailrun':
        case 'walk':
        case 'hike':
            return { category: 'löpning', subcategory: 'distans' };

        // Strength
        case 'weighttraining':
            return { category: 'styrketräning', subcategory: 'styrka' };
        case 'crossfit':
            return { category: 'styrketräning', subcategory: 'crossfit' };

        // Mobility / Recovery
        case 'yoga':
        case 'stretch':
            return { category: 'rörlighet', subcategory: 'rörlighet' };

        // Rehab
        case 'rehab':
            return { category: 'rehab' };

        // Other common types to map to 'övrigt' instead of defaulting to 'rest' in UI
        case 'ride':
        case 'virtualride':
        case 'ebikeride':
        case 'swim':
        case 'rowing':
        case 'stairstepper':
            return { category: 'övrigt' };

        // Default
        default:
            return { category: 'övrigt' };
    }
};

export const linkStravaActivityToWorkout = async (activity: StravaActivity, workoutId: string) => {
    const mapping = mapStravaType(activity.type);
    const result: any = {
        distance: activity.distance / 1000, // convert to km
        duration: activity.moving_time,
        stravaActivityId: activity.id.toString(),
        category: mapping.category,
    };
    if (mapping.subcategory) {
        result.subcategory = mapping.subcategory;
    }
    return result;
};
