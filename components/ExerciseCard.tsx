import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { WorkoutExercise, WorkoutSet } from '@/types';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import SetRow from './SetRow';

interface ExerciseCardProps {
    exercise: WorkoutExercise;
    onUpdate: (updatedExercise: WorkoutExercise) => void;
    onRemove: () => void;
}

export default function ExerciseCard({ exercise, onUpdate, onRemove }: ExerciseCardProps) {
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
                    <TouchableOpacity onPress={() => alert('Info')}>
                        <Ionicons name="help-circle-outline" size={24} color={Palette.text.secondary} style={{ marginRight: Spacing.s }} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onRemove}>
                        <FontAwesome name="ellipsis-v" size={20} color={Palette.text.secondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Warm Up Section */}
            {warmupSets.length > 0 && (
                <View style={styles.section}>
                    <TouchableOpacity style={styles.sectionHeader} onPress={() => addSet('warmup')}>
                        <Ionicons name="add" size={16} color={Palette.accent.main} />
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
                        />
                    ))}
                </View>
            )}

            {/* Default/Working Sets */}
            <View style={styles.section}>
                {/* Only show header if we have mixed sets, or always? Screenshot implies list of numbered sets */}
                {/* Only showing header if strictly separating or empty */}
                {(warmupSets.length > 0 || workingSets.length === 0) && (
                    <TouchableOpacity style={styles.sectionHeader} onPress={() => addSet('normal')}>
                        <Ionicons name="add" size={16} color={Palette.accent.main} />
                        <Text style={styles.sectionTitle}>Set</Text>
                    </TouchableOpacity>
                )}

                {workingSets.map((set, i) => (
                    <SetRow
                        key={set.id}
                        set={set}
                        index={i}
                        setIndexWithinType={i + 1}
                        onUpdate={(updated) => updateSet(set.id, updated)}
                        onDelete={() => deleteSet(set.id)}
                    />
                ))}

                {/* Bottom Add Button if no sets yet? Or always? */}
                {exercise.sets.length === 0 && (
                    <TouchableOpacity style={styles.emptyAddButton} onPress={() => addSet('normal')}>
                        <Text style={styles.emptyAddText}>+ Add First Set</Text>
                    </TouchableOpacity>
                )}
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.l,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        ...Shadows.small,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.s,
        paddingBottom: Spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    section: {
        marginBottom: Spacing.s,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.s,
        marginTop: Spacing.s,
    },
    sectionTitle: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary, // Light gray/reddish tint?
        marginLeft: 4,
    },
    emptyAddButton: {
        padding: Spacing.m,
        alignItems: 'center',
    },
    emptyAddText: {
        color: Palette.primary.main,
        fontWeight: 'bold',
    }
});
