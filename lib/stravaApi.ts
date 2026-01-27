import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiscoveryDocument, exchangeCodeAsync, makeRedirectUri, refreshAsync, TokenResponse } from 'expo-auth-session';

const CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET;

export const discovery: DiscoveryDocument = {
    authorizationEndpoint: 'https://www.strava.com/oauth/mobile/authorize',
    tokenEndpoint: 'https://www.strava.com/oauth/token',
    revocationEndpoint: 'https://www.strava.com/oauth/deauthorize',
};

const STRAVA_TOKEN_KEY = 'strava_tokens';

export const getStravaAuthRequestConfig = () => {
    return {
        clientId: CLIENT_ID!,
        scopes: ['activity:write', 'read'],
        redirectUri: makeRedirectUri({
            scheme: 'myfitnessapp'
        }),
    };
};

export const exchangeCode = async (code: string) => {
    const redirectUri = makeRedirectUri({ scheme: 'myfitnessapp' });
    const config = {
        clientId: CLIENT_ID!,
        clientSecret: CLIENT_SECRET!,
        code,
        redirectUri,
        extraParams: { grant_type: 'authorization_code' }
    };

    const response = await exchangeCodeAsync(config, discovery);
    await AsyncStorage.setItem(STRAVA_TOKEN_KEY, JSON.stringify(response));
    return response;
};

const getValidToken = async () => {
    const json = await AsyncStorage.getItem(STRAVA_TOKEN_KEY);
    if (!json) return null;

    let tokens = JSON.parse(json) as TokenResponse;

    // Check if expired (give 5 min buffer)
    if (tokens.expiresIn && tokens.issuedAt && (tokens.issuedAt + tokens.expiresIn - 300) < (Date.now() / 1000)) {
        // Refresh
        try {
            const newTokens = await refreshAsync({
                clientId: CLIENT_ID!,
                clientSecret: CLIENT_SECRET!,
                refreshToken: tokens.refreshToken,
            }, discovery);

            tokens = newTokens;
            await AsyncStorage.setItem(STRAVA_TOKEN_KEY, JSON.stringify(tokens));
        } catch (e) {
            console.error("Strava Refresh Failed", e);
            return null;
        }
    }

    return tokens.accessToken;
};

export const uploadToStrava = async (workoutName: string, description: string, durationSeconds: number, startTime: Date) => {
    const token = await getValidToken();
    if (!token) throw new Error("Not authenticated with Strava");

    // Strava expects ISO 8601
    const startDateLocal = startTime.toISOString();

    const body = {
        name: workoutName,
        type: 'WeightTraining',
        start_date_local: startDateLocal,
        elapsed_time: durationSeconds,
        description: description
    };

    const response = await fetch('https://www.strava.com/api/v3/activities', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Strava Upload Failed: ${err}`);
    }

    return await response.json();
};

export const isStravaConnected = async () => {
    const json = await AsyncStorage.getItem(STRAVA_TOKEN_KEY);
    return !!json;
};

export const disconnectStrava = async () => {
    await AsyncStorage.removeItem(STRAVA_TOKEN_KEY);
}
