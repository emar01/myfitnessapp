import ExerciseCard from '@/components/ExerciseCard';
import RunningSession from '@/components/RunningSession';
import VideoPlayer from '@/components/VideoPlayer';
import { useTheme } from '@/constants/DesignSystem';
import { useAlert } from '@/context/AlertContext';
import { useSession } from '@/context/ctx';
import { db } from '@/lib/firebaseConfig';
import { checkAndSavePrs, getUserPrs } from '@/services/prService';
import { Exercise, PersonalRecord, Workout, WorkoutExercise } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Helper to format seconds to HH:MM:SS
const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};

// Helper to remove undefined properties recursively
const cleanUndefined = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(cleanUndefined);
    } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        const cleaned: any = {};
        for (const key in obj) {
            if (obj[key] !== undefined) {
                cleaned[key] = cleanUndefined(obj[key]);
            }
        }
        return cleaned;
    }
    return obj;
};

export default function WorkoutLoggerScreen() {
    const { palette, spacing, borderRadius, typography, shadows, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows, isDark);
    const { user } = useSession();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { showAlert, showConfirm } = useAlert();

    const [workoutMode, setWorkoutMode] = useState<'strength' | 'running'>(
        (params.category as string) === 'löpning' ? 'running' : 'strength'
    );

    // Main Workout State - Defined EARLY to avoid hoisting issues
    const [workout, setWorkout] = useState<Workout>({
        userId: user?.uid || '',
        name: (params.workoutName as string) || 'New Workout',
        date: new Date(),
        status: 'In Progress',
        exercises: (() => {
            try {
                return params.initialExercises ? JSON.parse(params.initialExercises as string) : [];
            } catch (e) {
                console.error("Failed to parse initialExercises", e);
                return [];
            }
        })(),
        category: (params.category as string) as any || 'styrketräning',
        programId: params.programId as string,
        workoutTemplateId: params.workoutTemplateId as string
    });

    // Running Template State
    const [runningTemplates, setRunningTemplates] = useState<any[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [runSubFilter, setRunSubFilter] = useState<string | null>(null);

    // Other State
    const [isModalVisible, setModalVisible] = useState(false);
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Modal State
    const [searchQuery, setSearchQuery] = useState('');
    const [modalTab, setModalTab] = useState<'MostUsed' | 'All'>('All');

    // Video Modal State
    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

    // PR State
    const [existingPrs, setExistingPrs] = useState<Record<string, PersonalRecord>>({});

    useEffect(() => {
        if (workoutMode === 'running') {
            fetchRunningTemplates();
        }
    }, [workoutMode]);

    useEffect(() => {
        fetchExercises();

        // Fetch PRs
        if (user) {
            getUserPrs(user.uid).then(setExistingPrs);
        }

        // Timer
        const interval = setInterval(() => {
            if (!isPaused) {
                setSecondsElapsed(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isPaused, user]);

    const fetchRunningTemplates = async () => {
        if (!user) return;
        setIsLoadingTemplates(true);
        try {
            const q = query(collection(db, 'workout_templates'), where('category', '==', 'löpning'));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => d.data());
            setRunningTemplates(list);
        } catch (e) {
            console.error("Failed to fetch running templates", e);
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const fetchExercises = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "exercises"));
            const exercisesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
            setAvailableExercises(exercisesList);
        } catch (e: any) {
            console.error("Error fetching exercises: ", e);
            showAlert('Fel', `Error loading exercises: ${e.message || JSON.stringify(e)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const addExercise = (exercise: Exercise) => {
        const newExercise: WorkoutExercise = {
            exerciseId: exercise.id!,
            name: exercise.name,
            sets: [],
            isBodyweight: exercise.isBodyweight,
            videoLink: exercise.defaultVideoUrl
        };
        setWorkout(prev => ({ ...prev, exercises: [...prev.exercises, newExercise] }));
        setModalVisible(false);
    };

    const updateExercise = (index: number, updatedExercise: WorkoutExercise) => {
        const newExercises = [...workout.exercises];
        newExercises[index] = updatedExercise;
        setWorkout(prev => ({ ...prev, exercises: newExercises }));
    };

    const removeExercise = (index: number) => {
        const newExercises = workout.exercises.filter((_, i) => i !== index);
        setWorkout(prev => ({ ...prev, exercises: newExercises }));
    };

    const finishRun = async (distance: number, duration: number) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const runningExercise: WorkoutExercise = {
                exerciseId: 'running-session',
                name: 'Löpning',
                isBodyweight: true,
                sets: [{
                    id: Date.now().toString(),
                    reps: 0,
                    weight: 0,
                    isCompleted: true,
                    distance: distance,
                    duration: duration,
                    type: 'normal'
                }]
            };

            const workoutData = cleanUndefined({
                ...workout,
                status: 'Completed',
                date: new Date(),
                scheduledDate: new Date(),
                userId: user.uid,
                duration: duration, // Add duration at root in seconds
                distance: distance, // Add distance at root in km
                exercises: [runningExercise],
                category: 'löpning',
                subcategory: runSubFilter || 'distans' // Use default if lost, but ideally from template
            });

            const workoutsRef = collection(db, `users/${user.uid}/workouts`);
            await addDoc(workoutsRef, workoutData);

            await showAlert('Sparat', `Löpning sparad!\nDistans: ${distance} km\nTid: ${formatTime(duration)}`);
            router.back();

        } catch (e: any) {
            console.error("Error saving run: ", e);
            showAlert('Fel', `Failed to save run: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const finishWorkout = async () => {
        if (!user) {
            showAlert('Logga in', 'You must be logged in to save a workout.');
            return;
        }

        setIsLoading(true);
        try {
            const workoutData = cleanUndefined({
                ...workout,
                status: 'Completed',
                date: new Date(),
                scheduledDate: new Date(),
                userId: user.uid,
                duration: secondsElapsed, // Add duration at root in seconds
                exercises: workout.exercises.filter(ex => ex.sets.length > 0)
            });

            const workoutsRef = collection(db, `users/${user.uid}/workouts`);
            const docRef = await addDoc(workoutsRef, workoutData);

            const newPrs = await checkAndSavePrs(user.uid, workoutData.exercises, existingPrs, docRef.id);

            if (newPrs.length > 0) {
                await showAlert('Sparat', `Workout saved! 🎉 NEW RECORDS: \n${newPrs.join('\n')}`);
            } else {
                await showAlert('Sparat', 'Workout saved successfully!');
            }

            // Sync Logic
            if (workout.programId && workout.workoutTemplateId && workoutData.exercises.length > 0) {
                const syncMsg = "Vill du uppdatera alla framtida pass av denna typ i programmet med de nya övningarna?";
                const shouldSync = await showConfirm(
                    "Synkronisera program",
                    syncMsg,
                    { confirmText: "Ja", cancelText: "Nej", isDestructive: false }
                );

                if (shouldSync) {
                    try {
                        const futureWorkoutsRef = collection(db, `users/${user.uid}/workouts`);
                        const q = query(
                            futureWorkoutsRef,
                            where('programId', '==', workout.programId),
                            where('workoutTemplateId', '==', workout.workoutTemplateId),
                            where('status', '==', 'Planned')
                        );

                        const snap = await getDocs(q);
                        const now = new Date();
                        const updatePromises = snap.docs
                            .filter(doc => {
                                const data = doc.data();
                                const scheduledDate = data.scheduledDate?.toDate?.() || data.scheduledDate;
                                return scheduledDate > now;
                            })
                            .map(d => updateDoc(d.ref, {
                                exercises: workoutData.exercises,
                                notes: workoutData.notes || ""
                            }));

                        if (updatePromises.length > 0) {
                            await Promise.all(updatePromises);
                            showAlert('Synkroniserat', `${updatePromises.length} framtida pass uppdaterades.`);
                        }
                    } catch (syncErr) {
                        console.error("Sync failed:", syncErr);
                    }
                }
            }

            router.back();

        } catch (e: any) {
            console.error("Error saving workout: ", e);
            showAlert('Fel', `Failed to save workout: ${e.message || JSON.stringify(e)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const openVideo = (url?: string) => {
        if (url) {
            setCurrentVideoUrl(url);
            setVideoModalVisible(true);
        } else {
            showAlert('Ingen video', 'No video available for this exercise.');
        }
    };

    const [showTemplates, setShowTemplates] = useState(false);

    const renderRunningSelection = () => {
        if (!showTemplates) {
            return (
                <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: typography.size.xl, fontWeight: 'bold', marginBottom: spacing.xxl, color: palette.text.primary, textAlign: 'center' }}>
                        Hur vill du registrera din löpning?
                    </Text>

                    <TouchableOpacity
                        style={[styles.largeButton, { width: '100%', marginBottom: spacing.l, minHeight: 80 }]}
                        onPress={() => setWorkout(prev => ({ ...prev, name: 'Fritt pass', category: 'löpning', subcategory: 'distans' }))}
                    >
                        <Ionicons name="stopwatch-outline" size={32} color={palette.primary.main} />
                        <Text style={[styles.largeButtonText, { fontSize: typography.size.l }]}>Fritt pass (ange egna data)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.largeButton, { width: '100%', minHeight: 80 }]}
                        onPress={() => setShowTemplates(true)}
                    >
                        <Ionicons name="list-outline" size={32} color={palette.accent.main} />
                        <Text style={[styles.largeButtonText, { fontSize: typography.size.l }]}>Välj från mall</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        let filtered = runningTemplates;
        if (runSubFilter) {
            filtered = filtered.filter(t => t.subcategory === runSubFilter);
        }

        return (
            <View style={{ flex: 1, padding: spacing.m }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.m }}>
                    <TouchableOpacity onPress={() => setShowTemplates(false)} style={{ marginRight: spacing.s }}>
                        <Ionicons name="arrow-back" size={24} color={palette.text.primary} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: palette.text.primary }}>
                        Välj löppass
                    </Text>
                </View>

                {/* Filters */}
                <View style={{ flexDirection: 'row', marginBottom: spacing.m }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[styles.filterChip, runSubFilter === null && styles.filterChipActive]}
                            onPress={() => setRunSubFilter(null)}
                        >
                            <Text style={[styles.filterText, runSubFilter === null && styles.filterTextActive]}>Alla</Text>
                        </TouchableOpacity>
                        {['distans', 'intervall', 'långpass'].map(tag => (
                            <TouchableOpacity
                                key={tag}
                                style={[styles.filterChip, runSubFilter === tag && styles.filterChipActive]}
                                onPress={() => setRunSubFilter(tag)}
                            >
                                <Text style={[styles.filterText, runSubFilter === tag && styles.filterTextActive]}>
                                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {isLoadingTemplates ? <ActivityIndicator color={palette.primary.main} /> : (
                    <FlatList
                        data={filtered}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.exerciseItem}
                                onPress={() => setWorkout(prev => ({
                                    ...prev,
                                    name: item.name,
                                    category: 'löpning',
                                    subcategory: item.subcategory || 'distans'
                                }))}
                            >
                                <View>
                                    <Text style={styles.exerciseName}>{item.name}</Text>
                                    <Text style={{ fontSize: 12, color: palette.text.secondary }}>
                                        {item.subcategory ? item.subcategory.charAt(0).toUpperCase() + item.subcategory.slice(1) : 'Distans'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={palette.text.disabled} />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', color: palette.text.secondary, marginTop: 20 }}>Inga mallar hittades. Skapa i biblioteket.</Text>}
                    />
                )}
            </View>
        )
    };

    // Filter exercises based on search
    const filteredExercises = availableExercises.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="close" size={24} color={palette.text.secondary} />
                </TouchableOpacity>

                {/* Mode Selector */}
                <View style={styles.modeSelector}>
                    <TouchableOpacity
                        style={[styles.modeButton, workoutMode === 'strength' && styles.modeButtonActive]}
                        onPress={() => setWorkoutMode('strength')}
                    >
                        <Text style={[styles.modeText, workoutMode === 'strength' && styles.modeTextActive]}>Styrka</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeButton, workoutMode === 'running' && styles.modeButtonActive]}
                        onPress={() => setWorkoutMode('running')}
                    >
                        <Text style={[styles.modeText, workoutMode === 'running' && styles.modeTextActive]}>Löpning</Text>
                    </TouchableOpacity>
                </View>

                {workoutMode === 'strength' && (
                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={[styles.iconButton, { marginRight: 8 }]} onPress={() => setIsPaused(!isPaused)}>
                            <Ionicons name={isPaused ? "play" : "pause"} size={18} color={palette.text.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.iconButton, { marginRight: 8 }]}>
                            <Ionicons name="settings-sharp" size={18} color={palette.text.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.finishCircle} onPress={finishWorkout}>
                            <Ionicons name="checkmark" size={18} color={palette.primary.main} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {workoutMode === 'running' ? (
                workout.name === 'New Workout' ? (
                    renderRunningSelection()
                ) : (
                    <View style={styles.container}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.m, marginBottom: spacing.s }}>
                            <Text style={styles.workoutName}>{workout.name}</Text>
                            <TouchableOpacity onPress={() => setWorkout(prev => ({ ...prev, name: 'New Workout' }))}>
                                <Text style={{ color: palette.primary.main }}>Byt pass</Text>
                            </TouchableOpacity>
                        </View>
                        <RunningSession onSave={finishRun} />
                    </View>
                )
            ) : (
                <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                    {/* Workout Name */}
                    {/* <Text style={styles.workoutName}>{workout.name}</Text> */}

                    {workout.exercises.map((exercise, index) => (
                        <ExerciseCard
                            key={`${exercise.exerciseId}-${index}`}
                            exercise={exercise}
                            onUpdate={(updated) => updateExercise(index, updated)}
                            onRemove={() => removeExercise(index)}
                            onPlayVideo={openVideo}
                            currentPr={existingPrs[exercise.exerciseId]?.weight}
                        />
                    ))}

                    {/* Action Buttons */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.largeButton} onPress={() => setModalVisible(true)}>
                            <Ionicons name="add" size={20} color={palette.accent.main} />
                            <Text style={styles.largeButtonText}>Exercise</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.largeButton, { marginLeft: spacing.m }]}>
                            <Ionicons name="add" size={20} color={palette.accent.main} />
                            <Text style={styles.largeButtonText}>Special set</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Summary / Map Placeholder */}
                    <View style={styles.summaryCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.summaryTitle}>Summary</Text>
                            <Ionicons name="help-circle-outline" size={20} color={palette.text.secondary} />
                        </View>
                        <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="body-outline" size={64} color={palette.text.disabled} />
                            {/* Placeholder for muscle map */}
                        </View>
                    </View>

                </ScrollView>
            )}

            {/* Bottom Bar (Mock) */}
            <View style={styles.bottomBar}>
                <View style={styles.timerBar}>
                    <TouchableOpacity style={styles.resetButton}>
                        <Ionicons name="refresh" size={18} color={palette.text.primary} />
                    </TouchableOpacity>

                    <Text style={styles.bottomTimer}>{formatTime(secondsElapsed)}</Text>

                    <TouchableOpacity style={styles.pauseButton} onPress={() => setIsPaused(!isPaused)}>
                        <Ionicons name={isPaused ? "play" : "pause"} size={18} color={palette.text.primary} />
                    </TouchableOpacity>
                </View>
            </View>


            {/* Exercise Selection Modal */}
            <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>

                    {/* Modal Headers / Search */}
                    <View style={styles.modalHeaderContainer}>
                        <View style={styles.modalTopRow}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                                <Ionicons name="arrow-back" size={24} color={palette.text.primary} />
                            </TouchableOpacity>
                            <View style={styles.modalSearchContainer}>
                                <Ionicons name="search" size={20} color={palette.text.secondary} style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.modalSearchInput}
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery.length > 0 &&
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={16} color={palette.text.disabled} />
                                    </TouchableOpacity>
                                }
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={24} color={palette.text.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Tabs */}
                        <View style={styles.modalTabs}>
                            <TouchableOpacity
                                style={[styles.modalTab, modalTab === 'MostUsed' && styles.modalTabActive]}
                                onPress={() => setModalTab('MostUsed')}
                            >
                                <Text style={[styles.modalTabText, modalTab === 'MostUsed' && styles.modalTabTextActive]}>Most used</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalTab, modalTab === 'All' && styles.modalTabActive]}
                                onPress={() => setModalTab('All')}
                            >
                                <Text style={[styles.modalTabText, modalTab === 'All' && styles.modalTabTextActive]}>All exercises</Text>
                            </TouchableOpacity>
                        </View>
                    </View>


                    {/* List */}
                    {isLoading ? <ActivityIndicator size="large" style={{ marginTop: 20 }} /> : (
                        <FlatList
                            data={filteredExercises}
                            keyExtractor={(item) => item.id || item.name}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.exerciseItem} onPress={() => addExercise(item)}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {/* Stick Figure Icon Placeholder */}
                                        <View style={styles.exerciseIconContainer}>
                                            <Ionicons name="body" size={16} color={palette.accent.main} />
                                        </View>
                                        <Text style={styles.exerciseName}>{item.name}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TouchableOpacity style={{ padding: 4 }} onPress={() => openVideo(item.defaultVideoUrl)}>
                                            <Ionicons name="play-circle-outline" size={24} color={palette.primary.main} />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ textAlign: 'center', color: palette.text.secondary, marginBottom: 12 }}>
                                        No exercises found.
                                    </Text>
                                    <TouchableOpacity
                                        style={{ backgroundColor: palette.primary.main, padding: 10, borderRadius: 8 }}
                                        onPress={fetchExercises}
                                    >
                                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Load Default Exercises</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    )}

                </View>
            </Modal>

            {/* NEW VIDEO MODAL */}
            <Modal visible={videoModalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16, backgroundColor: '#222' }}>
                        <TouchableOpacity onPress={() => setVideoModalVisible(false)}>
                            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <VideoPlayer url={currentVideoUrl} />
                </SafeAreaView>
            </Modal>

        </SafeAreaView>
    );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, isDark: boolean) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.background.default,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        backgroundColor: palette.background.default,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: palette.background.paper,
        alignItems: 'center',
        justifyContent: 'center',
    },
    finishCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: isDark ? '#1b4436' : '#E0F8E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerContainer: {
        paddingHorizontal: spacing.m,
    },
    timerText: {
        fontSize: typography.size.m,
        fontWeight: '500',
        color: palette.text.primary,
        fontVariant: ['tabular-nums'],
    },
    modeSelector: {
        flexDirection: 'row',
        backgroundColor: palette.border.default,
        borderRadius: 20,
        padding: 2,
    },
    modeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 18,
    },
    modeButtonActive: {
        backgroundColor: palette.background.paper,
    },
    modeText: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.text.secondary,
    },
    modeTextActive: {
        color: palette.text.primary,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.m,
        paddingBottom: 100,
    },
    actionsRow: {
        flexDirection: 'row',
        marginBottom: spacing.m,
    },
    largeButton: {
        flex: 1,
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.l,
        paddingVertical: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: palette.background.paper,
        ...shadows.small,
    },
    largeButtonText: {
        fontSize: typography.size.m,
        fontWeight: '500',
        color: palette.text.primary,
        marginLeft: 8,
    },
    summaryCard: {
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        ...shadows.small,
    },
    summaryTitle: {
        fontSize: typography.size.m,
        fontWeight: 'bold',
        color: palette.text.primary,
    },

    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: palette.background.paper,
        borderTopWidth: 1,
        borderTopColor: palette.border.default,
        paddingTop: spacing.s,
        paddingBottom: 30, // SafeArea
    },
    timerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.l,
        paddingBottom: spacing.s,
    },
    bottomTimer: {
        fontSize: typography.size.l,
        fontWeight: 'bold',
        color: palette.text.primary,
        fontVariant: ['tabular-nums'],
    },
    resetButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: palette.background.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pauseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.background.paper,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: palette.border.default,
    },

    // -------------------
    // MODAL STYLES
    // -------------------
    modalContainer: {
        flex: 1,
        backgroundColor: palette.background.default,
    },
    modalHeaderContainer: {
        backgroundColor: palette.background.paper,
        paddingTop: 16,
        paddingBottom: 0,
        ...shadows.small,
        zIndex: 10,
    },
    modalTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        marginBottom: spacing.s,
    },
    modalSearchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.background.default,
        borderRadius: 20,
        marginHorizontal: spacing.s,
        paddingHorizontal: spacing.m,
        height: 40,
    },
    modalSearchInput: {
        flex: 1,
        color: palette.text.primary,
    },
    modalTabs: {
        flexDirection: 'row',
        marginTop: spacing.s,
    },
    modalTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    modalTabActive: {
        borderBottomColor: palette.primary.main,
    },
    modalTabText: {
        fontSize: typography.size.s,
        fontWeight: '600',
        color: palette.text.secondary,
    },
    modalTabTextActive: {
        color: palette.primary.main,
    },

    // Filter Chips
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: palette.background.paper,
        marginRight: spacing.s,
        borderWidth: 1,
        borderColor: palette.border.default,
    },
    filterChipActive: {
        backgroundColor: palette.primary.main,
        borderColor: palette.primary.main,
    },
    filterText: {
        fontSize: typography.size.xs,
        fontWeight: '600',
        color: palette.text.secondary,
    },
    filterTextActive: {
        color: '#FFF',
    },

    // Checkbox
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        backgroundColor: palette.background.paper,
        marginBottom: spacing.s,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: palette.border.default,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxActive: {
        backgroundColor: palette.primary.main,
        borderColor: palette.primary.main,
    },
    checkboxText: {
        fontSize: typography.size.s,
        color: palette.text.primary,
    },

    // Exercise List
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m,
        backgroundColor: palette.background.paper,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: palette.border.default,
    },
    exerciseIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: palette.background.default,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    exerciseName: {
        fontSize: typography.size.m,
        fontWeight: '500',
        color: palette.text.primary,
    },
    workoutName: {
        fontSize: typography.size.l,
        fontWeight: 'bold',
        color: palette.text.primary,
    },
});
