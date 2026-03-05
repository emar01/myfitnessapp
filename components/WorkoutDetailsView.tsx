import StravaActivityPicker from '@/components/StravaActivityPicker';
import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { StravaActivity } from '@/services/stravaService';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAlert } from '@/context/AlertContext';
import { useSession } from '@/context/ctx';
import { db } from '@/lib/firebaseConfig';
import { Workout, WorkoutTemplate } from '@/types';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';

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
    const { showAlert, showConfirm } = useAlert();

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




    const handleFetchStrava = () => {
        setShowStravaPicker(true);
    };

    const selectStravaActivity = async (act: StravaActivity) => {
        if (!user || !workoutId || typeof workoutId !== 'string') return;
        setCompleting(true);
        setShowStravaPicker(false);

        try {
            const docRef = doc(db, 'users', user.uid, 'workouts', workoutId);

            const km = (act.distance / 1000).toFixed(2);
            const min = Math.round(act.moving_time / 60).toString();

            const updatePayload: any = {
                status: 'Completed',
                completedAt: new Date(act.start_date), // Use Strava's start date
                date: new Date(), // Update date to now so it appears in "Recent Activities" properly
                distance: parseFloat(km),
                duration: parseInt(min, 10) * 60, // store in seconds
            };

            await updateDoc(docRef, updatePayload);
            if (onClose) onClose();
            else router.back();
        } catch (e: any) {
            console.error("Failed to complete with Strava:", e);
            showAlert("Fel", "Kunde inte spara passet med Strava-data.");
        } finally {
            setCompleting(false);
        }
    };

    const formatDateStr = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || scheduledDate;
        if (Platform.OS !== 'ios') {
            setShowDatePicker(false);
        }
        if (event.type === 'set' || Platform.OS === 'ios') {
            setScheduledDate(currentDate);
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
                completedAt: new Date(),
                date: new Date() // Update date to now so it appears in "Recent Activities" properly
            };

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

    const handleReschedule = async () => {
        if (!user || !workoutId || typeof workoutId !== 'string') return;
        setScheduling(true);
        try {
            const docRef = doc(db, 'users', user.uid, 'workouts', workoutId);
            await updateDoc(docRef, { scheduledDate });
            if (onClose) onClose();
            else router.back();
        } catch (e: any) {
            console.error('Failed to reschedule:', e);
        } finally {
            setScheduling(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !workoutId || typeof workoutId !== 'string') return;

        const confirmed = await showConfirm(
            "Ta bort pass",
            "Är du säker på att du vill ta bort det här passet? Det går inte att ångra.",
            { confirmText: "Ta bort", cancelText: "Avbryt", isDestructive: true }
        );

        if (!confirmed) return;

        try {
            await deleteDoc(doc(db, 'users', user.uid, 'workouts', workoutId));
            if (onClose) onClose();
            else router.back();
        } catch (e) {
            console.error("Failed to delete workout:", e);
            showAlert("Fel", "Kunde inte ta bort passet.");
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

    const renderManageCard = (showLogButton = false) => {
        // Om passet redan är klarmarkerat visas inget manage-kort
        if (isCompleted) return null;

        return (
            <View style={styles.manageCard}>
                <Text style={styles.manageCardTitle}>Hantera pass</Text>

                {workoutType === 'template' ? (
                    <View>
                        <View style={styles.manageRow}>
                            <Text style={styles.manageLabel}>Planerat datum</Text>
                            {Platform.OS === 'web' ? (
                                <View style={[styles.datePickerButton, { padding: 0, paddingVertical: 4 }]}>
                                    {React.createElement('input', {
                                        type: 'date',
                                        value: formatDateStr(scheduledDate),
                                        onChange: (e: any) => {
                                            if (!e.target.value) return;
                                            const parts = e.target.value.split('-');
                                            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                                            setScheduledDate(d);
                                        },
                                        style: { border: 'none', background: 'transparent', padding: 8, fontSize: 14, color: Palette.text.primary, fontFamily: 'inherit', outline: 'none', width: 'fit-content' }
                                    })}
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                                    <FontAwesome name="calendar" size={14} color={Palette.primary.main} style={{ marginRight: 6 }} />
                                    <Text style={styles.manageLabel}>{scheduledDate.toLocaleDateString()}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {Platform.OS !== 'web' && showDatePicker && (
                            <DateTimePicker
                                testID="dateTimePickerTemplate"
                                value={scheduledDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                onChange={onChangeDate}
                                style={{ width: '100%', marginBottom: Spacing.s }}
                            />
                        )}

                        <TouchableOpacity style={styles.manageButtonPrimary} onPress={handleSchedule} disabled={scheduling}>
                            {scheduling ? <ActivityIndicator color="#FFF" /> : (
                                <>
                                    <FontAwesome name="calendar-plus-o" size={16} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.manageButtonTextPrimary}>Planera in pass</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <View style={styles.manageRow}>
                            <Text style={styles.manageLabel}>Omplanera till</Text>
                            {Platform.OS === 'web' ? (
                                <View style={[styles.datePickerButton, { padding: 0, paddingVertical: 4 }]}>
                                    {React.createElement('input', {
                                        type: 'date',
                                        value: formatDateStr(scheduledDate),
                                        onChange: (e: any) => {
                                            if (!e.target.value) return;
                                            const parts = e.target.value.split('-');
                                            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                                            setScheduledDate(d);
                                        },
                                        style: { border: 'none', background: 'transparent', padding: 8, fontSize: 14, color: Palette.text.primary, fontFamily: 'inherit', outline: 'none', width: 'fit-content' }
                                    })}
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                                    <FontAwesome name="calendar" size={14} color={Palette.primary.main} style={{ marginRight: 6 }} />
                                    <Text style={styles.manageLabel}>{scheduledDate.toLocaleDateString()}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {Platform.OS !== 'web' && showDatePicker && (
                            <DateTimePicker
                                testID="dateTimePickerReschedule"
                                value={scheduledDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                onChange={onChangeDate}
                                style={{ width: '100%', marginBottom: Spacing.s }}
                            />
                        )}

                        <TouchableOpacity style={styles.manageButtonSecondary} onPress={handleReschedule} disabled={scheduling}>
                            {scheduling ? <ActivityIndicator color={Palette.text.primary} /> : <Text style={styles.manageButtonTextSecondary}>Spara nytt datum</Text>}
                        </TouchableOpacity>

                        <View style={styles.manageDivider} />

                        {showLogButton ? (
                            <View style={{ flexDirection: 'row', gap: Spacing.s }}>
                                <TouchableOpacity
                                    style={styles.manageButtonOutline}
                                    onPress={async () => {
                                        let exercises = (data as any)?.exercises || [];
                                        if (exercises.length === 0 && data?.name) {
                                            try {
                                                const q = query(
                                                    collection(db, 'workout_templates'),
                                                    where('name', '==', data.name)
                                                );
                                                const snap = await getDocs(q);
                                                if (!snap.empty) {
                                                    exercises = snap.docs[0].data()?.exercises || [];
                                                }
                                            } catch (e) {
                                                console.warn('Could not fetch template exercises:', e);
                                            }
                                        }
                                        const initialExercises = exercises.length > 0 ? JSON.stringify(exercises) : undefined;
                                        if (onClose) onClose();
                                        router.push({
                                            pathname: '/workout/log',
                                            params: {
                                                workoutName: displayTitle,
                                                category: data?.category,
                                                initialExercises: initialExercises,
                                                programId: (data as any)?.programId,
                                                workoutTemplateId: (data as any)?.workoutTemplateId
                                            }
                                        });
                                    }}
                                >
                                    <FontAwesome name="pencil" size={16} color={Palette.text.primary} style={{ marginRight: 6 }} />
                                    <Text style={styles.manageButtonTextSecondary}>Logga pass</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.manageButtonPrimary, { flex: 1 }]} onPress={handleQuickComplete} disabled={completing}>
                                    {completing ? <ActivityIndicator color="#FFF" /> : (
                                        <>
                                            <FontAwesome name="check" size={16} color="#FFF" style={{ marginRight: 8 }} />
                                            <Text style={styles.manageButtonTextPrimary}>Klarmarkera</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : isRunning ? (
                            <View style={{ flexDirection: 'row', gap: Spacing.s }}>
                                <TouchableOpacity style={styles.manageButtonOutline} onPress={handleQuickComplete} disabled={completing}>
                                    {completing ? <ActivityIndicator color={Palette.text.primary} /> : (
                                        <Text style={styles.manageButtonTextSecondary}>Manuellt</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.manageButtonPrimary, { flex: 1, backgroundColor: '#FC4C02' }]} onPress={handleFetchStrava} disabled={completing || isStravaLoading}>
                                    {isStravaLoading ? <ActivityIndicator color="#FFF" /> : (
                                        <>
                                            <FontAwesome name="flash" size={16} color="#FFF" style={{ marginRight: 8 }} />
                                            <Text style={styles.manageButtonTextPrimary}>Strava</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.manageButtonPrimary} onPress={handleQuickComplete} disabled={completing}>
                                {completing ? <ActivityIndicator color="#FFF" /> : (
                                    <>
                                        <FontAwesome name="check" size={16} color="#FFF" style={{ marginRight: 8 }} />
                                        <Text style={styles.manageButtonTextPrimary}>Klarmarkera pass</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

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
                        {renderManageCard()}
                    </View>
                ) : (
                    /* --- STRENGTH/OTHER VIEW (Detailed) --- */
                    <View>
                        {/* ACTIONS FOR STRENGTH/OTHER */}
                        {renderManageCard(true)}
                    </View>
                )}

                {!isRunning && (
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
                )}

                {workoutType !== 'template' && (
                    <View style={styles.deleteButtonContainer}>
                        <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                            <Text style={styles.deleteText}>Ta bort pass</Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>

            <StravaActivityPicker
                visible={showStravaPicker}
                onClose={() => setShowStravaPicker(false)}
                onSelect={selectStravaActivity}
            />
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
    },
    // MANAGE CARD
    manageCard: {
        backgroundColor: Palette.background.paper,
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        marginTop: Spacing.l,
        marginBottom: Spacing.s,
        borderWidth: 1,
        borderColor: Palette.border.default,
        ...Shadows.small,
    },
    manageCardTitle: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
        marginBottom: Spacing.m,
    },
    manageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.m,
    },
    manageLabel: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        fontWeight: '500',
    },
    manageButtonPrimary: {
        backgroundColor: Palette.primary.main,
        paddingVertical: Spacing.m,
        borderRadius: BorderRadius.s,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    manageButtonOutline: {
        flex: 1,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: Palette.border.default,
        paddingVertical: Spacing.m,
        borderRadius: BorderRadius.s,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    manageButtonTextPrimary: {
        color: '#FFF',
        fontSize: Typography.size.m,
        fontWeight: 'bold',
    },
    manageButtonSecondary: {
        backgroundColor: Palette.background.default,
        paddingVertical: Spacing.s,
        borderRadius: BorderRadius.s,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    manageButtonTextSecondary: {
        color: Palette.text.primary,
        fontSize: Typography.size.s,
        fontWeight: 'bold',
    },
    manageDivider: {
        height: 1,
        backgroundColor: Palette.border.default,
        marginVertical: Spacing.m,
    },
    deleteButtonContainer: {
        marginTop: Spacing.xl,
        marginBottom: Spacing.xxl,
        alignItems: 'center',
    },
    deleteText: {
        color: '#D32F2F',
        fontSize: Typography.size.s,
        fontWeight: '600',
    }
});
