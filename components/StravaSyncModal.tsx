import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { db } from '@/lib/firebaseConfig';
import { StravaActivity, exchangeToken, getStravaActivities, getStravaAuthRequestConfig } from '@/services/stravaService';
import { Workout } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

interface StravaSyncModalProps {
    visible: boolean;
    onClose: () => void;
    userId: string;
}

export default function StravaSyncModal({ visible, onClose, userId }: StravaSyncModalProps) {
    const [activities, setActivities] = useState<StravaActivity[]>([]);
    const [plannedWorkouts, setPlannedWorkouts] = useState<Workout[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [request, response, promptAsync] = useAuthRequest(
        getStravaAuthRequestConfig(),
        { authorizationEndpoint: 'https://www.strava.com/oauth/authorize', tokenEndpoint: 'https://www.strava.com/oauth/token' }
    );

    useEffect(() => {
        if (response?.type === 'success') {
            const { code } = response.params;
            handleAuthCode(code);
        }
    }, [response]);

    const handleAuthCode = async (code: string) => {
        setIsLoading(true);
        try {
            await exchangeToken(code);
            setIsAuthenticated(true);
            loadData();
        } catch (e) {
            alert("Strava login failed.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (visible && isAuthenticated) {
            // If we are already authenticated (e.g. from previous session/state), load data
            // For now relying on local state, but ideally check persistent storage
            loadData();
        }
    }, [visible, isAuthenticated]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Planned Workouts for this week
            const q = query(
                collection(db, `users/${userId}/workouts`),
                where('status', '==', 'Planned')
            );
            const wSnap = await getDocs(q);
            const workouts = wSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Workout[];
            setPlannedWorkouts(workouts);

            // 2. Fetch Strava Activities
            try {
                const stravaActs = await getStravaActivities();
                setActivities(stravaActs);
            } catch (err) {
                console.log("Error fetching Strava activities, may need re-auth", err);
                // If 401, we might set isAuthenticated(false)
            }

        } catch (e) {
            console.error("Failed to load sync data", e);
            alert("Kunde inte hämta data.");
        } finally {
            setIsLoading(false);
        }
    };

    const linkActivity = async (activity: StravaActivity, workout: Workout) => {
        if (!workout || !workout.id) return;

        setIsLoading(true);
        try {
            const workoutRef = doc(db, `users/${userId}/workouts`, workout.id as string);
            await updateDoc(workoutRef, {
                status: 'Completed',
                date: new Date(activity.start_date),
                category: 'löpning',
                subcategory: 'distans',
                exercises: [{
                    exerciseId: 'strava-import',
                    name: activity.name,
                    isBodyweight: true,
                    sets: [{
                        id: activity.id.toString(),
                        reps: 0,
                        weight: 0,
                        isCompleted: true,
                        distance: activity.distance / 1000,
                        duration: activity.moving_time,
                        type: 'normal'
                    }]
                }],
                stravaActivityId: activity.id.toString()
            } as any);

            alert(`Kopplade "${activity.name}" till "${workout.name}"!`);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Kunde inte koppla passet.");
        }
        setIsLoading(false);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Synka från Strava</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={Palette.text.primary} />
                    </TouchableOpacity>
                </View>

                {!isAuthenticated ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                        <Ionicons name="cloud-download" size={64} color="#FC4C02" style={{ marginBottom: 20 }} />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                            Koppla ditt Strava-konto
                        </Text>
                        <Text style={{ textAlign: 'center', color: Palette.text.secondary, marginBottom: 30 }}>
                            För att synka dina pass behöver du godkänna åtkomst till Strava.
                        </Text>
                        <TouchableOpacity
                            style={{ backgroundColor: '#FC4C02', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 }}
                            onPress={() => promptAsync()}
                            disabled={!request}
                        >
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Anslut till Strava</Text>
                        </TouchableOpacity>
                    </View>
                ) : isLoading ? (
                    <ActivityIndicator size="large" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={activities}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ padding: Spacing.m }}
                        renderItem={({ item }) => (
                            <View style={styles.activityCard}>
                                <View>
                                    <Text style={styles.activityName}>{item.name}</Text>
                                    <Text style={styles.activityStats}>
                                        {(item.distance / 1000).toFixed(2)} km • {Math.floor(item.moving_time / 60)} min
                                    </Text>
                                    <Text style={styles.activityDate}>{new Date(item.start_date).toLocaleDateString()}</Text>
                                </View>

                                {plannedWorkouts.length > 0 ? (
                                    <View style={{ marginTop: 8 }}>
                                        <Text style={{ fontSize: 12, color: Palette.text.secondary, marginBottom: 4 }}>Koppla till:</Text>
                                        {plannedWorkouts.map(w => (
                                            <TouchableOpacity
                                                key={w.id}
                                                style={styles.linkButton}
                                                onPress={() => linkActivity(item, w)}
                                            >
                                                <Text style={styles.linkButtonText}>{w.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.createButton} onPress={() => alert("Skapar nytt pass...")}>
                                        <Text style={styles.createButtonText}>Logga som nytt pass</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: Palette.text.secondary }}>Inga aktiviteter hittades.</Text>}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: Spacing.m,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    title: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    activityCard: {
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    activityName: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    activityStats: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        marginTop: 4,
    },
    activityDate: {
        fontSize: 10,
        color: Palette.text.disabled,
        marginTop: 2,
    },
    linkButton: {
        backgroundColor: '#E3F2FD',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginBottom: 4,
    },
    linkButtonText: {
        color: Palette.primary.main,
        fontSize: 12,
        fontWeight: '600',
    },
    createButton: {
        backgroundColor: Palette.primary.main,
        paddingVertical: 8,
        borderRadius: BorderRadius.s,
        alignItems: 'center',
        marginTop: 8,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
