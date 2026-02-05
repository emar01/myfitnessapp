import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { db } from '@/lib/firebaseConfig';
import { Exercise } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ExerciseEditorScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { user } = useSession();

    const [isLoading, setIsLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!id);

    // Form State
    const [formName, setFormName] = useState('');
    const [formMuscle, setFormMuscle] = useState('');
    const [formType, setFormType] = useState('strength');
    const [formIsBodyweight, setFormIsBodyweight] = useState(false);
    const [formVideoLink, setFormVideoLink] = useState('');
    const [exerciseId, setExerciseId] = useState<string | null>(null);

    useEffect(() => {
        if (id && typeof id === 'string') {
            fetchExercise(id);
        } else {
            setInitialLoading(false);
        }
    }, [id]);

    const fetchExercise = async (eId: string) => {
        try {
            const docRef = doc(db, 'exercises', eId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data() as Exercise;
                setExerciseId(snap.id);
                setFormName(data.name);
                setFormMuscle(data.primaryMuscleGroup);
                setFormType(data.type);
                setFormIsBodyweight(data.isBodyweight);
                setFormVideoLink(data.videoLink || '');
            } else {
                Alert.alert('Error', 'Exercise not found');
                router.back();
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load exercise');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formName || !formMuscle) {
            Alert.alert('Validation', 'Name and Muscle Group are required.');
            return;
        }
        if (!user) return;

        setIsLoading(true);
        try {
            const data: Partial<Exercise> = {
                name: formName,
                primaryMuscleGroup: formMuscle,
                type: formType,
                isBodyweight: formIsBodyweight,
                videoLink: formVideoLink || undefined,
                ...(exerciseId ? {} : {
                    isPublic: false,
                    createdBy: user.uid
                })
            };

            if (exerciseId) {
                const ref = doc(db, 'exercises', exerciseId);
                await updateDoc(ref, data);
            } else {
                await addDoc(collection(db, 'exercises'), data);
            }

            router.back();
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e.message);
        } finally {
            setIsLoading(false);
        }
    };


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
                    <Text style={styles.headerTitle}>{exerciseId ? 'Edit Exercise' : 'New Exercise'}</Text>
                    <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color={Palette.primary.main} /> : <Text style={styles.saveText}>Save</Text>}
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

                    <Text style={styles.label}>Video Link (YouTube) - Optional</Text>
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
    switchRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16,
        backgroundColor: '#FFF', padding: 12, borderRadius: BorderRadius.s,
    },
});
