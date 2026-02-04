import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { auth, db } from '@/lib/firebaseConfig';
import { Program, WorkoutTemplate } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProgramDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useSession();
    const [program, setProgram] = useState<Program | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const programId = Array.isArray(id) ? id[0] : id;

    useEffect(() => {
        if (programId) {
            fetchProgram();
        }
    }, [programId]);

    useEffect(() => {
        if (programId && user) {
            checkIfFollowing();
        }
    }, [programId, user]);

    const checkIfFollowing = async () => {
        if (!user || !programId) return;
        try {
            const docRef = doc(db, 'users', user.uid, 'active_programs', programId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setIsFollowing(true);
            } else {
                setIsFollowing(false);
            }
        } catch (e) {
            console.error('Error checking following status', e);
        }
    };

    const fetchProgram = async () => {
        if (!programId) return;
        setLoading(true);
        try {
            const docRef = doc(db, 'programs', programId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProgram({ ...docSnap.data(), id: docSnap.id } as Program);
            } else {
                Alert.alert('Fel', 'Programmet hittades inte.');
                router.back();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowProgram = async () => {
        // Robust user check
        const currentUser = user || auth.currentUser;
        if (!currentUser) {
            Alert.alert('Logga in', 'Du måste vara inloggad för att starta ett program.');
            return;
        }

        if (!program || !program.schedule || program.schedule.length === 0) {
            Alert.alert('Tomt Program', 'Detta program saknar träningspass.');
            return;
        }

        const startProgram = async () => {
            setJoining(true);

            try {
                // CLEANUP: If restarting, remove old planned workouts for this program
                if (isFollowing) {
                    const workoutsRef = collection(db, 'users', currentUser.uid, 'workouts');
                    const qExisting = query(
                        workoutsRef,
                        where('programId', '==', programId),
                        where('status', '==', 'Planned')
                    );
                    const snap = await getDocs(qExisting);
                    const cleanupBatch = writeBatch(db);
                    snap.docs.forEach(d => cleanupBatch.delete(d.ref));
                    await cleanupBatch.commit();
                }

                const startDate = new Date();
                startDate.setHours(0, 0, 0, 0);

                // Prepare Workouts
                const workoutsToCreate: any[] = [];

                for (const item of program!.schedule!) {
                    const scheduledDate = new Date(startDate);
                    scheduledDate.setDate(startDate.getDate() + item.dayOffset);

                    let exerciseData: any[] = [];
                    let subcategory = undefined;
                    let category = 'övrigt';
                    let templateNote = '';

                    if (item.workoutTemplateId) {
                        try {
                            const tSnap = await getDoc(doc(db, 'workout_templates', item.workoutTemplateId));
                            if (tSnap.exists()) {
                                const tData = tSnap.data() as WorkoutTemplate;
                                exerciseData = tData.exercises || [];
                                subcategory = tData.subcategory;
                                category = tData.category;
                                templateNote = tData.note || '';
                            }
                        } catch (err) {
                            console.warn(`Failed to fetch template ${item.workoutTemplateId}`, err);
                        }
                    }

                    workoutsToCreate.push({
                        userId: currentUser.uid,
                        name: item.workoutTitle || 'Program Workout',
                        status: 'Planned',
                        date: new Date(),
                        scheduledDate: scheduledDate,
                        exercises: exerciseData,
                        category: category,
                        subcategory: subcategory,
                        programId: programId,
                        notes: item.description || templateNote || `Del av program: ${program.title}`
                    });
                }

                // Batch Write (Chunked)
                const chunkSize = 400;
                for (let i = 0; i < workoutsToCreate.length; i += chunkSize) {
                    const chunk = workoutsToCreate.slice(i, i + chunkSize);
                    const batch = writeBatch(db);

                    chunk.forEach(workoutData => {
                        const newRef = doc(collection(db, `users/${currentUser.uid}/workouts`));
                        batch.set(newRef, workoutData);
                    });

                    // Also save/update active_programs in the first batch
                    if (i === 0) {
                        const activeRef = doc(db, 'users', currentUser.uid, 'active_programs', programId);
                        batch.set(activeRef, {
                            programId: programId,
                            startedAt: new Date(),
                            title: program.title
                        }, { merge: true });
                    }

                    await batch.commit();
                }

                setIsFollowing(true);
                Alert.alert('Program Startat', `Programmet är nu ${isFollowing ? 'omstartat' : 'startat'}! Nya pass med uppdaterade beskrivningar har lagts till i din kalender.`);

            } catch (e: any) {
                console.error('Error following program:', e);
                Alert.alert('Fel', `Kunde inte starta programmet: ${e.message}`);
            } finally {
                setJoining(false);
            }
        };

        if (isFollowing) {
            Alert.alert(
                'Starta om program?',
                'Du följer redan detta program. Vill du starta om det? Detta kommer ta bort dina kommande planerade pass för detta program och lägga till dem på nytt (med uppdaterade beskrivningar). Historik sparas.',
                [
                    { text: 'Avbryt', style: 'cancel' },
                    { text: 'Starta om', style: 'destructive', onPress: startProgram }
                ]
            );
        } else {
            startProgram();
        }
    };

    const handleUnfollowProgram = async () => {
        const currentUser = user || auth.currentUser;
        if (!currentUser) return;

        const performUnfollow = async () => {
            setJoining(true);
            try {
                // 1. Delete Planned Workouts
                const workoutsRef = collection(db, 'users', currentUser.uid, 'workouts');
                const qExisting = query(
                    workoutsRef,
                    where('programId', '==', programId),
                    where('status', '==', 'Planned')
                );
                const snap = await getDocs(qExisting);
                const batch = writeBatch(db);
                snap.docs.forEach(d => batch.delete(d.ref));

                // 2. Remove Active Program Status
                const activeRef = doc(db, 'users', currentUser.uid, 'active_programs', programId as string);
                batch.delete(activeRef);

                await batch.commit();

                setIsFollowing(false);
                if (Platform.OS === 'web') {
                    alert('Program Avslutat. Du följer inte längre detta program.');
                } else {
                    Alert.alert('Program Avslutat', 'Du följer inte längre detta program.');
                }
            } catch (e) {
                console.error("Error unfollowing:", e);
                if (Platform.OS === 'web') {
                    alert('Något gick fel. Kunde inte avsluta programmet.');
                } else {
                    Alert.alert('Fel', 'Kunde inte avsluta programmet.');
                }
            } finally {
                setJoining(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Är du säker på att du vill sluta följa detta program? Alla dina framtida planerade pass för detta program kommer att tas bort.")) {
                performUnfollow();
            }
        } else {
            Alert.alert(
                'Avsluta Program',
                'Är du säker på att du vill sluta följa detta program? Alla dina framtida planerade pass för detta program kommer att tas bort.',
                [
                    { text: 'Avbryt', style: 'cancel' },
                    {
                        text: 'Avsluta',
                        style: 'destructive',
                        onPress: performUnfollow
                    }
                ]
            );
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Palette.primary.main} />
            </View>
        );
    }

    if (!program) return null;

    const renderSchedule = () => {
        if (!program.schedule || program.schedule.length === 0) {
            return <Text style={{ color: Palette.text.secondary }}>Inga pass definierade än.</Text>;
        }

        // Group by week
        const weeks: { [key: number]: typeof program.schedule } = {};
        program.schedule.forEach(item => {
            const weekNum = Math.floor(item.dayOffset / 7) + 1;
            if (!weeks[weekNum]) weeks[weekNum] = [];
            weeks[weekNum].push(item);
        });

        // Sort weeks
        const sortedWeekNums = Object.keys(weeks).map(Number).sort((a, b) => a - b);
        const weekDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];

        return sortedWeekNums.map(weekNum => (
            <View key={weekNum} style={styles.weekContainer}>
                <Text style={styles.weekHeader}>Vecka {weekNum}</Text>
                {weeks[weekNum].sort((a, b) => a.dayOffset - b.dayOffset).map((item, index) => {
                    const dayIndex = item.dayOffset % 7;
                    const dayName = weekDays[dayIndex];

                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.scheduleItem}
                            onPress={() => router.push({
                                pathname: '/workout/[id]',
                                params: {
                                    id: item.workoutTemplateId || 'unknown',
                                    title: item.workoutTitle,
                                    status: 'planned',
                                    type: 'template'
                                }
                            })}
                        >
                            <View style={styles.dayBadge}>
                                <Text style={styles.dayBadgeText}>{dayName}</Text>
                                <Text style={styles.dayBadgeSubText}>Dag {item.dayOffset + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.workoutTitle}>{item.workoutTitle}</Text>
                                <Text style={styles.workoutDesc}>{item.description || 'Ett planerat träningspass.'}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={Palette.text.disabled} />
                        </TouchableOpacity>
                    );
                })}
            </View>
        ));
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header Image / Pattern Placeholder */}
            <View style={styles.headerBanner}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                <Ionicons name="trophy" size={64} color="rgba(255,255,255,0.8)" />
                <Text style={styles.bannerTitle}>{program.title}</Text>
                <Text style={styles.bannerSubtitle}>{program.category} • {program.duration}</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Om Programmet</Text>
                <Text style={styles.description}>{program.description}</Text>

                <View style={{ gap: 12, marginVertical: Spacing.m }}>
                    {!isFollowing ? (
                        <TouchableOpacity
                            style={[
                                styles.followButton,
                                joining && styles.disabledButton
                            ]}
                            onPress={handleFollowProgram}
                            disabled={joining}
                            activeOpacity={0.7}
                        >
                            {joining ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.followButtonText}>Starta Program</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.followButton, styles.restartButton]}
                                onPress={handleFollowProgram}
                                disabled={joining}
                            >
                                <Text style={[styles.followButtonText, { color: Palette.primary.main }]}>Starta om Program</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.followButton, styles.unfollowButton]}
                                onPress={handleUnfollowProgram}
                                disabled={joining}
                            >
                                <Text style={styles.followButtonText}>Avsluta Program</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <Text style={styles.sectionTitle}>Upplägg</Text>
                <View style={styles.scheduleList}>
                    {renderSchedule()}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Palette.background.default,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerBanner: {
        backgroundColor: Palette.primary.main,
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        position: 'relative', // Ensure absolute children position relative to this
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.2)', // Subtle background
        padding: 8,
        borderRadius: 20,
        zIndex: 10,
    },
    bannerTitle: {
        fontSize: Typography.size.xl,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: Spacing.m,
        textAlign: 'center',
    },
    bannerSubtitle: {
        fontSize: Typography.size.m,
        color: 'rgba(255,255,255,0.8)',
        marginTop: Spacing.s,
    },
    content: {
        padding: Spacing.m,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
        marginBottom: Spacing.s,
        marginTop: Spacing.m,
    },
    description: {
        fontSize: Typography.size.m,
        color: Palette.text.secondary,
        lineHeight: 24,
        marginBottom: Spacing.m,
    },
    followButton: {
        backgroundColor: Palette.accent.main,
        paddingVertical: Spacing.m,
        borderRadius: BorderRadius.l,
        alignItems: 'center',
        marginVertical: Spacing.m,
        ...Shadows.small,
    },
    disabledButton: {
        opacity: 0.7,
    },
    followingButton: {
        backgroundColor: Palette.status?.success || '#4CAF50',
        opacity: 1,
    },
    followButtonText: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: '#FFF',
    },
    restartButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: Palette.primary.main,
    },
    unfollowButton: {
        backgroundColor: '#FF5252', // Red
    },
    scheduleList: {
        marginTop: Spacing.s,
    },
    weekContainer: {
        marginBottom: Spacing.l,
    },
    weekHeader: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
        marginBottom: Spacing.s,
        marginLeft: Spacing.xs,
        marginTop: Spacing.s,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: Spacing.m,
        borderRadius: BorderRadius.m,
        marginBottom: Spacing.s,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    dayBadge: {
        backgroundColor: '#F0F0F5',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: Spacing.m,
        alignItems: 'center',
        minWidth: 60,
    },
    dayBadgeText: {
        fontSize: Typography.size.xs,
        fontWeight: 'bold',
        color: Palette.text.primary,
        marginBottom: 0,
    },
    dayBadgeSubText: {
        fontSize: 10,
        color: Palette.text.secondary,
        marginTop: 2,
    },
    workoutTitle: {
        fontSize: Typography.size.m,
        fontWeight: '600',
        color: Palette.text.primary,
    },
    workoutDesc: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
});
