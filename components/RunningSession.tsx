import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface RunningSessionProps {
    initialDistance?: number;
    initialDuration?: number;
    onSave: (distance: number, duration: number) => void;
}

export default function RunningSession({ initialDistance, initialDuration, onSave }: RunningSessionProps) {
    const [distance, setDistance] = useState(initialDistance?.toString() || '');
    const [minutes, setMinutes] = useState(initialDuration ? Math.floor(initialDuration / 60).toString() : '');
    const [seconds, setSeconds] = useState(initialDuration ? (initialDuration % 60).toString() : '');
    const [pace, setPace] = useState('0:00');

    useEffect(() => {
        const d = parseFloat(distance);
        const m = parseInt(minutes) || 0;
        const s = parseInt(seconds) || 0;
        const totalSeconds = m * 60 + s;

        if (d > 0 && totalSeconds > 0) {
            const paceSeconds = totalSeconds / d;
            const paceM = Math.floor(paceSeconds / 60);
            const paceS = Math.floor(paceSeconds % 60);
            setPace(`${paceM}:${paceS < 10 ? '0' : ''}${paceS}`);
        } else {
            setPace('0:00');
        }
    }, [distance, minutes, seconds]);

    const handleSave = () => {
        const d = parseFloat(distance);
        const m = parseInt(minutes) || 0;
        const s = parseInt(seconds) || 0;
        const totalSeconds = m * 60 + s;

        if (d > 0 && totalSeconds > 0) {
            onSave(d, totalSeconds);
        } else {
            alert('Vänligen fyll i distans och tid.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>Distans (km)</Text>
                <TextInput
                    style={styles.input}
                    value={distance}
                    onChangeText={setDistance}
                    keyboardType="numeric"
                    placeholder="0.0"
                    placeholderTextColor={Palette.text.disabled}
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Tid</Text>
                <View style={styles.timeRow}>
                    <View style={styles.timeInputContainer}>
                        <TextInput
                            style={styles.timeInput}
                            value={minutes}
                            onChangeText={setMinutes}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={Palette.text.disabled}
                        />
                        <Text style={styles.unit}>min</Text>
                    </View>
                    <View style={styles.timeInputContainer}>
                        <TextInput
                            style={styles.timeInput}
                            value={seconds}
                            onChangeText={setSeconds}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={Palette.text.disabled}
                        />
                        <Text style={styles.unit}>sek</Text>
                    </View>
                </View>
            </View>

            <View style={styles.statsCard}>
                <View style={styles.statItem}>
                    <Ionicons name="speedometer-outline" size={24} color={Palette.primary.main} />
                    <Text style={styles.statValue}>{pace}</Text>
                    <Text style={styles.statLabel}>min/km</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Ionicons name="save-outline" size={24} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Spara Pass</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.m,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    label: {
        fontSize: Typography.size.m,
        color: Palette.text.secondary,
        marginBottom: Spacing.s,
    },
    input: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Palette.text.primary,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
        paddingVertical: Spacing.s,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginRight: Spacing.l,
    },
    timeInput: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Palette.text.primary,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
        minWidth: 50,
        textAlign: 'center',
        marginRight: 4,
    },
    unit: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
    statsCard: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.l,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Palette.primary.main,
        marginVertical: 4,
    },
    statLabel: {
        fontSize: Typography.size.xs,
        color: Palette.text.secondary,
    },
    saveButton: {
        backgroundColor: Palette.primary.main,
        borderRadius: BorderRadius.l,
        padding: Spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: Typography.size.m,
        fontWeight: 'bold',
    },
});
