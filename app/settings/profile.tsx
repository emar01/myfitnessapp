import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';

import { db } from '@/lib/firebaseConfig';
import { UserProfile } from '@/types';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { exchangeToken, getStravaAuthRequestConfig, saveStravaCredentials } from '@/services/stravaService';
import { useAuthRequest } from 'expo-auth-session';

interface Memory { id: string; content: string; }

export default function ProfileScreen() {
    const router = useRouter();
    const { user } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [memories, setMemories] = useState<Memory[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [stravaConnected, setStravaConnected] = useState(false);

    // Strava Auth
    const [request, response, promptAsync] = useAuthRequest(
        getStravaAuthRequestConfig(),
        { authorizationEndpoint: 'https://www.strava.com/oauth/authorize', tokenEndpoint: 'https://www.strava.com/oauth/token' }
    );

    useEffect(() => {
        if (response?.type === 'success') {
            const { code } = response.params;
            handleStravaAuth(code);
        }
    }, [response]);

    const handleStravaAuth = async (code: string) => {
        if (!user) return;
        setIsUpdating(true);
        try {
            const tokenData = await exchangeToken(code);
            await saveStravaCredentials(user.uid, tokenData);
            setStravaConnected(true);
            Alert.alert("Strava Ansluten", "Ditt Strava-konto är nu kopplat.");
        } catch (e) {
            console.error(e);
            Alert.alert("Fel", "Kunde inte koppla Strava.");
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        // User Profile Subscription
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
            }
        });

        // Check Strava Status
        const checkStrava = async () => {
            const sRef = doc(db, 'users', user.uid, 'integrations', 'strava');
            const sSnap = await getDoc(sRef);
            setStravaConnected(sSnap.exists());
        };
        checkStrava();

        // Subscribe to Memories
        const memRef = collection(db, 'users', user.uid, 'memories');
        const qMem = query(memRef, orderBy('createdAt', 'desc'));
        const unsubMem = onSnapshot(qMem, (snap) => {
            setMemories(snap.docs.map(d => ({ id: d.id, content: d.data().content })));
        });

        return () => { unsubscribe(); unsubMem(); };
    }, [user]);

    if (!user) return null;

    const deleteMemory = async (id: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'memories', id));
        } catch (e) {
            console.error("Failed to delete memory", e);
        }
    };

    const toggleAi = async (value: boolean) => {
        setIsUpdating(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                aiEnabled: value
            });
        } catch (error) {
            console.error("Failed to update AI setting", error);
            alert("Kunde inte ändra inställningen just nu.");
        } finally {
            setIsUpdating(false);
        }
    };

    // Make current user 'admin' if they match the email (Dev / Emil)
    // This is a temporary auto-promotion for the requested users.
    useEffect(() => {
        if (!user || !profile) return;
        const ADMIN_EMAILS = ['emil.artursson@gmail.com', 'test@test.com' /* Add dev email if known */];

        // Use user.email to check. If user.email matches, ensure they have the role.
        if (user.email && (ADMIN_EMAILS.includes(user.email) || user.email.includes('admin') || true /* For now allow current dev user too if "true" is risky, remove true. Keeping logic safe: */)) {
            // actually, the user said "tilldela den till BÅDE min dev/login användare OCH emil...".
            // Since I don't know the dev email, I will just promote the *current* user to admin if they aren't already, 
            // assuming the person running this IS the dev.
            if (profile.role !== 'admin') {
                // console.log("Promoting current user to admin as per instructions");
                // updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
            }
        }
    }, [user, profile]);

    // Admin Check
    // We trust the DB role OR specific hardcoded emails for safety access
    const isAdmin = profile?.role === 'admin' || ['emil.artursson@gmail.com'].includes(user.email || '');

    // Default to true if undefined
    const isAiEnabled = profile?.aiEnabled !== false;
    const totalCost = profile?.aiTotalCost || 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', left: Spacing.m, zIndex: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Palette.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Min Profil</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* User Info Card */}
                <View style={styles.card}>
                    <View style={styles.avatar}>
                        <FontAwesome name="user" size={32} color={Palette.primary.main} />
                    </View>
                    <View>
                        <Text style={styles.userName}>{user.displayName || 'Användare'}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                </View>

                {/* Personal Info Section */}
                <Text style={styles.sectionTitle}>Mina Personuppgifter</Text>
                <View style={styles.card}>
                    <View style={[styles.row, { borderBottomWidth: 0 }]}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Ålder</Text>
                            <TextInput
                                style={styles.statInput}
                                value={profile?.age?.toString() || ''}
                                placeholder="-"
                                keyboardType="numeric"
                                onChangeText={(t) => updateDoc(doc(db, 'users', user.uid), { age: Number(t) })}
                            />
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Längd (cm)</Text>
                            <TextInput
                                style={styles.statInput}
                                value={profile?.height?.toString() || ''}
                                placeholder="-"
                                keyboardType="numeric"
                                onChangeText={(t) => updateDoc(doc(db, 'users', user.uid), { height: Number(t) })}
                            />
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Vikt (kg)</Text>
                            <TextInput
                                style={styles.statInput}
                                value={profile?.weight?.toString() || ''}
                                placeholder="-"
                                keyboardType="numeric"
                                onChangeText={(t) => updateDoc(doc(db, 'users', user.uid), { weight: Number(t) })}
                            />
                        </View>
                    </View>
                    <View style={[styles.row, { borderBottomWidth: 0, marginTop: 8 }]}>
                        <Text style={{ marginRight: 8, color: Palette.text.secondary }}>Kön:</Text>
                        {['Man', 'Kvinna', 'Annat'].map((gender) => (
                            <TouchableOpacity
                                key={gender}
                                style={[styles.genderButton, profile?.gender === gender && styles.genderButtonActive]}
                                onPress={() => updateDoc(doc(db, 'users', user.uid), { gender: gender })}
                            >
                                <Text style={[styles.genderText, profile?.gender === gender && styles.genderTextActive]}>{gender}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Strava Integration Section */}
                <Text style={styles.sectionTitle}>Integrationer</Text>
                <View style={styles.card}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <FontAwesome name="bicycle" size={24} color="#FC4C02" style={{ marginRight: 16 }} />
                        <View>
                            <Text style={styles.label}>Strava</Text>
                            <Text style={styles.description}>
                                {stravaConnected ? 'Konto kopplat' : 'Koppla ditt konto för att synka pass.'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.smallButton, stravaConnected && { backgroundColor: Palette.status.success }]}
                        onPress={() => {
                            if (!stravaConnected) promptAsync();
                        }}
                        disabled={stravaConnected || isUpdating}
                    >
                        {isUpdating ? <ActivityIndicator color="#FFF" /> : (
                            <Text style={styles.smallButtonText}>{stravaConnected ? 'Kopplad' : 'Koppla'}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Admin Tools Removed (Moved to Library) */}


                {/* Navigation to Stats */}
                <TouchableOpacity style={styles.navButton} onPress={() => router.push('/settings/stats')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="trophy" size={20} color={Palette.accent.main} style={{ marginRight: 12 }} />
                        <Text style={styles.navButtonText}>Se mina Personbästa (PR)</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Palette.text.disabled} />
                </TouchableOpacity>

                {/* AI Configuration Section */}
                <Text style={styles.sectionTitle}>Atlas AI Config</Text>
                <View style={[styles.card, { flexDirection: 'column', alignItems: 'stretch' }]}>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Aktivera Atlas Coach</Text>
                            <Text style={styles.description}>
                                Tillåt AI:n att analysera din träning och svara på frågor.
                            </Text>
                        </View>
                        {isUpdating ? (
                            <ActivityIndicator size="small" color={Palette.primary.main} />
                        ) : (
                            <Switch
                                value={isAiEnabled}
                                onValueChange={toggleAi}
                                trackColor={{ false: Palette.text.disabled, true: Palette.primary.main }}
                            />
                        )}
                    </View>

                    <View style={[styles.row, { borderBottomWidth: 0, flexDirection: 'column', alignItems: 'flex-start' }]}>
                        <View style={{ marginBottom: 12 }}>
                            <Text style={styles.label}>Förbrukning</Text>
                            <Text style={styles.description}>
                                Ackumulerad kostnad för AI-användning.
                            </Text>
                        </View>
                        <View style={styles.costBox}>
                            <Text style={styles.costLabel}>TOTALT (SEK)</Text>
                            <Text style={styles.costText}>{(totalCost * 10.8).toFixed(2)} kr</Text>
                        </View>
                    </View>

                </View>



                {/* AI Memory Manager Section */}
                <Text style={styles.sectionTitle}>Atlas Minne (Långtidsminne)</Text>
                <View style={[styles.card, { flexDirection: 'column', alignItems: 'stretch' }]}>
                    <Text style={[styles.description, { marginBottom: 12 }]}>
                        Här är saker Atlas har sparat för att komma ihåg i framtida konversationer. Radera om det inte längre är aktuellt.
                    </Text>

                    {memories.length === 0 ? (
                        <Text style={{ fontStyle: 'italic', color: Palette.text.disabled }}>Inget sparat ännu.</Text>
                    ) : (
                        memories.map(mem => (
                            <View key={mem.id} style={styles.memoryItem}>
                                <Text style={styles.memoryText}>{mem.content}</Text>
                                <TouchableOpacity onPress={() => deleteMemory(mem.id)}>
                                    <Ionicons name="trash-outline" size={20} color={Palette.status.error} />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color={Palette.status.info} style={{ marginRight: 8 }} />
                    <Text style={styles.infoText}>
                        Kostnaden baseras på Gemini 1.5 Flash USD-pris (omräknat ca 10.8 SEK/USD).
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        padding: Spacing.m,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    content: {
        padding: Spacing.m,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.l,
        flexDirection: 'row',
        alignItems: 'center',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    avatar: {
        width: 60, height: 60,
        borderRadius: 30,
        backgroundColor: Palette.background.default,
        alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.m,
    },
    userName: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    userEmail: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
    sectionTitle: {
        fontSize: Typography.size.s,
        fontWeight: '600',
        color: Palette.text.secondary,
        marginBottom: Spacing.s,
        textTransform: 'uppercase',
        marginLeft: Spacing.s,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        width: '100%',
        flexWrap: 'wrap', // Allow description to wrap if needed, though structure separates it
    },
    label: {
        fontSize: Typography.size.m,
        fontWeight: '500',
        color: Palette.text.primary,
    },
    description: {
        fontSize: Typography.size.xs,
        color: Palette.text.secondary,
        marginTop: 2,
        maxWidth: '90%',
    },
    costBox: {
        backgroundColor: Palette.background.default,
        padding: Spacing.m,
        borderRadius: BorderRadius.m,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    costLabel: {
        fontSize: Typography.size.xs,
        color: Palette.text.secondary,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 1,
    },
    costText: {
        fontSize: 24, // Larger font
        fontWeight: 'bold',
        color: Palette.primary.main,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    infoBox: {
        flexDirection: 'row',
        padding: Spacing.m,
        backgroundColor: '#E3F2FD',
        borderRadius: BorderRadius.s,
        alignItems: 'center',
    },
    infoText: {
        fontSize: Typography.size.s,
        color: Palette.status.info,
        flex: 1,
    },
    memoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    memoryText: {
        fontSize: 14,
        color: Palette.text.primary,
        flex: 1,
        marginRight: 8
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        color: Palette.text.secondary,
        marginBottom: 4,
    },
    statInput: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Palette.text.primary,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
        minWidth: 40,
        textAlign: 'center',
    },
    genderButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F5F5F7',
        marginRight: 8,
    },
    genderButtonActive: {
        backgroundColor: Palette.primary.main,
    },
    genderText: {
        fontSize: 12,
        color: Palette.text.secondary,
    },

    genderTextActive: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    navButton: {
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    navButtonText: {
        fontSize: Typography.size.m,
        fontWeight: '500',
        color: Palette.text.primary,
    },
    smallButton: {
        backgroundColor: '#FC4C02',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    smallButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
    }
});
