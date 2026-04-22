import { useTheme } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { useAlert } from '@/context/AlertContext';
import { db } from '@/lib/firebaseConfig';
import { Workout } from '@/types';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateCustomWorkoutScreen() {
    const { palette, spacing, borderRadius, typography, shadows, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows, isDark);
    const router = useRouter();
    const { user } = useSession();
    const { showAlert } = useAlert();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [scheduledDate, setScheduledDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async (status: 'Planned' | 'Completed') => {
        if (!user) return;
        if (!title) {
            showAlert('Mata in titel', 'Vänligen ange en titel.');
            return;
        }

        setSaving(true);
        try {
            const workoutData: Partial<Workout> = {
                userId: user.uid,
                name: title,
                notes: description,
                category: 'löpning',
                subcategory: 'distans',
                status: status,
                date: new Date(),
                scheduledDate: status === 'Completed' ? new Date() : scheduledDate,
                distance: distance ? parseFloat(distance.replace(',', '.')) : undefined,
                duration: duration ? parseInt(duration, 10) * 60 : undefined,
                exercises: []
            };

            await addDoc(collection(db, 'users', user.uid, 'workouts'), workoutData);

            router.dismissAll();
            router.push('/(tabs)');
        } catch (e) {
            console.error(e);
            showAlert('Fel', 'Kunde inte spara passet.');
        } finally {
            setSaving(false);
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={palette.text.primary} />
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
                        placeholderTextColor={palette.text.disabled}
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Beskrivning</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="Kort beskrivning av passet..."
                        placeholderTextColor={palette.text.disabled}
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.m }}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Sträcka (km)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.0"
                            placeholderTextColor={palette.text.disabled}
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
                            placeholderTextColor={palette.text.disabled}
                            keyboardType="numeric"
                            value={duration}
                            onChangeText={setDuration}
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Planerat datum</Text>
                    {Platform.OS === 'web' ? (
                        <View style={[styles.input, { padding: 0 }]}>
                            {React.createElement('input', {
                                type: 'date',
                                value: formatDateStr(scheduledDate),
                                onChange: (e: any) => {
                                    if (!e.target.value) return;
                                    const parts = e.target.value.split('-');
                                    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                                    setScheduledDate(d);
                                },
                                style: { border: 'none', background: 'transparent', padding: spacing.m, fontSize: typography.size.m, color: palette.text.primary, fontFamily: 'inherit', outline: 'none', width: '100%' }
                            })}
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}>
                                <FontAwesome name="calendar" size={16} color={palette.primary.main} style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: typography.size.m, color: palette.text.primary }}>{scheduledDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={scheduledDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                    onChange={onChangeDate}
                                    style={{ width: '100%', marginTop: 8 }}
                                />
                            )}
                        </>
                    )}
                </View>

                <View style={{ marginTop: spacing.xl }}>
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
                        <Text style={[styles.buttonText, { color: palette.text.primary }]}>Spara & Klarmarkera</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background.default,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        backgroundColor: palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: palette.border.default,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: typography.size.l,
        fontWeight: 'bold',
        color: palette.text.primary,
    },
    content: {
        padding: spacing.l,
    },
    formGroup: {
        marginBottom: spacing.l,
    },
    label: {
        fontSize: typography.size.s,
        fontWeight: '600',
        color: palette.text.secondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: palette.background.input || (isDark ? '#2C2C2E' : '#F5F5F7'),
        color: palette.text.primary,
        borderWidth: 1,
        borderColor: palette.border.default,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        fontSize: typography.size.m,
    },
    button: {
        paddingVertical: spacing.m,
        borderRadius: borderRadius.round,
        alignItems: 'center',
        marginBottom: spacing.m,
        ...shadows.small,
    },
    primaryButton: {
        backgroundColor: palette.primary.main,
    },
    secondaryButton: {
        backgroundColor: palette.background.paper,
        borderWidth: 1,
        borderColor: palette.border.default,
    },
    buttonText: {
        fontSize: typography.size.m,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
