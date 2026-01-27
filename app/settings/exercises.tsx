import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { db } from '@/lib/firebaseConfig';
import { Exercise } from '@/types';
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
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function AdminExercisesScreen() {
    const router = useRouter();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

    // Form State
    const [formName, setFormName] = useState('');
    const [formMuscle, setFormMuscle] = useState('');
    const [formType, setFormType] = useState('strength');
    const [formIsBodyweight, setFormIsBodyweight] = useState(false);
    const [formVideoLink, setFormVideoLink] = useState('');

    useEffect(() => {
        fetchExercises();
    }, []);

    const fetchExercises = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "exercises"));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
            // Sort by name
            list.sort((a, b) => a.name.localeCompare(b.name));
            setExercises(list);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to fetch exercises');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (ex: Exercise) => {
        setEditingExercise(ex);
        setFormName(ex.name);
        setFormMuscle(ex.primaryMuscleGroup);
        setFormType(ex.type);
        setFormIsBodyweight(ex.isBodyweight);
        setFormVideoLink(ex.videoLink || '');
        setModalVisible(true);
    };

    const handleCreate = () => {
        setEditingExercise(null);
        setFormName('');
        setFormMuscle('');
        setFormType('strength');
        setFormIsBodyweight(false);
        setFormVideoLink('');
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formName || !formMuscle) {
            Alert.alert('Validation', 'Name and Muscle Group are required.');
            return;
        }

        setIsLoading(true);
        try {
            const data: Partial<Exercise> = {
                name: formName,
                primaryMuscleGroup: formMuscle,
                type: formType,
                isBodyweight: formIsBodyweight,
                videoLink: formVideoLink || undefined, // Store undefined if empty string
            };

            if (editingExercise && editingExercise.id) {
                // Update
                const ref = doc(db, 'exercises', editingExercise.id);
                await updateDoc(ref, data);
            } else {
                // Create
                await addDoc(collection(db, 'exercises'), data);
            }

            setModalVisible(false);
            fetchExercises(); // Refresh list
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Exercise }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleEdit(item)}>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.primaryMuscleGroup} • {item.type}</Text>
                {item.videoLink && <Text style={styles.videoBadge}>📹 Video</Text>}
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
                <Text style={styles.headerTitle}>Manage Exercises</Text>
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
                    data={exercises}
                    keyExtractor={(item) => item.id || item.name}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No exercises found.</Text>}
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
                            <Text style={styles.modalTitle}>{editingExercise ? 'Edit Exercise' : 'New Exercise'}</Text>
                            <TouchableOpacity onPress={handleSave}>
                                <Text style={[styles.modalAction, { fontWeight: 'bold' }]}>Save</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            <Text style={styles.label}>Exercise Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Bench Press"
                                value={formName}
                                onChangeText={setFormName}
                            />

                            <Text style={styles.label}>Primary Muscle Group</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Chest, Back, Legs"
                                value={formMuscle}
                                onChangeText={setFormMuscle}
                            />

                            <Text style={styles.label}>Video Link (YouTube)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="https://youtube.com/..."
                                value={formVideoLink}
                                onChangeText={setFormVideoLink}
                                autoCapitalize="none"
                            />

                            <View style={styles.switchRow}>
                                <Text style={styles.label}>Bodyweight Only?</Text>
                                <Switch
                                    value={formIsBodyweight}
                                    onValueChange={setFormIsBodyweight}
                                    trackColor={{ false: '#EEE', true: Palette.primary.light }}
                                    thumbColor={formIsBodyweight ? Palette.primary.main : '#f4f3f4'}
                                />
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.m,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: Spacing.m,
    },
    card: {
        backgroundColor: '#FFF',
        padding: Spacing.m,
        borderRadius: BorderRadius.m,
        marginBottom: Spacing.s,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...Shadows.small,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: Typography.size.m,
        fontWeight: '600',
        color: Palette.text.primary,
    },
    cardSubtitle: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        marginTop: 4,
    },
    videoBadge: {
        fontSize: 10,
        color: Palette.primary.main,
        marginTop: 4,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: Palette.text.secondary,
        marginTop: 40,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.m,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    modalTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
    },
    modalAction: {
        fontSize: Typography.size.m,
        color: Palette.primary.main,
    },
    formContainer: {
        padding: Spacing.m,
    },
    label: {
        fontSize: Typography.size.s,
        fontWeight: '600',
        color: Palette.text.secondary,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: BorderRadius.s,
        fontSize: Typography.size.m,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: BorderRadius.s,
    },
});
