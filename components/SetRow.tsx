import { useTheme } from '@/constants/DesignSystem';
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
    const { palette, spacing, borderRadius, typography, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, isDark);
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
                    <Ionicons name="body" size={14} color={isCompleted ? '#FFF' : palette.accent.main} />
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
                        value={set.weight !== undefined && set.weight !== null ? set.weight.toString() : ''}
                        onChangeText={(text) => onUpdate({ ...set, weight: text === '' ? 0 : Number(text.replace(',', '.')) })}
                        selectTextOnFocus
                    />
                    <Text style={styles.unitText}>kg</Text>
                </View>

                <View style={[styles.inputWrapper, { marginLeft: spacing.xl }]}>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={set.reps !== undefined && set.reps !== null ? set.reps.toString() : ''}
                        onChangeText={(text) => onUpdate({ ...set, reps: text === '' ? 0 : Number(text) })}
                        selectTextOnFocus
                    />
                    <Text style={styles.unitText}>reps</Text>
                </View>
            </View>

            {/* Menu Action (Three Dots) */}
            <TouchableOpacity style={styles.menuButton} onPress={onDelete}>
                <Ionicons name="trash-outline" size={16} color={palette.text.disabled} />
            </TouchableOpacity>

        </View>
    );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, isDark: boolean) => StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, // Increased padding for touch targets
        backgroundColor: palette.background.paper,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: palette.border.default,
    },
    setIndicator: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.m,
        borderWidth: 1,
        borderColor: palette.border.default,
        backgroundColor: palette.background.paper,
    },
    setIndicatorCompleted: {
        backgroundColor: '#4CD964', // Success Green
        borderColor: '#4CD964',
    },
    setIndicatorPr: {
        backgroundColor: palette.accent.main, // Gold/Yellow
        borderColor: palette.accent.main,
    },
    setIndicatorWarmupIncomplete: {
        // Special style for warmup incomplete?
        borderColor: palette.border.default,
    },
    setNumberText: {
        fontSize: typography.size.s,
        fontWeight: 'bold',
        color: palette.text.primary,
    },

    inputsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingRight: spacing.xl,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 80,
        justifyContent: 'flex-end',
        backgroundColor: palette.background.input,
        borderRadius: borderRadius.s,
        paddingHorizontal: 8,
        height: 36,
    },
    input: {
        flex: 1,
        fontSize: typography.size.m,
        fontWeight: 'bold',
        color: palette.text.primary,
        textAlign: 'right',
        minWidth: 30,
        paddingVertical: 0,
    },
    unitText: {
        fontSize: typography.size.xs,
        color: palette.text.disabled,
        marginLeft: 4,
        marginBottom: 2,
    },
    menuButton: {
        padding: spacing.s,
    },
});
