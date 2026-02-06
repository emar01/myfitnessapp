import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { PROGRAM_DURATIONS, PROGRAM_TYPES, WORKOUT_CATEGORIES } from '@/constants/WorkoutTypes'; // Import constants
import { useSession } from '@/context/ctx';
import { db } from '@/lib/firebaseConfig';
import { Program, WorkoutTemplate } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProgramEditorScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // If id exists, we edit.
    const { user } = useSession();

    const [isLoading, setIsLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!id);

    // Form State
    const [formTitle, setFormTitle] = useState('');
    const [formDuration, setFormDuration] = useState<string>(PROGRAM_DURATIONS[0]);
    const [formType, setFormType] = useState<string>(PROGRAM_TYPES[0].value);
    const [formCategory, setFormCategory] = useState<string>(WORKOUT_CATEGORIES[0].value);
    const [formDescription, setFormDescription] = useState('');
    const [formWorkoutIds, setFormWorkoutIds] = useState<string[]>([]);
    const [programId, setProgramId] = useState<string | null>(null);

    // Template Selector State
    const [templateSelectorVisible, setTemplateSelectorVisible] = useState(false);
    const [allTemplates, setAllTemplates] = useState<WorkoutTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    useEffect(() => {
        if (id && typeof id === 'string') {
            fetchProgram(id);
        } else {
            setInitialLoading(false);
        }
    }, [id]);

    const fetchProgram = async (pId: string) => {
        try {
            const docRef = doc(db, 'programs', pId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data() as Program;
                setProgramId(snap.id);
                setFormTitle(data.title);
                setFormDuration(data.duration);
                setFormType(data.type);
                setFormCategory(data.category?.toLowerCase() || WORKOUT_CATEGORIES[0].value);
                setFormDescription(data.description || '');
                setFormWorkoutIds(data.workoutIds || []);
            } else {
                Alert.alert('Error', 'Program not found');
                router.back();
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load program');
        } finally {
            setInitialLoading(false);
        }
    };

    const fetchTemplates = async () => {
        if (allTemplates.length > 0) return;
        setLoadingTemplates(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'workout_templates'));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutTemplate));
            list.sort((a, b) => a.name.localeCompare(b.name));
            setAllTemplates(list);
        } catch (e) {
            Alert.alert('Error', 'Failed to load templates');
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleSave = async () => {
        if (!formTitle || !formDuration) {
            Alert.alert('Validation', 'Title and Duration are required.');
            return;
        }
        if (!user) {
            Alert.alert("Fel", "Du måste vara inloggad för att spara program.");
            return;
        }

        setIsLoading(true);
        try {
            // If new, mark as createdBy user
            // If edit, check ownership? For now, assume allowed if accessed.
            const data: Partial<Program> = {
                title: formTitle,
                duration: formDuration,
                type: formType as 'daily' | 'period',
                category: formCategory,
                description: formDescription,
                workoutIds: formWorkoutIds,
                // If creating new, set privacy fields
                ...(programId ? {} : {
                    isPublic: false, // Default to private for now
                    createdBy: user.uid
                })
            };

            if (programId) {
                const ref = doc(db, 'programs', programId);
                await updateDoc(ref, data);
            } else {
                await addDoc(collection(db, 'programs'), data);
            }

            router.back();
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Är du säker på att du vill ta bort detta program? Detta går inte att ångra.")) {
                await performDelete();
            }
        } else {
            Alert.alert(
                "Ta bort program",
                "Är du säker på att du vill ta bort detta program? Detta går inte att ångra.",
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
        if (!programId) return;
        setDeleting(true);
        try {
            await deleteDoc(doc(db, 'programs', programId));
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Fel", "Kunde inte ta bort programmet.");
            setDeleting(false);
        }
    };



    const openTemplateSelector = () => {
        fetchTemplates();
        setTemplateSelectorVisible(true);
    };

    const addTemplate = (tmpl: WorkoutTemplate) => {
        if (tmpl.id) {
            setFormWorkoutIds([...formWorkoutIds, tmpl.id]);
            setTemplateSelectorVisible(false);
        }
    };

    const removeTemplate = (index: number) => {
        const updated = [...formWorkoutIds];
        updated.splice(index, 1);
        setFormWorkoutIds(updated);
    };

    const getTemplateName = (tId: string) => {
        // Optimistic lookup if templates loaded, otherwise generic
        // Ideally we should pre-fetch referenced templates if not in list, 
        // but since we usually open selector, we might load them.
        // For now, if allTemplates empty, we might show ID or "Loading...".
        // A better approach is to fetch referenced templates on mount. 
        // But let's rely on valid user flow: Usually edits happen after viewing details? 
        // Or we just fetch all templates for simplicity as there aren't thousands yet.
        const t = allTemplates.find(x => x.id === tId);
        return t ? t.name : '(Loading or Unknown Workout)';
    };

    // Trigger loading templates if we have existing workouts, so we can display names
    useEffect(() => {
        if (formWorkoutIds.length > 0 && allTemplates.length === 0) {
            fetchTemplates();
        }
    }, [formWorkoutIds]);


    if (initialLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Palette.primary.main} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                        <Ionicons name="arrow-back" size={24} color={Palette.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{programId ? 'Edit Program' : 'New Program'}</Text>
                    <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color={Palette.primary.main} /> : <Text style={styles.saveText}>Save</Text>}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 100 }}>
                    <Text style={styles.label}>Program Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 5x5 Stronglifts"
                        value={formTitle}
                        onChangeText={setFormTitle}
                    />

                    <Text style={styles.label}>Category</Text>
                    <View style={styles.categoryRow}>
                        {WORKOUT_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.value}
                                style={[
                                    styles.categoryChip,
                                    formCategory === cat.value && styles.categoryChipActive
                                ]}
                                onPress={() => setFormCategory(cat.value)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    formCategory === cat.value && styles.categoryChipTextActive
                                ]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Duration</Text>
                    <View style={styles.categoryRow}>
                        {PROGRAM_DURATIONS.map((dur) => (
                            <TouchableOpacity
                                key={dur}
                                style={[
                                    styles.categoryChip,
                                    formDuration === dur && styles.categoryChipActive
                                ]}
                                onPress={() => setFormDuration(dur)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    formDuration === dur && styles.categoryChipTextActive
                                ]}>
                                    {dur}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                        placeholder="Describe the program..."
                        value={formDescription}
                        onChangeText={setFormDescription}
                        multiline
                    />

                    <Text style={styles.label}>Program Structure (Type)</Text>
                    <View style={styles.categoryRow}>
                        {PROGRAM_TYPES.map((t) => (
                            <TouchableOpacity
                                key={t.value}
                                style={[
                                    styles.categoryChip,
                                    formType === t.value && styles.categoryChipActive
                                ]}
                                onPress={() => setFormType(t.value as any)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    formType === t.value && styles.categoryChipTextActive
                                ]}>
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Workouts Relationship */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.label}>Schedule / Workouts</Text>
                        <TouchableOpacity onPress={openTemplateSelector}>
                            <Text style={styles.addAction}>+ Add Workout</Text>
                        </TouchableOpacity>
                    </View>

                    {formWorkoutIds.map((id, idx) => (
                        <View key={idx} style={styles.workoutRow}>
                            <Text style={styles.workoutName}>{idx + 1}. {getTemplateName(id)}</Text>
                            <TouchableOpacity onPress={() => removeTemplate(idx)}>
                                <Ionicons name="trash-outline" size={20} color={Palette.status.error} />
                            </TouchableOpacity>
                        </View>
                    ))}
                    {formWorkoutIds.length === 0 && (
                        <Text style={styles.emptyText}>No workouts added yet.</Text>
                    )}

                    {programId && (
                        <TouchableOpacity
                            style={[styles.deleteButton, deleting && { opacity: 0.7 }]}
                            onPress={handleDelete}
                            disabled={isLoading || deleting}
                        >
                            {deleting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.deleteButtonText}>Ta bort program</Text>}
                        </TouchableOpacity>
                    )}
                </ScrollView>

                {/* Template Selector Modal */}
                <Modal visible={templateSelectorVisible} animationType="slide">
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setTemplateSelectorVisible(false)}>
                                <Text style={styles.modalAction}>Close</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Select Workout</Text>
                            <View style={{ width: 40 }} />
                        </View>
                        {loadingTemplates ? (
                            <ActivityIndicator style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={allTemplates}
                                keyExtractor={(item) => item.id!}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.selectorItem} onPress={() => addTemplate(item)}>
                                        <Text style={styles.selectorText}>{item.name}</Text>
                                        <Ionicons name="add-circle-outline" size={24} color={Palette.primary.main} />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ textAlign: 'center', color: Palette.text.secondary }}>
                                            No workout templates found.
                                        </Text>
                                    </View>
                                }
                            />
                        )}
                    </SafeAreaView>
                </Modal>

            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: Spacing.m, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE'
    },
    headerTitle: { fontSize: Typography.size.l, fontWeight: 'bold', color: Palette.text.primary },
    saveText: { fontSize: Typography.size.m, fontWeight: 'bold', color: Palette.primary.main },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    formContainer: { padding: Spacing.m },
    label: { fontSize: Typography.size.s, fontWeight: '600', color: Palette.text.secondary, marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#FFF', padding: 12, borderRadius: BorderRadius.s, fontSize: Typography.size.m, borderWidth: 1, borderColor: '#E0E0E0' },

    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    categoryChipActive: {
        backgroundColor: Palette.primary.main,
        borderColor: Palette.primary.main,
    },
    categoryChipText: {
        fontSize: Typography.size.s,
        color: Palette.text.primary,
    },
    categoryChipTextActive: {
        color: '#FFF',
        fontWeight: 'bold',
    },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 },
    addAction: { color: Palette.primary.main, fontWeight: 'bold' },
    workoutRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8, ...Shadows.small
    },
    workoutName: { fontSize: Typography.size.m, color: Palette.text.primary },
    emptyText: { color: Palette.text.disabled, fontStyle: 'italic', marginTop: 8 },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#F5F5F7' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: Spacing.m, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE'
    },
    modalTitle: { fontSize: Typography.size.l, fontWeight: 'bold' },
    modalAction: { fontSize: Typography.size.m, color: Palette.primary.main },
    selectorItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE', backgroundColor: '#FFF'
    },
    selectorText: { fontSize: Typography.size.m },
    deleteButton: {
        backgroundColor: '#FF5252',
        padding: Spacing.m,
        borderRadius: BorderRadius.round,
        alignItems: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    deleteButtonText: {
        color: '#FFF',
        fontSize: Typography.size.m,
        fontWeight: 'bold',
    },
});
