import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { getStravaActivities, StravaActivity } from '@/services/stravaService';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ImageBackground, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useSession } from '@/context/ctx';
import { db } from '@/lib/firebaseConfig';
import { Workout, WorkoutTemplate } from '@/types';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';

interface WorkoutDetailsViewProps {
    workoutId: string;
    onClose?: () => void;
    workoutType?: 'template' | 'workout'; // optional
    initialData?: Workout | WorkoutTemplate; // if already loaded
    showBack?: boolean; // Show back button vs close
    isModal?: boolean;
}

export default function WorkoutDetailsView({
    workoutId,
    onClose,
    workoutType = 'workout',
    initialData,
    showBack = true,
    isModal = false
}: WorkoutDetailsViewProps) {
    const router = useRouter();
    const { user } = useSession(); // Get user for auth and paths

    // If initialData is provided, use it
    const [data, setData] = useState<Workout | WorkoutTemplate | null>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [completing, setCompleting] = useState(false);
    const [scheduling, setScheduling] = useState(false);

    // Scheduling state
    const [scheduledDate, setScheduledDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Logging State (Running)
    const [completionDistance, setCompletionDistance] = useState('');
    const [completionDuration, setCompletionDuration] = useState('');
    const [isStravaLoading, setIsStravaLoading] = useState(false);

    // Strava Picker
    const [showStravaPicker, setShowStravaPicker] = useState(false);
    const [stravaActivities, setStravaActivities] = useState<StravaActivity[]>([]);

    // Strava Auth




    const fetchStravaActivitiesForPicker = async () => {
        if (!user) return;
        setIsStravaLoading(true);
        try {
            const activities = await getStravaActivities(user.uid, 1, 30); // Get latest 30, pass userId
            if (activities && activities.length > 0) {
                setStravaActivities(activities);
                setShowStravaPicker(true);
            } else {
                alert("Inga aktiviteter hittades på Strava.");
            }
        } catch (e: any) {
            console.log("Fetch failed", e);
            if (e.message.includes("No Strava connection")) {
                Alert.alert("Koppla Strava", "Du måste koppla ditt Strava-konto under Profil för att hämta pass.");
            } else {
                Alert.alert("Fel", "Kunde inte hämta aktiviteter.");
            }
        } finally {
            setIsStravaLoading(false);
        }
    };

    const handleFetchStrava = () => {
        fetchStravaActivitiesForPicker();
    };

    const selectStravaActivity = (act: StravaActivity) => {
        const km = (act.distance / 1000).toFixed(2);
        const min = Math.round(act.moving_time / 60).toString();
        setCompletionDistance(km);
        setCompletionDuration(min);
        setShowStravaPicker(false);
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || scheduledDate;
        setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS if desired, or close. Typically close on Android.
        if (event.type === 'set' || Platform.OS === 'ios') {
            setScheduledDate(currentDate);
        }
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
    };

    const isCompleted = (data as Workout)?.status === 'Completed';
    const isRunning = data?.category === 'löpning';

    useEffect(() => {
        if (initialData) return; // Skip if data provided

        // Initial fetch handled by focus effect or this effect?
        // Let's rely on useFocusEffect to handle both initial and return-focus.
        // But useEffect is safer for initial mount if not focused yet?
        // Actually, useFocusEffect runs on mount too.
    }, [workoutId, workoutType, user, initialData]);

    useFocusEffect(
        useCallback(() => {
            if (initialData) return;
            const fetchData = async () => {
                if (!workoutId || typeof workoutId !== 'string') return;
                // Don't set loading to true on refresh to avoid flickering if possible, or do?
                // setLoading(true); 
                try {
                    if (workoutType === 'template') {
                        const docRef = doc(db, 'workout_templates', workoutId);
                        const snap = await getDoc(docRef);
                        if (snap.exists()) {
                            setData({ id: snap.id, ...snap.data() } as WorkoutTemplate);
                        }
                    } else if (user) {
                        // Fetch User Workout
                        const docRef = doc(db, 'users', user.uid, 'workouts', workoutId);
                        const snap = await getDoc(docRef);
                        if (snap.exists()) {
                            setData({ id: snap.id, ...snap.data() } as Workout);
                        }
                    }
                } catch (e) {
                    console.error("Error fetching workout details:", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }, [workoutId, workoutType, user, initialData])
    );

    const handleQuickComplete = async () => {
        if (!user || !workoutId || typeof workoutId !== 'string') return;
        setCompleting(true);
        try {
            const docRef = doc(db, 'users', user.uid, 'workouts', workoutId);

            const updatePayload: any = {
                status: 'Completed',
                completedAt: new Date()
            };

            // If running, add logging data
            if (isRunning) {
                if (completionDistance) updatePayload.distance = parseFloat(completionDistance.replace(',', '.'));
                if (completionDuration) updatePayload.duration = parseInt(completionDuration, 10) * 60; // store in seconds
            }

            await updateDoc(docRef, updatePayload);
            // Alert.alert('Bra jobbat!', 'Passet är klarmarkerat.');
            if (onClose) onClose();
            else router.back();
        } catch (e: any) {
            console.error("Failed to complete:", e);
            // Fallback for error simply logging it for now as Alert is broken
        } finally {
            setCompleting(false);
        }
    };

    const handleSchedule = async () => {
        if (!user) return;
        if (!data) return;

        setScheduling(true);
        try {
            // Create a new workout instance from template
            const workoutData: Partial<Workout> = {
                userId: user.uid,
                name: data.name,
                date: new Date(), // Created date
                scheduledDate: scheduledDate, // Selected date
                status: 'Planned',
                exercises: (data as any).exercises || [],
                category: data.category,
                subcategory: data.subcategory,
                notes: (data as any).note || (data as any).notes || (data as any).description,

            };

            await addDoc(collection(db, 'users', user.uid, 'workouts'), workoutData);

            // Alert.alert(...) removed. Just close/back.
            if (onClose) onClose();
            else router.back();

        } catch (e: any) {
            console.error("Failed to schedule:", e);
        } finally {
            setScheduling(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { flex: 1, minHeight: 300 }]}>
                <ActivityIndicator size="large" color={Palette.primary.main} />
            </View>
        );
    }

    // Fallback title if data fetch failed or mock mode
    const displayTitle = data?.name || 'Träningspass';
    const displayDesc = (data as any)?.notes || (data as any)?.note || (data as any)?.description || 'Ingen beskrivning.';
    // @ts-ignore
    const displayDate = data?.scheduledDate?.toDate ? data.scheduledDate.toDate().toLocaleDateString() : '';

    return (
        <View style={styles.container}>
            <ImageBackground
                source={{ uri: isRunning ? 'https://images.unsplash.com/photo-1552674605-46d52677663d?q=80&w=2070&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop' }}
                style={styles.headerImage}
            >
                <View style={styles.headerOverlay}>
                    <SafeAreaView>
                        {(showBack || isModal) && (
                            <TouchableOpacity onPress={onClose || (() => router.back())} style={styles.backButton}>
                                <FontAwesome name={isModal ? "close" : "chevron-left"} size={24} color="#FFF" />
                            </TouchableOpacity>
                        )}

                        <View>
                            <Text style={styles.headerDate}>{displayDate || 'Översikt'}</Text>
                            <Text style={styles.headerTitle}>{displayTitle}</Text>

                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{data?.category === 'löpning' ? 'Löpning' : 'Styrka'}</Text>
                                </View>
                                {data?.subcategory && (
                                    <View style={[styles.tag, { backgroundColor: '#FFCA28' }]}>
                                        <Text style={[styles.tagText, { color: '#000' }]}>{data.subcategory.charAt(0).toUpperCase() + data.subcategory.slice(1)}</Text>
                                    </View>
                                )}
                                {data?.distance && (
                                    <View style={styles.tag}>
                                        <FontAwesome name="road" size={12} color="#FFF" style={{ marginRight: 4 }} />
                                        <Text style={styles.tagText}>{data.distance} km</Text>
                                    </View>
                                )}
                                {data?.duration && (
                                    <View style={styles.tag}>
                                        <FontAwesome name="clock-o" size={12} color="#FFF" style={{ marginRight: 4 }} />
                                        <Text style={styles.tagText}>{data.duration} min</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Edit Button for Templates */}
                        {workoutType === 'template' && (
                            <TouchableOpacity
                                onPress={() => router.push({ pathname: '/workout/edit-template', params: { id: workoutId } })}
                                style={styles.editButton}
                            >
                                <FontAwesome name="pencil" size={24} color="#FFF" />
                            </TouchableOpacity>
                        )}
                    </SafeAreaView>
                </View>
            </ImageBackground >

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* COMPLETED CARD (Blue) */}
                {isCompleted && (
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <FontAwesome name="check-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.summaryTitle}>Pass klarmarkerat!</Text>
                            </View>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                {(data as any)?.completedAt instanceof Date ? (data as any).completedAt.toLocaleDateString() : ((data as any)?.completedAt?.toDate ? (data as any).completedAt.toDate().toLocaleDateString() : '')}
                            </Text>
                        </View>

                        {(data?.distance || data?.duration) && (
                            <View style={{ flexDirection: 'row', marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 12 }}>
                                {data?.distance && (
                                    <View style={{ marginRight: 24 }}>
                                        <Text style={styles.statLabel}>STRÄCKA</Text>
                                        <Text style={styles.statValue}>{data.distance} km</Text>
                                    </View>
                                )}
                                {data?.duration && (
                                    <View>
                                        <Text style={styles.statLabel}>TID</Text>
                                        <Text style={styles.statValue}>
                                            {Math.floor(data.duration / 3600) > 0 ? `${Math.floor(data.duration / 3600)}h ` : ''}
                                            {Math.round((data.duration % 3600) / 60)} min
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <Text style={{ color: 'white', opacity: 0.9, marginTop: (data?.distance || data?.duration) ? 12 : 0 }}>Bra jobbat!</Text>
                    </View>
                )}

                {/* LOGIC SPLIT: RUNNING VS OTHER */}

                {isRunning ? (
                    /* --- RUNNING VIEW (Simple) --- */
                    <View>
                        <View style={styles.detailsContainer}>
                            <View style={[styles.detailsHeader, { backgroundColor: Palette.primary.main }]}>
                                <Text style={styles.detailsTitle}>Om Passet</Text>
                            </View>
                            <View style={styles.detailSection}>
                                <Text style={styles.descriptionText}>{displayDesc}</Text>
                            </View>
                        </View>

                        {/* ACTION BUTTONS FOR RUNNING */}
                        {workoutType === 'template' ? (
                            <View style={{ marginTop: Spacing.xl }}>
                                {Platform.OS === 'web' ? (
                                    <View style={{ marginBottom: 16, alignItems: 'center' }}>
                                        <Text style={{ color: Palette.text.secondary, marginBottom: 8 }}>Planerat datum:</Text>
                                        <View style={[styles.datePickerButton, { padding: 0 }]}>
                                            {React.createElement('input', {
                                                type: 'date',
                                                value: scheduledDate.toLocaleDateString('sv-SE'), // Use local YYYY-MM-DD
                                                onChange: (e: any) => {
                                                    if (!e.target.value) return;
                                                    const parts = e.target.value.split('-');
                                                    // Create local date at noon to avoid DST/midnight issues
                                                    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                                                    setScheduledDate(d);
                                                },
                                                style: {
                                                    border: 'none',
                                                    background: 'transparent',
                                                    padding: Spacing.m,
                                                    paddingVertical: Spacing.s,
                                                    fontSize: Typography.size.m,
                                                    color: Palette.text.primary,
                                                    fontFamily: 'inherit',
                                                    outline: 'none',
                                                    width: 'fit-content'
                                                }
                                            })}
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <View style={{ marginBottom: 16, alignItems: 'center' }}>
                                            <Text style={{ color: Palette.text.secondary, marginBottom: 8 }}>Planerat datum:</Text>
                                            <TouchableOpacity
                                                onPress={() => setShowDatePicker(true)}
                                                style={styles.datePickerButton}
                                                activeOpacity={0.7}
                                            >
                                                <FontAwesome name="calendar" size={16} color={Palette.primary.main} style={{ marginRight: 8 }} />
                                                <Text style={styles.datePickerText}>{scheduledDate.toLocaleDateString()}</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {showDatePicker && (
                                            <DateTimePicker
                                                testID="dateTimePicker"
                                                value={scheduledDate}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                                onChange={onChangeDate}
                                                style={{ width: '100%', marginBottom: Spacing.m }}
                                            />
                                        )}
                                    </>
                                )}

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.primaryAction, { paddingVertical: Spacing.m }]}
                                    onPress={handleSchedule}
                                    disabled={scheduling}
                                >
                                    {scheduling ? <ActivityIndicator color={Palette.text.primary} /> : (
                                        <Text style={[styles.actionText, { fontSize: 18 }]}>Planera in pass</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            !isCompleted && (
                                <View style={{ marginTop: Spacing.xl }}>

                                    {/* LOGGING INPUTS */}
                                    <View style={{ marginBottom: Spacing.l }}>
                                        <Text style={{ fontWeight: 'bold', marginBottom: Spacing.s, color: Palette.text.primary }}>Logga resultat (valfritt)</Text>
                                        <View style={{ flexDirection: 'row', gap: Spacing.m }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: Typography.size.xs, color: Palette.text.secondary, marginBottom: 4 }}>Sträcka (km)</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="0.0"
                                                    keyboardType="numeric"
                                                    value={completionDistance}
                                                    onChangeText={setCompletionDistance}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: Typography.size.xs, color: Palette.text.secondary, marginBottom: 4 }}>Tid (min)</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="0"
                                                    keyboardType="numeric"
                                                    value={completionDuration}
                                                    onChangeText={setCompletionDuration}
                                                />
                                            </View>
                                        </View>

                                        {/* STRAVA BUTTON */}
                                        <TouchableOpacity
                                            style={[styles.actionButton, { marginTop: Spacing.m, backgroundColor: '#FC4C02', borderWidth: 0 }]}
                                            onPress={handleFetchStrava}
                                            disabled={isStravaLoading}
                                        >
                                            {isStravaLoading ? <ActivityIndicator color="#FFF" /> : (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FontAwesome name="cloud-download" size={16} color="#FFF" style={{ marginRight: 8 }} />
                                                    <Text style={[styles.actionText, { color: '#FFF' }]}>Hämta från Strava</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.completeButton]}
                                        onPress={handleQuickComplete}
                                        disabled={completing}
                                    >
                                        {completing ? <ActivityIndicator color="#FFF" /> : (
                                            <>
                                                <FontAwesome name="check" size={24} color="#FFF" style={{ marginRight: 12 }} />
                                                <Text style={styles.completeButtonText}>Klarmarkera Pass</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )
                        )}
                    </View>
                ) : (
                    /* --- STRENGTH/OTHER VIEW (Detailed) --- */
                    <View>

                        {/* ACTIONS FOR STRENGTH/OTHER */}
                        {workoutType === 'template' ? (
                            <View style={styles.actionContainer}>
                                <View style={{ flex: 1 }}>

                                    {/* Date Picker */}
                                    {/* For layout in this container, we should probably stack: Date Picker -> Button */}

                                    {Platform.OS === 'web' ? (
                                        <View style={{ marginBottom: 16, alignItems: 'center' }}>
                                            <Text style={{ color: Palette.text.secondary, marginBottom: 4 }}>Planerat datum:</Text>
                                            <View style={[styles.datePickerButton, { padding: 0 }]}>
                                                {React.createElement('input', {
                                                    type: 'date',
                                                    value: scheduledDate.toISOString().split('T')[0],
                                                    onChange: (e: any) => setScheduledDate(new Date(e.target.value)),
                                                    style: {
                                                        border: 'none',
                                                        background: 'transparent',
                                                        padding: Spacing.m,
                                                        paddingVertical: Spacing.s,
                                                        fontSize: Typography.size.m,
                                                        color: Palette.text.primary,
                                                        fontFamily: 'inherit',
                                                        outline: 'none',
                                                        width: 'fit-content'
                                                    }
                                                })}
                                            </View>
                                        </View>
                                    ) : (
                                        <>
                                            <View style={{ marginBottom: Spacing.m, alignItems: 'center' }}>
                                                <Text style={{ color: Palette.text.secondary, marginBottom: 4 }}>Planerat datum:</Text>
                                                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                                                    <FontAwesome name="calendar" size={16} color={Palette.primary.main} style={{ marginRight: 8 }} />
                                                    <Text style={styles.datePickerText}>{scheduledDate.toLocaleDateString()}</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {showDatePicker && (
                                                <DateTimePicker
                                                    testID="dateTimePicker"
                                                    value={scheduledDate}
                                                    mode="date"
                                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                                    onChange={onChangeDate}
                                                    style={{ width: '100%', marginBottom: 8 }}
                                                />
                                            )}
                                        </>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.primaryAction]}
                                        onPress={handleSchedule}
                                        disabled={scheduling}
                                    >
                                        {scheduling ? <ActivityIndicator color={Palette.text.primary} /> : (
                                            <Text style={[styles.actionText, { color: Palette.text.primary }]}>Planera in pass</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            !isCompleted && (
                                <View style={styles.actionContainer}>
                                    <TouchableOpacity style={styles.actionButton}>
                                        <Text style={styles.actionText}>Skippa</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionButton}>
                                        <Text style={styles.actionText}>Byt</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.primaryAction]}
                                        onPress={() => {
                                            const initialExercises = (data as any)?.exercises ? JSON.stringify((data as any).exercises) : undefined;
                                            // If modal, we might want to close modal?
                                            if (onClose) onClose();
                                            router.push({
                                                pathname: '/workout/log',
                                                params: {
                                                    workoutName: displayTitle,
                                                    initialExercises: initialExercises
                                                }
                                            });
                                        }}
                                    >
                                        <Text style={[styles.actionText, { color: Palette.text.primary }]}>Logga pass</Text>
                                    </TouchableOpacity>
                                </View>
                            )
                        )}

                        <View style={styles.detailsContainer}>
                            <View style={styles.detailsHeader}>
                                <Text style={styles.detailsTitle}>{displayTitle}</Text>
                            </View>

                            <View style={styles.detailSection}>
                                {(data as any)?.exercises && (data as any).exercises.length > 0 ? (
                                    (data as any).exercises.map((ex: any, idx: number) => (
                                        <View key={idx} style={{ marginBottom: 12, borderBottomWidth: idx === (data as any).exercises.length - 1 ? 0 : 1, borderBottomColor: '#EEE', paddingBottom: 8 }}>
                                            <Text style={[styles.detailLabel, { fontSize: 16 }]}>{ex.name}</Text>
                                            <Text style={styles.detailValue}>{ex.sets?.length || 3} set</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.detailValue}>Inga övningar specificerade.</Text>
                                )}
                            </View>

                            {displayDesc && (
                                <>
                                    <View style={styles.divider} />
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Notering</Text>
                                        <Text style={styles.descriptionText}>{displayDesc}</Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                )}

            </ScrollView >

            {/* STRAVA PICKER MODAL */}
            <Modal visible={showStravaPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowStravaPicker(false)}>
                <View style={[styles.container, { backgroundColor: '#F5F5F7' }]}>
                    <View style={styles.header}>
                        {/* Reusing some header styles or inline styles for simplicity */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.m, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
                            <Text style={{ fontSize: Typography.size.l, fontWeight: 'bold' }}>Välj Strava-pass</Text>
                            <TouchableOpacity onPress={() => setShowStravaPicker(false)}>
                                <FontAwesome name="close" size={24} color={Palette.text.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <FlatList
                        data={stravaActivities}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ padding: Spacing.m }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={{ backgroundColor: '#FFF', padding: Spacing.m, marginBottom: Spacing.s, borderRadius: BorderRadius.m, ...Shadows.small }}
                                onPress={() => selectStravaActivity(item)}
                            >
                                <Text style={{ fontWeight: 'bold', fontSize: Typography.size.m, marginBottom: 4 }}>{item.name}</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ color: Palette.text.secondary }}>{(item.distance / 1000).toFixed(2)} km • {Math.floor(item.moving_time / 60)} min</Text>
                                    <Text style={{ color: Palette.text.disabled, fontSize: 12 }}>{new Date(item.start_date).toLocaleDateString()}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Palette.background.default,
    },
    headerImage: {
        width: '100%',
        height: 250,
    },
    headerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'space-between',
        padding: Spacing.m,
    },
    backButton: {
        marginTop: Spacing.s,
        alignSelf: 'flex-start',
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 20,
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagText: {
        color: '#FFF',
        fontSize: Typography.size.xs,
        fontWeight: 'bold',
    },
    headerContent: {
        marginBottom: Spacing.l,
    },
    editButton: {
        position: 'absolute',
        top: 60, // approximate safe area
        right: Spacing.m,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 20,
    },
    headerDate: {
        color: '#E0E0E0',
        fontSize: Typography.size.s,
        fontWeight: '600',
        marginBottom: 4,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: Typography.size.xxl,
        fontWeight: 'bold',
    },
    content: {
        marginTop: -20, // Overlap header
        borderTopLeftRadius: BorderRadius.l,
        borderTopRightRadius: BorderRadius.l,
        backgroundColor: Palette.background.default,
        padding: Spacing.m,
    },
    // BLUE SUMMARY CARD
    summaryCard: {
        backgroundColor: '#5282CA', // Matching screenshot blue
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.l,
        ...Shadows.medium,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    // Picker Header
    header: {
        backgroundColor: '#FFF',
    },
    summaryTitle: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: Typography.size.m,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: Typography.size.xs,
        fontWeight: '600',
        marginBottom: 2,
    },
    statValue: {
        color: '#FFF',
        fontSize: Typography.size.l,
        fontWeight: 'bold',
    },
    commentContainer: {
        marginTop: Spacing.m,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        paddingTop: Spacing.s,
    },
    commentText: {
        color: '#FFF',
        fontStyle: 'italic',
    },

    // ACTION BUTTONS (Planned)
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.l,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingVertical: Spacing.s,
        marginHorizontal: 4,
        borderRadius: BorderRadius.round,
        alignItems: 'center',
        ...Shadows.small,
    },
    primaryAction: {
        backgroundColor: '#FFF', // Keeping white background as per screenshot
        borderWidth: 2,
        borderColor: Palette.text.primary, // Dark border to signify primary
    },
    actionText: {
        fontWeight: 'bold',
        fontSize: Typography.size.s,
        color: Palette.text.primary,
    },

    // DETAILS SECTION
    detailsContainer: {
        backgroundColor: Palette.background.paper,
        borderRadius: BorderRadius.m,
        padding: 0, // Header is colored
        overflow: 'hidden',
        ...Shadows.small,
    },
    detailsHeader: {
        backgroundColor: '#5282CA', // Blue header
        padding: Spacing.s,
        paddingHorizontal: Spacing.m,
    },
    detailsTitle: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: Typography.size.s,
    },
    detailRow: {
        flexDirection: 'row',
        padding: Spacing.m,
    },
    detailSection: {
        padding: Spacing.m,
    },
    detailLabel: {
        fontWeight: 'bold',
        fontSize: Typography.size.xs,
        marginBottom: 4,
        color: Palette.text.primary,
    },
    detailValue: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
    detailSmall: {
        fontSize: Typography.size.xs,
        color: Palette.text.secondary,
        textAlign: 'right',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: Palette.border.default,
        marginHorizontal: Spacing.m,
    },
    descriptionText: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        lineHeight: 20,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    completeButton: {
        backgroundColor: Palette.primary.main, // Green
        paddingVertical: Spacing.m,
        height: 60,
        justifyContent: 'center',
        borderWidth: 0, // Override default white border
        ...Shadows.medium,
    },
    completeButtonText: {
        color: '#FFF',
        fontSize: Typography.size.l,
        fontWeight: 'bold',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Palette.background.paper,
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        borderRadius: BorderRadius.s,
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    datePickerText: {
        fontSize: Typography.size.m,
        color: Palette.text.primary,
        fontWeight: '600'
    },
    input: {
        backgroundColor: Palette.background.paper,
        borderWidth: 1,
        borderColor: Palette.border.default,
        borderRadius: BorderRadius.s,
        padding: Spacing.s,
        fontSize: Typography.size.m,
    }
});
