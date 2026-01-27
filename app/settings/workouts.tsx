import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { db } from '@/lib/firebaseConfig';
import { Exercise, RunningSubcategory, StrengthSubcategory, WorkoutCategory, WorkoutExercise, WorkoutTemplate } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, doc, getDocs, updateDoc } from 'firebase/firestore';
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

export default function AdminWorkoutsScreen() {
    const router = useRouter();
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State - Template Editor
    const [modalVisible, setModalVisible] = useState(false);
    const [editionId, setEditionId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formCategory, setFormCategory] = useState<WorkoutCategory>('styrketräning');
    const [formSubcategory, setFormSubcategory] = useState<RunningSubcategory | StrengthSubcategory | undefined>(undefined);
    const [formExercises, setFormExercises] = useState<WorkoutExercise[]>([]);

    // Sub-Modal State - Exercise Selector
    const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [loadingExercises, setLoadingExercises] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'workout_templates'));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutTemplate));
            list.sort((a, b) => a.name.localeCompare(b.name));
            setTemplates(list);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to fetch templates');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExercises = async () => {
        if (allExercises.length > 0) return; // Cache
        setLoadingExercises(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'exercises'));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
            list.sort((a, b) => a.name.localeCompare(b.name));
            setAllExercises(list);
        } catch (e) {
            Alert.alert('Error', 'Failed to load exercises');
        } finally {
            setLoadingExercises(false);
        }
    };

    const handleCreate = () => {
        setEditionId(null);
        setFormName('');
        setFormCategory('styrketräning');
        setFormSubcategory(undefined);
        setFormExercises([]);
        setModalVisible(true);
    };

    const handleEdit = (tmpl: WorkoutTemplate) => {
        setEditionId(tmpl.id || null);
        setFormName(tmpl.name);
        setFormCategory(tmpl.category || 'styrketräning');
        setFormSubcategory(tmpl.subcategory);
        setFormExercises(tmpl.exercises);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formName) {
            Alert.alert('Validation', 'Template Name is required.');
            return;
        }

        setIsLoading(true);
        try {
            const data: Partial<WorkoutTemplate> = {
                name: formName,
                category: formCategory,
                subcategory: formSubcategory,
                exercises: formExercises
            };

            if (editionId) {
                const ref = doc(db, 'workout_templates', editionId);
                await updateDoc(ref, data);
            } else {
                await addDoc(collection(db, 'workout_templates'), data);
            }

            setModalVisible(false);
            fetchTemplates();
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const openExerciseSelector = () => {
        fetchExercises();
        setExerciseSelectorVisible(true);
    };

    const addExercise = (ex: Exercise) => {
        const newEx: WorkoutExercise = {
            exerciseId: ex.id!,
            name: ex.name,
            sets: [], // Empty sets for template = just exercise listing
            isBodyweight: ex.isBodyweight,
            videoLink: ex.defaultVideoUrl
        };
        setFormExercises([...formExercises, newEx]);
        setExerciseSelectorVisible(false);
    };

    const removeExercise = (index: number) => {
        const updated = [...formExercises];
        updated.splice(index, 1);
        setFormExercises(updated);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                    <Ionicons name="arrow-back" size={24} color={Palette.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Workouts</Text>
                <TouchableOpacity onPress={handleCreate}>
                    <Ionicons name="add" size={28} color={Palette.primary.main} />
                </TouchableOpacity>
            </View>

            {isLoading && !modalVisible ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Palette.primary.main} />
                </View>
            ) : (
                <FlatList
                    data={templates}
                    keyExtractor={(item) => item.id || item.name}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.card} onPress={() => handleEdit(item)}>
                            <View>
                                <Text style={styles.cardTitle}>{item.name}</Text>
                                <Text style={styles.cardSubtitle}>
                                    {item.category ? item.category.toUpperCase() : 'UNK'} • {item.exercises?.length || 0} exercises
                                </Text>
                            </View>
                            <Ionicons name="pencil" size={20} color={Palette.text.secondary} />
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No templates found. Create one!</Text>}
                />
            )}

            {/* Template Editor Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalAction}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>{editionId ? 'Edit Template' : 'New Template'}</Text>
                            <TouchableOpacity onPress={handleSave}>
                                <Text style={[styles.modalAction, { fontWeight: 'bold' }]}>Save</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            <Text style={styles.label}>Template Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Leg Day A"
                                value={formName}
                                onChangeText={setFormName}
                            />

                            <Text style={styles.label}>Category</Text>
                            <View style={styles.categoryRow}>
                                {['styrketräning', 'löpning', 'rehab'].map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryChip,
                                            formCategory === cat && styles.categoryChipActive
                                        ]}
                                        onPress={() => {
                                            setFormCategory(cat as any);
                                            setFormSubcategory(undefined); // Reset subcategory on change
                                        }}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            formCategory === cat && styles.categoryChipTextActive
                                        ]}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Subcategory Selector */}
                            {formCategory === 'löpning' && (
                                <View>
                                    <Text style={styles.label}>Running Type</Text>
                                    <View style={styles.categoryRow}>
                                        {['distans', 'långpass', 'intervall'].map((sub) => (
                                            <TouchableOpacity
                                                key={sub}
                                                style={[styles.categoryChip, formSubcategory === sub && styles.categoryChipActive]}
                                                onPress={() => setFormSubcategory(sub as any)}
                                            >
                                                <Text style={[styles.categoryChipText, formSubcategory === sub && styles.categoryChipTextActive]}>
                                                    {sub.charAt(0).toUpperCase() + sub.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {formCategory === 'styrketräning' && (
                                <View>
                                    <Text style={styles.label}>Strength Type</Text>
                                    <View style={styles.categoryRow}>
                                        {['crossfit', 'styrka', 'rörlighet'].map((sub) => (
                                            <TouchableOpacity
                                                key={sub}
                                                style={[styles.categoryChip, formSubcategory === sub && styles.categoryChipActive]}
                                                onPress={() => setFormSubcategory(sub as any)}
                                            >
                                                <Text style={[styles.categoryChipText, formSubcategory === sub && styles.categoryChipTextActive]}>
                                                    {sub.charAt(0).toUpperCase() + sub.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <View style={styles.sectionHeader}>
                                <Text style={styles.label}>Exercises</Text>
                                <TouchableOpacity onPress={openExerciseSelector}>
                                    <Text style={styles.addAction}>+ Add Exercise</Text>
                                </TouchableOpacity>
                            </View>

                            {formExercises.map((ex, idx) => (
                                <View key={idx} style={styles.exerciseRow}>
                                    <Text style={styles.exerciseName}>{idx + 1}. {ex.name}</Text>
                                    <TouchableOpacity onPress={() => removeExercise(idx)}>
                                        <Ionicons name="trash-outline" size={20} color={Palette.status.error} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {formExercises.length === 0 && (
                                <Text style={styles.emptyText}>No exercises added.</Text>
                            )}
                        </ScrollView>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </Modal>

            {/* Exercise Selector Modal */}
            <Modal visible={exerciseSelectorVisible} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setExerciseSelectorVisible(false)}>
                            <Text style={styles.modalAction}>Close</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select Exercise</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    {loadingExercises ? (
                        <ActivityIndicator style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={allExercises}
                            keyExtractor={(item) => item.id!}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.selectorItem} onPress={() => addExercise(item)}>
                                    <Text style={styles.selectorText}>{item.name}</Text>
                                    <Ionicons name="add-circle-outline" size={24} color={Palette.primary.main} />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: Spacing.m, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE'
    },
    headerTitle: { fontSize: Typography.size.l, fontWeight: 'bold', color: Palette.text.primary },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { padding: Spacing.m },
    card: {
        backgroundColor: '#FFF', padding: Spacing.m, borderRadius: BorderRadius.m, marginBottom: Spacing.s,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...Shadows.small
    },
    cardTitle: { fontSize: Typography.size.m, fontWeight: '600', color: Palette.text.primary },
    cardSubtitle: { fontSize: Typography.size.s, color: Palette.text.secondary },
    emptyText: { textAlign: 'center', color: Palette.text.secondary, marginTop: 20 },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#F5F5F7' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: Spacing.m, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE'
    },
    modalTitle: { fontSize: Typography.size.l, fontWeight: 'bold' },
    modalAction: { fontSize: Typography.size.m, color: Palette.primary.main },
    formContainer: { padding: Spacing.m },
    label: { fontSize: Typography.size.s, fontWeight: '600', color: Palette.text.secondary, marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#FFF', padding: 12, borderRadius: BorderRadius.s, fontSize: Typography.size.m, borderWidth: 1, borderColor: '#E0E0E0' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 },
    addAction: { color: Palette.primary.main, fontWeight: 'bold' },
    exerciseRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8, ...Shadows.small
    },
    exerciseName: { fontSize: Typography.size.m, color: Palette.text.primary },

    // Selector
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
    selectorItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE', backgroundColor: '#FFF'
    },
    selectorText: { fontSize: Typography.size.m },
});
