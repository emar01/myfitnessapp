import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { WorkoutSet } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SetRowProps {
    set: WorkoutSet;
    index: number;
    setIndexWithinType: number; // 1, 2, 3... for normal sets
    onUpdate: (updatedSet: WorkoutSet) => void;
    onDelete: () => void;
    isPr?: boolean; // New prop
}

export default function SetRow({ set, index, setIndexWithinType, onUpdate, onDelete, isPr }: SetRowProps) {
    const isWarmup = set.type === 'warmup';
    const isCompleted = set.isCompleted;

    // Toggle completion when circle is pressed
    const handleToggleComplete = () => {
        onUpdate({ ...set, isCompleted: !set.isCompleted });
    };

    return (
        <View style={styles.row}>
            {/* Set Indicator / Check Button */}
            <TouchableOpacity
                style={[
                    styles.setIndicator,
                    isCompleted && styles.setIndicatorCompleted,
                    !isCompleted && isWarmup && styles.setIndicatorWarmupIncomplete,
                    isPr && styles.setIndicatorPr // Apply PR style
                ]}
                onPress={handleToggleComplete}
            >
                {isPr ? (
                    <Ionicons name="trophy" size={14} color="#FFF" />
                ) : isWarmup ? (
                    <Ionicons name="body" size={14} color={isCompleted ? '#FFF' : Palette.accent.main} />
                ) : (
                    <Text style={[styles.setNumberText, isCompleted && { color: '#FFF' }]}>
                        {setIndexWithinType}
                    </Text>
                )}
            </TouchableOpacity>

            {/* Inputs */}
            <View style={styles.inputsContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={set.weight.toString()}
                        onChangeText={(text) => onUpdate({ ...set, weight: Number(text) })}
                        selectTextOnFocus
                    />
                    <Text style={styles.unitText}>kg</Text>
                </View>

                <View style={[styles.inputWrapper, { marginLeft: Spacing.xl }]}>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={set.reps.toString()}
                        onChangeText={(text) => onUpdate({ ...set, reps: Number(text) })}
                        selectTextOnFocus
                    />
                    <Text style={styles.unitText}>reps</Text>
                </View>
            </View>

            {/* Menu Action (Three Dots) */}
            <TouchableOpacity style={styles.menuButton} onPress={onDelete}>
                <Ionicons name="trash-outline" size={16} color={Palette.text.disabled} />
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, // Increased padding for touch targets
        backgroundColor: '#FFF',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F0F0F0',
    },
    setIndicator: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.m,
        borderWidth: 1,
        borderColor: Palette.border.default,
        backgroundColor: '#FFF',
    },
    setIndicatorCompleted: {
        backgroundColor: '#4CD964', // Success Green
        borderColor: '#4CD964',
    },
    setIndicatorPr: {
        backgroundColor: Palette.accent.main, // Gold/Yellow
        borderColor: Palette.accent.main,
    },
    setIndicatorWarmupIncomplete: {
        // Special style for warmup incomplete?
        borderColor: Palette.border.default,
    },
    setNumberText: {
        fontSize: Typography.size.s,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },

    inputsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingRight: Spacing.xl,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 80,
        justifyContent: 'flex-end',
        backgroundColor: '#F5F5F7',
        borderRadius: BorderRadius.s,
        paddingHorizontal: 8,
        height: 36,
    },
    input: {
        flex: 1,
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
        textAlign: 'right',
        minWidth: 30,
        paddingVertical: 0,
    },
    unitText: {
        fontSize: Typography.size.xs,
        color: Palette.text.disabled,
        marginLeft: 4,
        marginBottom: 2,
    },
    menuButton: {
        padding: Spacing.s,
    },
});
