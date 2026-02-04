import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { db } from '@/lib/firebaseConfig';
import { Workout } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateCustomWorkoutScreen() {
    const router = useRouter();
    const { user } = useSession();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async (status: 'Planned' | 'Completed') => {
        if (!user) return;
        if (!title) {
            alert('Vänligen ange en titel.');
            return;
        }

        setSaving(true);
        try {
            const workoutData: Partial<Workout> = {
                userId: user.uid,
                name: title,
                notes: description,
                category: 'löpning', // Defaulting to running as per request context
                subcategory: 'distans',
                status: status,
                date: new Date(),
                scheduledDate: new Date(),
                // If providing distance/time upfront for a PLANNED workout, we might store them in 'notes' or specific fields if extending schema. 
                // The user schema has 'distance' and 'duration' validation on completion usually. 
                // But we can save them as "target" or just save them as actuals if status is Completed.
                // For 'Planned', we might just put them in notes or custom fields. 
                // Let's put them in the root if the schema supports it (we added it earlier).
                distance: distance ? parseFloat(distance.replace(',', '.')) : undefined,
                duration: duration ? parseInt(duration, 10) * 60 : undefined, // minutes -> seconds
                exercises: [] // No specific exercises logic for simple custom run yet
            };

            await addDoc(collection(db, 'users', user.uid, 'workouts'), workoutData);

            // alert('Pass sparat!');
            router.dismissAll();
            router.push('/(tabs)');
        } catch (e) {
            console.error(e);
            alert('Kunde inte spara passet.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Palette.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Skapa Eget Pass</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Titel</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="T.ex. Morgonjogg"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Beskrivning</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="Kort beskrivning av passet..."
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={{ flexDirection: 'row', gap: Spacing.m }}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Sträcka (km)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.0"
                            keyboardType="numeric"
                            value={distance}
                            onChangeText={setDistance}
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Tid (min)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            keyboardType="numeric"
                            value={duration}
                            onChangeText={setDuration}
                        />
                    </View>
                </View>

                <View style={{ marginTop: Spacing.xl }}>
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={() => handleSave('Planned')}
                        disabled={saving}
                    >
                        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Spara som Planerat</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={() => handleSave('Completed')}
                        disabled={saving}
                    >
                        <Text style={[styles.buttonText, { color: Palette.text.primary }]}>Spara & Klarmarkera</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Palette.background.default,
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
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    content: {
        padding: Spacing.l,
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
    },
    button: {
        paddingVertical: Spacing.m,
        borderRadius: BorderRadius.round,
        alignItems: 'center',
        marginBottom: Spacing.m,
        ...Shadows.small,
    },
    primaryButton: {
        backgroundColor: Palette.primary.main,
    },
    secondaryButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    buttonText: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
