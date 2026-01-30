import { makeRedirectUri } from 'expo-auth-session';

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || '';
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || '';

const discovery = {
    authorizationEndpoint: 'https://www.strava.com/oauth/authorize',
    tokenEndpoint: 'https://www.strava.com/oauth/token',
    revocationEndpoint: 'https://www.strava.com/oauth/deauthorize',
};

export const getStravaAuthRequestConfig = () => {
    return {
        clientId: STRAVA_CLIENT_ID,
        scopes: ['activity:read_all'],
        redirectUri: makeRedirectUri({
            scheme: 'myfitnessapp'
        }),
    };
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
            setStravaToken(data.access_token);
            return data.access_token;
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
    map: {
        summary_polyline: string;
    };
}

// Helper to get token (mock/implementation placeholder)
// In a real app, you'd use AsyncStorage to store the token and refresh it.
let currentToken: string | null = null;

export const setStravaToken = (token: string) => {
    currentToken = token;
};

export const getStravaActivities = async (page = 1, perPage = 30): Promise<StravaActivity[]> => {
    if (!currentToken) {
        throw new Error("No Strava token found. Please login.");
    }

    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`, {
        headers: {
            Authorization: `Bearer ${currentToken}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch Strava activities");
    }

    return await response.json();
};

export const linkStravaActivityToWorkout = async (activity: StravaActivity, workoutId: string) => {
    // Logic to update Firestore workout with Strava data
    // This will be handled in the component or a separate firebase service function
    return {
        distance: activity.distance / 1000, // convert to km
        duration: activity.moving_time,
        stravaActivityId: activity.id.toString(),
        // ... map other fields
    };
};
