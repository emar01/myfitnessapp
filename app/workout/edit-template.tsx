import { BorderRadius, Layout, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx'; // 1. Import useSession
import { db } from '@/lib/firebaseConfig';
import { RunningSubcategory, WorkoutTemplate } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import ExerciseCard from '@/components/ExerciseCard';
import { Shadows } from '@/constants/DesignSystem';
import { RUNNING_SUBCATEGORIES, WORKOUT_CATEGORIES } from '@/constants/WorkoutTypes'; // Import constants
import { Exercise, WorkoutExercise } from '@/types';
import { FlatList, Modal } from 'react-native';

// Removed local SUBCATEGORIES and CATEGORIES arrays

export default function EditTemplateScreen() {
    const router = useRouter();
    const { user } = useSession(); // 2. Get User
    const { id } = useLocalSearchParams();

    const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [name, setName] = useState('');
    const [note, setNote] = useState('');
    const [subcategory, setSubcategory] = useState<RunningSubcategory>('distans');
    const [category, setCategory] = useState('styrketräning');
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');




    // Exercise State
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalTab, setModalTab] = useState<'MostUsed' | 'All'>('All');
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);

    const isEditing = !!id;

    useEffect(() => {
        fetchTemplate();
    }, [id]);

    const showAlert = (title: string, message: string, onOk?: () => void) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
            if (onOk) onOk();
        } else {
            Alert.alert(title, message, onOk ? [{ text: "OK", onPress: onOk }] : undefined);
        }
    };

    const fetchExercises = async () => {
        setIsLoadingExercises(true);
        try {
            const querySnapshot = await getDocs(collection(db, "exercises"));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
            setAvailableExercises(list);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingExercises(false);
        }
    };

    const fetchTemplate = async () => {
        // Always fetch exercises
        fetchExercises();

        if (!id) {
            setLoading(false);
            return;
        }
        try {
            const docRef = doc(db, 'workout_templates', id as string);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data() as WorkoutTemplate;
                setTemplate(data);
                setName(data.name);
                setNote(data.note || (data as any).description || ''); // Handle potential legacy field
                setSubcategory((data.subcategory as RunningSubcategory) || 'distans');
                setCategory(data.category?.toLowerCase() || 'styrketräning');
                setDistance(data.distance ? data.distance.toString() : '');
                setDuration(data.duration ? data.duration.toString() : '');

                // Load exercises if they exist
                if (data.exercises) {
                    setExercises(data.exercises);
                }
            } else {
                showAlert("Error", "Template not found", () => router.back());
            }
        } catch (e) {
            console.error(e);
            showAlert("Error", "Could not load template");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // 3. Check User
        if (!user) {
            showAlert("Fel", "Du måste vara inloggad för att skapa mallar.");
            return;
        }

        if (!name.trim()) {
            showAlert("Fel", "Du måste ange ett namn på passet.");
            return;
        }

        setSaving(true);
        try {
            // Check for duplicate name
            if (!isEditing || name !== template?.name) {
                const q = query(collection(db, 'workout_templates'), where('name', '==', name));
                const snap = await getDocs(q);

                // Filter: Check if any of the found docs are visible to me (Public or Mine)
                // If the doc is private and NOT mine, it doesn't count as a conflict.
                const conflict = snap.docs.find(d => {
                    const dData = d.data();
                    const isMine = dData.createdBy === user?.uid;
                    const isPublic = dData.isPublic === true;
                    return isMine || isPublic;
                });

                if (conflict) {
                    showAlert("Stopp", "Det finns redan en mall med detta namn (ditt eller publikt). Välj ett annat.");
                    setSaving(false);
                    return;
                }
            }

            const sanitizedExercises = exercises.map(ex => {
                const cleanEx: any = { ...ex };
                // Firestore doesn't like undefined
                if (cleanEx.videoLink === undefined) delete cleanEx.videoLink;
                if (!cleanEx.sets) cleanEx.sets = [];
                // Sanitize sets too just in case
                cleanEx.sets = cleanEx.sets.map((s: any) => {
                    const cleanSet = { ...s };
                    Object.keys(cleanSet).forEach(key => {
                        if (cleanSet[key] === undefined) delete cleanSet[key];
                    });
                    return cleanSet;
                });
                return cleanEx;
            });

            const updateData: any = {
                name,
                note,
                subcategory: category === 'löpning' ? subcategory : null,
                category, // Now guaranteed lowercase
                exercises: sanitizedExercises, // Save sanitized exercises
            };
            if (distance) {
                const parsedDist = parseFloat(distance.replace(',', '.'));
                if (!isNaN(parsedDist)) updateData.distance = parsedDist;
            }
            if (duration) {
                const parsedDur = parseInt(duration, 10);
                if (!isNaN(parsedDur)) updateData.duration = parsedDur;
            }

            if (isEditing) {
                const docRef = doc(db, 'workout_templates', id as string);
                // Ensure we claim ownership if it's missing (fixing orphaned docs)
                const finalUpdateData = { ...updateData, createdBy: user.uid };
                await updateDoc(docRef, finalUpdateData);
                showAlert("Sparat", "Mallen har uppdaterats.", () => router.back());
            } else {
                // Create new
                // IMPORTANT: Add createdBy and isPublic defaults!
                const newData = {
                    ...updateData,
                    createdBy: user.uid,
                    isPublic: false, // Default to private
                };
                await addDoc(collection(db, 'workout_templates'), newData);
                showAlert("Sparat", "Ny mall har skapats.", () => router.back());
            }
        } catch (e: any) {
            console.error(e);
            const errMsg = "Kunde inte spara ändringarna: " + (e.message || 'Okänt fel');
            showAlert("Fel", errMsg);
            setSaving(false); // Reset saving state on error
        }
        // Do not reset saving in finally block if success, so user can't double-tap while alert is showing. 
        // Although router.back() will unmount, it's safer to leave it true on success.
    };

    const handleDelete = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Är du säker på att du vill ta bort denna mall? Detta går inte att ångra.")) {
                await performDelete();
            }
        } else {
            Alert.alert(
                "Ta bort mall",
                "Är du säker på att du vill ta bort denna mall? Detta går inte att ångra.",
                [
                    { text: "Avbryt", style: "cancel" },
                    {
                        text: "Ta bort",
                        style: "destructive",
                        onPress: performDelete
                    }
                ]
            );
        }
    };

    const performDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            await deleteDoc(doc(db, 'workout_templates', id as string));
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Fel", "Kunde inte ta bort mallen.");
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Palette.primary.main} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, Layout.contentContainer]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Palette.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Redigera Mall' : 'Skapa Mall'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.content, Layout.contentContainer]}>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Namn</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Passets namn"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Kategori</Text>
                    <View style={styles.chipsContainer}>
                        {WORKOUT_CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.value}
                                style={[styles.chip, category === cat.value && styles.chipActive]}
                                onPress={() => setCategory(cat.value)}
                            >
                                <Text style={[styles.chipText, category === cat.value && styles.chipTextActive]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {category === 'löpning' && (
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Underkategori (Typ)</Text>
                        <View style={styles.chipsContainer}>
                            {RUNNING_SUBCATEGORIES.map(sub => (
                                <TouchableOpacity
                                    key={sub.value}
                                    style={[styles.chip, subcategory === sub.value && styles.chipActive]}
                                    onPress={() => setSubcategory(sub.value)}
                                >
                                    <Text style={[styles.chipText, subcategory === sub.value && styles.chipTextActive]}>
                                        {sub.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Beskrivning / Anteckningar</Text>
                    <TextInput
                        style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Beskriv passet..."
                        multiline
                    />
                </View>

                {/* Exercises Section */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Övningar</Text>
                    {exercises.length === 0 ? (
                        <Text style={{ color: Palette.text.secondary, fontStyle: 'italic', marginBottom: Spacing.s }}>Inga övningar tillagda.</Text>
                    ) : (
                        exercises.map((ex, index) => (
                            <ExerciseCard
                                key={ex.exerciseId + index}
                                exercise={ex}
                                onUpdate={(updated) => {
                                    const newEx = [...exercises];
                                    newEx[index] = updated;
                                    setExercises(newEx);
                                }}
                                onRemove={() => {
                                    const newEx = exercises.filter((_, i) => i !== index);
                                    setExercises(newEx);
                                }}
                            />
                        ))
                    )}

                    <TouchableOpacity
                        style={styles.addExerciseButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add-circle" size={24} color={Palette.primary.main} />
                        <Text style={styles.addExerciseText}>Lägg till övning</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving || deleting}
                >
                    {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>{isEditing ? 'Spara Ändringar' : 'Skapa Mall'}</Text>}
                </TouchableOpacity>

                {isEditing && (
                    <TouchableOpacity
                        style={[styles.deleteButton, deleting && { opacity: 0.7 }]}
                        onPress={handleDelete}
                        disabled={saving || deleting}
                    >
                        {deleting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.deleteButtonText}>Ta bort mall</Text>}
                    </TouchableOpacity>
                )}

            </ScrollView>

            {/* Exercise Selection Modal */}
            <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.modalHeaderContainer}>
                        <View style={styles.modalTopRow}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                                <Ionicons name="arrow-back" size={24} color={Palette.text.primary} />
                            </TouchableOpacity>
                            <View style={styles.modalSearchContainer}>
                                <Ionicons name="search" size={20} color={Palette.text.secondary} style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.modalSearchInput}
                                    placeholder="Sök övning..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={24} color={Palette.text.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* List */}
                    {isLoadingExercises ? <ActivityIndicator size="large" style={{ marginTop: 20 }} /> : (
                        <FlatList
                            data={availableExercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                            keyExtractor={(item) => item.id || item.name}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.exerciseItem}
                                    onPress={() => {
                                        const newExercise: WorkoutExercise = {
                                            exerciseId: item.id!,
                                            name: item.name,
                                            sets: [],
                                            isBodyweight: item.isBodyweight,
                                            videoLink: item.defaultVideoUrl
                                        };
                                        setExercises([...exercises, newExercise]);
                                        setModalVisible(false);
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={styles.exerciseIconContainer}>
                                            <Ionicons name="body" size={16} color={Palette.accent.main} />
                                        </View>
                                        <Text style={styles.exerciseName}>{item.name}</Text>
                                    </View>
                                    <Ionicons name="add-circle-outline" size={24} color={Palette.primary.main} />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Palette.background.default,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        backgroundColor: Palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
    },
    backButton: { padding: 8 },
    headerTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    content: {
        padding: Spacing.m,
    },
    formGroup: {
        marginBottom: Spacing.l,
    },
    label: {
        fontSize: Typography.size.s,
        fontWeight: '600',
        color: Palette.text.secondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: Palette.border.default,
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        fontSize: Typography.size.m,
        color: Palette.text.primary,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#E0E0E0',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipActive: {
        backgroundColor: Palette.primary.main,
        borderColor: Palette.primary.main,
    },
    chipText: {
        fontSize: Typography.size.s,
        color: Palette.text.primary,
    },
    chipTextActive: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: Palette.primary.main,
        padding: Spacing.m,
        borderRadius: BorderRadius.round,
        alignItems: 'center',
        marginTop: Spacing.m,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: Typography.size.m,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#FF5252',
        padding: Spacing.m,
        borderRadius: BorderRadius.round,
        alignItems: 'center',
        marginTop: Spacing.s,
        marginBottom: Spacing.xl,
    },
    deleteButtonText: {
        color: '#FFF',
        fontSize: Typography.size.m,
        fontWeight: 'bold',
    },
    // Exercise UI Styles
    addExerciseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.m,
        borderWidth: 1,
        borderColor: Palette.primary.main,
        borderRadius: BorderRadius.m,
        borderStyle: 'dashed',
    },
    addExerciseText: {
        marginLeft: 8,
        color: Palette.primary.main,
        fontWeight: 'bold',
        fontSize: Typography.size.m,
    },
    // Modal Styles (simplified)
    modalContainer: { flex: 1, backgroundColor: '#F5F5F7' },
    modalHeaderContainer: { backgroundColor: '#FFF', paddingTop: 16, paddingBottom: 0, ...Shadows.small, zIndex: 10 },
    modalTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.m, marginBottom: Spacing.s },
    modalSearchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F7', borderRadius: 20, marginHorizontal: Spacing.s, paddingHorizontal: Spacing.m, height: 40 },
    modalSearchInput: { flex: 1, fontSize: Typography.size.s, color: Palette.text.primary, height: '100%' },
    exerciseItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: Spacing.m, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EEE' },
    exerciseIconContainer: { marginRight: 12 },
    exerciseName: { fontSize: Typography.size.m, fontWeight: '500', color: Palette.text.primary },
});
