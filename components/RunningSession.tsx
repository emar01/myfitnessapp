import { useTheme } from '@/constants/DesignSystem';
import { useAlert } from '@/context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface RunningSessionProps {
    initialDistance?: number;
    initialDuration?: number;
    onSave: (distance: number, duration: number) => void;
}

export default function RunningSession({ initialDistance, initialDuration, onSave }: RunningSessionProps) {
    const { palette, spacing, borderRadius, typography, shadows, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows, isDark);
    const { showAlert } = useAlert();

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
            showAlert('Mata in data', 'Vänligen fyll i distans och tid.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>Distans (km)</Text>
                <TextInput
                    style={styles.input}
                    value={distance}
                    onChangeText={(val) => setDistance(val.replace(',', '.'))}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={palette.text.disabled}
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
                            placeholderTextColor={palette.text.disabled}
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
                            placeholderTextColor={palette.text.disabled}
                        />
                        <Text style={styles.unit}>sek</Text>
                    </View>
                </View>
            </View>

            <View style={styles.statsCard}>
                <View style={styles.statItem}>
                    <Ionicons name="speedometer-outline" size={24} color={palette.primary.main} />
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

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, isDark: boolean) => StyleSheet.create({
    container: {
        padding: spacing.m,
    },
    card: {
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        marginBottom: spacing.m,
        ...shadows.small,
    },
    label: {
        fontSize: typography.size.m,
        color: palette.text.secondary,
        marginBottom: spacing.s,
    },
    input: {
        fontSize: 32,
        fontWeight: 'bold',
        color: palette.text.primary,
        borderBottomWidth: 1,
        borderBottomColor: palette.border.default,
        paddingVertical: spacing.s,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginRight: spacing.l,
    },
    timeInput: {
        fontSize: 32,
        fontWeight: 'bold',
        color: palette.text.primary,
        borderBottomWidth: 1,
        borderBottomColor: palette.border.default,
        minWidth: 50,
        textAlign: 'center',
        marginRight: 4,
    },
    unit: {
        fontSize: typography.size.s,
        color: palette.text.secondary,
    },
    statsCard: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: isDark ? '#1a2733' : '#E3F2FD',
        borderRadius: borderRadius.m,
        padding: spacing.m,
        marginBottom: spacing.l,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: palette.primary.main,
        marginVertical: 4,
    },
    statLabel: {
        fontSize: typography.size.xs,
        color: palette.text.secondary,
    },
    saveButton: {
        backgroundColor: palette.primary.main,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: typography.size.m,
        fontWeight: 'bold',
    },
});
