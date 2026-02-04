import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { db } from '@/lib/firebaseConfig';
import { RunningSubcategory, WorkoutTemplate } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SUBCATEGORIES: RunningSubcategory[] = ['distans', 'långpass', 'intervall', 'fartpass', 'testlopp'];

export default function EditTemplateScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [name, setName] = useState('');
    const [note, setNote] = useState('');
    const [subcategory, setSubcategory] = useState<RunningSubcategory>('distans');
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');

    useEffect(() => {
        fetchTemplate();
    }, [id]);

    const fetchTemplate = async () => {
        if (!id) return;
        try {
            const docRef = doc(db, 'workout_templates', id as string);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data() as WorkoutTemplate;
                setTemplate(data);
                setName(data.name);
                setNote(data.note || (data as any).description || ''); // Handle potential legacy field
                setSubcategory((data.subcategory as RunningSubcategory) || 'distans');
                setDistance(data.distance ? data.distance.toString() : '');
                setDuration(data.duration ? data.duration.toString() : '');
            } else {
                Alert.alert("Error", "Template not found");
                router.back();
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not load template");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!id) return;
        setSaving(true);
        try {
            // Check for duplicate name
            if (name !== template?.name) {
                const q = query(collection(db, 'workout_templates'), where('name', '==', name));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    Alert.alert("Stopp", "Det finns redan en mall med detta namn. Välj ett annat.");
                    setSaving(false);
                    return;
                }
            }

            const docRef = doc(db, 'workout_templates', id as string);

            const updateData: any = {
                name,
                note,
                subcategory
            };
            if (distance) updateData.distance = parseFloat(distance.replace(',', '.'));
            if (duration) updateData.duration = parseInt(duration, 10);

            await updateDoc(docRef, updateData);
            Alert.alert("Sparat", "Mallen har uppdaterats.");
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Fel", "Kunde inte spara ändringarna.");
        } finally {
            setSaving(false);
        }
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Palette.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Redigera Mall</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

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
                    <Text style={styles.label}>Kategori (Typ)</Text>
                    <View style={styles.chipsContainer}>
                        {SUBCATEGORIES.map(sub => (
                            <TouchableOpacity
                                key={sub}
                                style={[styles.chip, subcategory === sub && styles.chipActive]}
                                onPress={() => setSubcategory(sub)}
                            >
                                <Text style={[styles.chipText, subcategory === sub && styles.chipTextActive]}>
                                    {sub.charAt(0).toUpperCase() + sub.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

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

                <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving || deleting}
                >
                    {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Spara Ändringar</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.deleteButton, deleting && { opacity: 0.7 }]}
                    onPress={handleDelete}
                    disabled={saving || deleting}
                >
                    {deleting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.deleteButtonText}>Ta bort mall</Text>}
                </TouchableOpacity>

            </ScrollView>
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
});
