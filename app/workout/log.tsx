import ExerciseCard from '@/components/ExerciseCard';
import RunningSession from '@/components/RunningSession';
import VideoPlayer from '@/components/VideoPlayer';
import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { db } from '@/lib/firebaseConfig';
import { checkAndSavePrs, getUserPrs } from '@/services/prService';
import { Exercise, PersonalRecord, Workout, WorkoutExercise } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, getDocs } from 'firebase/firestore'; // Check imports
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Helper to format seconds to HH:MM:SS
const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};




export default function WorkoutLoggerScreen() {
    const { user } = useSession();
    const router = useRouter();
    const params = useLocalSearchParams();

    const [workoutMode, setWorkoutMode] = useState<'strength' | 'running'>(
        (params.category as string) === 'löpning' ? 'running' : 'strength'
    );

    const [workout, setWorkout] = useState<Workout>({
        userId: user?.uid || '',
        name: (params.workoutName as string) || 'New Workout',
        date: new Date(),
        status: 'In Progress',
        exercises: params.initialExercises ? JSON.parse(params.initialExercises as string) : [],
        category: (params.category as string) as any || 'styrketräning'
    });

    // ... other state

    const finishRun = async (distance: number, duration: number) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const runningExercise: WorkoutExercise = {
                exerciseId: 'running-session', // specific ID or generate one
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

            const workoutData = {
                ...workout,
                status: 'Completed',
                date: new Date(),
                userId: user.uid,
                exercises: [runningExercise],
                category: 'löpning',
                subcategory: 'distans' // Default subcategory
            } as any; // Cast to any to avoid strict type issues if mismatch

            // Save Workout
            const workoutsRef = collection(db, `users/${user.uid}/workouts`);
            await addDoc(workoutsRef, workoutData);

            alert(`Löpning sparad!\nDistans: ${distance} km\nTid: ${formatTime(duration)}`);
            router.back();

        } catch (e: any) {
            console.error("Error saving run: ", e);
            alert(`Failed to save run: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };


    const [isModalVisible, setModalVisible] = useState(false);
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Modal State
    const [searchQuery, setSearchQuery] = useState('');
    const [modalTab, setModalTab] = useState<'MostUsed' | 'All'>('All');
    const [copySets, setCopySets] = useState(true);

    // Video Modal State
    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

    // PR State
    const [existingPrs, setExistingPrs] = useState<Record<string, PersonalRecord>>({});

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

    const fetchExercises = async () => {
        setIsLoading(true);
        try {
            console.log("Fetching exercises...");
            const querySnapshot = await getDocs(collection(db, "exercises"));
            const exercisesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
            console.log(`Fetched ${exercisesList.length} exercises`);
            setAvailableExercises(exercisesList);
        } catch (e: any) {
            console.error("Error fetching exercises: ", e);
            alert(`Error loading exercises: ${e.message || JSON.stringify(e)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const addExercise = (exercise: Exercise) => {
        const newExercise: WorkoutExercise = {
            exerciseId: exercise.id!,
            name: exercise.name,
            sets: [], // Start empty, let user add
            isBodyweight: exercise.isBodyweight,
            videoLink: exercise.defaultVideoUrl // Map from Exercise to WorkoutExercise
        };
        // Logic to maybe copy sets if copySets is true could go here (mocked for now)
        if (copySets) {
            // Mock copying sets logic if needed
        }

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

    const finishWorkout = async () => {
        if (!user) {
            alert('You must be logged in to save a workout.');
            return;
        }

        setIsLoading(true);
        try {
            const workoutData = {
                ...workout,
                status: 'Completed',
                date: new Date(),
                userId: user.uid,
                // Filter out empty exercises if any
                exercises: workout.exercises.filter(ex => ex.sets.length > 0)
            };

            // Save Workout to Firestore
            const workoutsRef = collection(db, `users/${user.uid}/workouts`);
            const docRef = await addDoc(workoutsRef, workoutData);

            // Check for New PRs
            const newPrs = await checkAndSavePrs(user.uid, workoutData.exercises, existingPrs, docRef.id);

            if (newPrs.length > 0) {
                alert(`Workout saved! 🎉 NEW RECORDS: \n${newPrs.join('\n')}`);
            } else {
                alert('Workout saved successfully!');
            }
            router.back();

        } catch (e: any) {
            console.error("Error saving workout: ", e);
            alert(`Failed to save workout: ${e.message || JSON.stringify(e)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const openVideo = (url?: string) => {
        if (url) {
            setCurrentVideoUrl(url);
            setVideoModalVisible(true);
        } else {
            alert('No video available for this exercise.');
        }
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
                    <Ionicons name="close" size={24} color={Palette.text.secondary} />
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
                            <Ionicons name={isPaused ? "play" : "pause"} size={18} color={Palette.text.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.iconButton, { marginRight: 8 }]}>
                            <Ionicons name="settings-sharp" size={18} color={Palette.text.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.finishCircle} onPress={finishWorkout}>
                            <Ionicons name="checkmark" size={18} color={Palette.primary.main} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {workoutMode === 'running' ? (
                <View style={styles.container}>
                    <RunningSession onSave={finishRun} />
                </View>
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
                            <Ionicons name="add" size={20} color={Palette.accent.main} />
                            <Text style={styles.largeButtonText}>Exercise</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.largeButton, { marginLeft: Spacing.m }]}>
                            <Ionicons name="add" size={20} color={Palette.accent.main} />
                            <Text style={styles.largeButtonText}>Special set</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Summary / Map Placeholder */}
                    <View style={styles.summaryCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.summaryTitle}>Summary</Text>
                            <Ionicons name="help-circle-outline" size={20} color={Palette.text.secondary} />
                        </View>
                        <View style={{ height: 100, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="body-outline" size={64} color={Palette.text.disabled} />
                            {/* Placeholder for muscle map */}
                        </View>
                    </View>

                </ScrollView>
            )}

            {/* Bottom Bar (Mock) */}
            <View style={styles.bottomBar}>
                <View style={styles.timerBar}>
                    <TouchableOpacity style={styles.resetButton}>
                        <Ionicons name="refresh" size={18} color={Palette.text.primary} />
                    </TouchableOpacity>

                    <Text style={styles.bottomTimer}>{formatTime(secondsElapsed)}</Text>

                    <TouchableOpacity style={styles.pauseButton} onPress={() => setIsPaused(!isPaused)}>
                        <Ionicons name={isPaused ? "play" : "pause"} size={18} color={Palette.text.primary} />
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
                                <Ionicons name="arrow-back" size={24} color={Palette.text.primary} />
                            </TouchableOpacity>
                            <View style={styles.modalSearchContainer}>
                                <Ionicons name="search" size={20} color={Palette.text.secondary} style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.modalSearchInput}
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery.length > 0 &&
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={16} color={Palette.text.disabled} />
                                    </TouchableOpacity>
                                }
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={24} color={Palette.text.primary} />
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

                    {/* Checkbox Row */}
                    <TouchableOpacity style={styles.checkboxRow} onPress={() => setCopySets(!copySets)}>
                        <View style={[styles.checkbox, copySets && styles.checkboxActive]}>
                            {copySets && <Ionicons name="checkmark" size={12} color="#FFF" />}
                        </View>
                        <Text style={styles.checkboxText}>Copy sets from last workout</Text>
                    </TouchableOpacity>

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
                                            <Ionicons name="body" size={16} color={Palette.accent.main} />
                                        </View>
                                        <Text style={styles.exerciseName}>{item.name}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TouchableOpacity style={{ padding: 4 }} onPress={() => openVideo(item.defaultVideoUrl)}>
                                            <Ionicons name="play-circle-outline" size={24} color={Palette.primary.main} />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ textAlign: 'center', color: Palette.text.secondary, marginBottom: 12 }}>
                                        No exercises found.
                                    </Text>
                                    <TouchableOpacity
                                        style={{ backgroundColor: Palette.primary.main, padding: 10, borderRadius: 8 }}
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

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        backgroundColor: '#F5F5F7',
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    finishCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E0F8E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerContainer: {
        paddingHorizontal: Spacing.m,
    },
    timerText: {
        fontSize: Typography.size.m,
        fontWeight: '500',
        color: Palette.text.primary,
        fontVariant: ['tabular-nums'],
    },
    modeSelector: {
        flexDirection: 'row',
        backgroundColor: '#E0E0E0',
        borderRadius: 20,
        padding: 2,
    },
    modeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 18,
    },
    modeButtonActive: {
        backgroundColor: '#FFF',
    },
    modeText: {
        fontSize: 12,
        fontWeight: '600',
        color: Palette.text.secondary,
    },
    modeTextActive: {
        color: Palette.text.primary,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.m,
        paddingBottom: 100,
    },
    actionsRow: {
        flexDirection: 'row',
        marginBottom: Spacing.m,
    },
    largeButton: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.l,
        paddingVertical: Spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FFF',
        ...Shadows.small,
    },
    largeButtonText: {
        fontSize: Typography.size.m,
        fontWeight: '500',
        color: Palette.text.primary,
        marginLeft: 8,
    },
    summaryCard: {
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.l,
        padding: Spacing.m,
        ...Shadows.small,
    },
    summaryTitle: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
    },

    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: Spacing.s,
        paddingBottom: 30, // SafeArea
    },
    timerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.l,
        paddingBottom: Spacing.s,
    },
    bottomTimer: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    resetButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#F0F0F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pauseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EEE',
    },

    // -------------------
    // MODAL STYLES
    // -------------------
    modalContainer: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    modalHeaderContainer: {
        backgroundColor: '#FFF',
        paddingTop: 16,
        paddingBottom: 0,
        ...Shadows.small,
        zIndex: 10,
    },
    modalTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        marginBottom: Spacing.s,
    },
    modalSearchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: 20,
        marginHorizontal: Spacing.s,
        paddingHorizontal: Spacing.m,
        height: 40,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: Typography.size.s,
        color: Palette.text.primary,
        height: '100%',
    },
    modalTabs: {
        flexDirection: 'row',
    },
    modalTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    modalTabActive: {
        borderBottomColor: Palette.text.primary,
    },
    modalTabText: {
        fontSize: Typography.size.s,
        fontWeight: '600',
        color: Palette.text.secondary,
    },
    modalTabTextActive: {
        color: Palette.text.primary,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginTop: Spacing.s,
        paddingHorizontal: Spacing.m,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Palette.border.default,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        backgroundColor: Palette.accent.main, // If active
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxActive: {
        backgroundColor: Palette.accent.main,
    },
    checkboxText: {
        fontSize: Typography.size.s,
        color: Palette.text.primary,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        paddingVertical: 14,
        paddingHorizontal: Spacing.m,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EEE',
    },
    exerciseIconContainer: {
        marginRight: 12,
        // Could enable this to look like the red stick figure
    },
    exerciseName: {
        fontSize: Typography.size.m,
        fontWeight: '500',
        color: Palette.text.primary,
    },
});
