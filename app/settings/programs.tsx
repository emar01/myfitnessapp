import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { db } from '@/lib/firebaseConfig';
import { Program, WorkoutTemplate } from '@/types';
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
    View
} from 'react-native';

export default function AdminProgramsScreen() {
    const router = useRouter();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);

    // Form State
    const [formTitle, setFormTitle] = useState('');
    const [formDuration, setFormDuration] = useState('');
    const [formType, setFormType] = useState<'daily' | 'period'>('period');
    const [formCategory, setFormCategory] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formWorkoutIds, setFormWorkoutIds] = useState<string[]>([]);

    // Template Selector State
    const [templateSelectorVisible, setTemplateSelectorVisible] = useState(false);
    const [allTemplates, setAllTemplates] = useState<WorkoutTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "programs"));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
            list.sort((a, b) => a.title.localeCompare(b.title));
            setPrograms(list);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to fetch programs');
        } finally {
            setIsLoading(false);
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

    const handleEdit = (prog: Program) => {
        setEditingProgram(prog);
        setFormTitle(prog.title);
        setFormDuration(prog.duration);
        setFormType(prog.type as 'daily' | 'period');
        setFormCategory(prog.category);
        setFormDescription(prog.description || '');
        setFormWorkoutIds(prog.workoutIds || []);
        setModalVisible(true);
    };

    const handleCreate = () => {
        setEditingProgram(null);
        setFormTitle('');
        setFormDuration('');
        setFormType('period');
        setFormCategory('Styrketräning');
        setFormDescription('');
        setFormWorkoutIds([]);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formTitle || !formDuration) {
            Alert.alert('Validation', 'Title and Duration are required.');
            return;
        }

        setIsLoading(true);
        try {
            const data: Partial<Program> = {
                title: formTitle,
                duration: formDuration,
                type: formType,
                category: formCategory,
                description: formDescription,
                workoutIds: formWorkoutIds,
            };

            if (editingProgram && editingProgram.id) {
                const ref = doc(db, 'programs', editingProgram.id);
                await updateDoc(ref, data);
            } else {
                await addDoc(collection(db, 'programs'), data);
            }

            setModalVisible(false);
            fetchPrograms();
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e.message);
        } finally {
            setIsLoading(false);
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

    const getTemplateName = (id: string) => {
        const t = allTemplates.find(x => x.id === id);
        return t ? t.name : 'Unknown Template (Load to view)';
    };

    useEffect(() => {
        if (modalVisible) fetchTemplates();
    }, [modalVisible]);


    const renderItem = ({ item }: { item: Program }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleEdit(item)}>
            <View style={styles.cardContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
                <Text style={styles.cardSubtitle}>{item.category} • {item.duration} • {item.workoutIds?.length || 0} workouts</Text>
            </View>
            <Ionicons name="pencil" size={20} color={Palette.text.secondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                    <Ionicons name="arrow-back" size={24} color={Palette.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Programs</Text>
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
                    data={programs}
                    keyExtractor={(item) => item.id || item.title}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No programs found.</Text>}
                />
            )}

            {/* Edit/Create Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalAction}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>{editingProgram ? 'Edit Program' : 'New Program'}</Text>
                            <TouchableOpacity onPress={handleSave}>
                                <Text style={[styles.modalAction, { fontWeight: 'bold' }]}>Save</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            <Text style={styles.label}>Program Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 5x5 Stronglifts"
                                value={formTitle}
                                onChangeText={setFormTitle}
                            />

                            <Text style={styles.label}>Category</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Styrketräning, Löpning"
                                value={formCategory}
                                onChangeText={setFormCategory}
                            />

                            <Text style={styles.label}>Duration</Text>
                            <View style={styles.categoryRow}>
                                {['4 veckor', '6 veckor', '8 veckor', 'Tillsvidare'].map((dur) => (
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
                                {['period', 'daily'].map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[
                                            styles.categoryChip,
                                            formType === t && styles.categoryChipActive
                                        ]}
                                        onPress={() => setFormType(t as any)}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            formType === t && styles.categoryChipTextActive
                                        ]}>
                                            {t === 'daily' ? 'Daily Challenge' : 'Periodization'}
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
                        </ScrollView>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </Modal>

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
                                        No workout templates found. Go to "Workouts" in settings to create reusable templates first.
                                    </Text>
                                </View>
                            }
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
    cardContent: { flex: 1 },
    cardTitle: { fontSize: Typography.size.m, fontWeight: '600', color: Palette.text.primary, marginRight: 8 },
    cardSubtitle: { fontSize: Typography.size.s, color: Palette.text.secondary, marginTop: 4 },
    emptyText: { textAlign: 'center', color: Palette.text.secondary, marginTop: 40 },

    // Modal Styles
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

    // Selector
    selectorItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE', backgroundColor: '#FFF'
    },
    selectorText: { fontSize: Typography.size.m },
});
