import { useTheme } from '@/constants/DesignSystem';
import { useAlert } from '@/context/AlertContext';
import { WorkoutExercise, WorkoutSet } from '@/types';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import SetRow from './SetRow';

interface ExerciseCardProps {
    exercise: WorkoutExercise;
    onUpdate: (updatedExercise: WorkoutExercise) => void;
    onRemove: () => void;
    onPlayVideo?: (url: string) => void;
    currentPr?: number; // New Prop
}

export default function ExerciseCard({ exercise, onUpdate, onRemove, onPlayVideo, currentPr }: ExerciseCardProps) {
    const { palette, spacing, borderRadius, typography, shadows, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows, isDark);
    const { showAlert } = useAlert();
    // Determine if any set is a "Potential PR"
    const isPrSet = (weight: number) => {
        return currentPr ? weight > currentPr : false;
    };
    // Separate sets
    const warmupSets = exercise.sets.filter(s => s.type === 'warmup');
    const workingSets = exercise.sets.filter(s => s.type !== 'warmup');

    const addSet = (type: 'warmup' | 'normal' = 'normal') => {
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet: WorkoutSet = {
            id: uuidv4(),
            reps: lastSet ? lastSet.reps : 10,
            weight: lastSet ? lastSet.weight : 20,
            isCompleted: false,
            type: type
        };
        onUpdate({ ...exercise, sets: [...exercise.sets, newSet] });
    };

    const updateSet = (id: string, updatedSet: WorkoutSet) => {
        const newSets = exercise.sets.map(s => s.id === id ? updatedSet : s);
        onUpdate({ ...exercise, sets: newSets });
    };

    const deleteSet = (id: string) => {
        const newSets = exercise.sets.filter(s => s.id !== id);
        onUpdate({ ...exercise, sets: newSets });
    };

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.title}>{exercise.name}</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => onPlayVideo && exercise.videoLink ? onPlayVideo(exercise.videoLink) : showAlert('Video', 'Ingen video tillgänglig')}>
                        <Ionicons name="play-circle-outline" size={24} color={palette.primary.main} style={{ marginRight: spacing.s }} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onRemove}>
                        <FontAwesome name="ellipsis-v" size={20} color={palette.text.secondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Warm Up Section */}
            {warmupSets.length > 0 && (
                <View style={styles.section}>
                    <TouchableOpacity style={styles.sectionHeader} onPress={() => addSet('warmup')}>
                        <Ionicons name="add" size={16} color={palette.accent.main} />
                        <Text style={styles.sectionTitle}>Warm-up</Text>
                    </TouchableOpacity>

                    {warmupSets.map((set, i) => (
                        <SetRow
                            key={set.id}
                            set={set}
                            index={i}
                            setIndexWithinType={i + 1}
                            onUpdate={(updated) => updateSet(set.id, updated)}
                            onDelete={() => deleteSet(set.id)}
                        // Warmup sets typically don't count for PR display here, but logic allows it
                        />
                    ))}
                </View>
            )}

            {/* Default/Working Sets */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Set</Text>
                </View>

                {workingSets.map((set, i) => (
                    <SetRow
                        key={set.id}
                        set={set}
                        index={i}
                        setIndexWithinType={i + 1}
                        onUpdate={(updated) => updateSet(set.id, updated)}
                        onDelete={() => deleteSet(set.id)}
                        isPr={isPrSet(set.weight) && set.isCompleted} // Pass isPr prop
                    />
                ))}

                <TouchableOpacity style={styles.footerAddButton} onPress={() => addSet('normal')}>
                    <Ionicons name="add" size={18} color={palette.primary.main} />
                    <Text style={styles.footerAddText}>Lägg till set</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, isDark: boolean) => StyleSheet.create({
    card: {
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        marginBottom: spacing.m,
        ...shadows.small,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.s,
        paddingBottom: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: palette.border.default,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: typography.size.m,
        fontWeight: 'bold',
        color: palette.text.primary,
    },
    section: {
        marginBottom: spacing.s,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.s,
        marginTop: spacing.s,
    },
    sectionTitle: {
        fontSize: typography.size.s,
        color: palette.text.secondary, // Light gray/reddish tint?
        marginLeft: 4,
    },
    footerAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.s,
        marginTop: spacing.xs,
        backgroundColor: palette.background.default,
        borderRadius: borderRadius.m,
    },
    footerAddText: {
        color: palette.primary.main,
        fontWeight: 'bold',
        fontSize: typography.size.s,
        marginLeft: spacing.xs,
    }
});
