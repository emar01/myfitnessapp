import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/DesignSystem';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface NutritionOverviewProps {
    dailyGoal: number;
    eaten: number;
    burned: number;
    macros: {
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
    };
    macroGoals?: {
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
    };
}

export default function NutritionOverview({ dailyGoal, eaten, burned, macros, macroGoals }: NutritionOverviewProps) {
    const { palette, spacing, borderRadius } = useTheme();

    const remaining = dailyGoal - eaten + burned;
    
    // Calculate progress for circular chart
    // A simple representation, but let's just show text for now if we don't have SVG
    // In a real app we'd use react-native-svg or similar for a true circular progress.
    const progressPercent = Math.min((eaten / (dailyGoal + burned)) * 100, 100) || 0;

    // Macro percentages based on goals or just generic 100g targets
    const defaultMacroGoals = macroGoals || { protein: 150, carbs: 200, fat: 70, fiber: 30 };
    
    const renderMacroBar = (label: string, value: number, goal: number, color: string) => {
        const percent = Math.min((value / goal) * 100, 100) || 0;
        return (
            <View style={styles.macroCol}>
                <View style={[styles.macroTrack, { backgroundColor: palette.background.default }]}>
                    <View style={[styles.macroFill, { backgroundColor: color, height: `${percent}%` }]} />
                </View>
                <Text style={[styles.macroLabel, { color: palette.text.secondary }]}>{label}</Text>
                <Text style={[styles.macroValue, { color: palette.text.primary }]}>{Math.round(value)}g</Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: palette.background.paper, borderRadius: borderRadius.l, padding: spacing.l }]}>
            {/* Equation Row */}
            <View style={[styles.equationRow, { marginBottom: spacing.l }]}>
                <View style={styles.equationItem}>
                    <Text style={[styles.equationValue, { color: palette.text.primary }]}>{Math.round(dailyGoal)}</Text>
                    <Text style={[styles.equationLabel, { color: palette.text.secondary }]}>Basmål</Text>
                </View>
                <Text style={[styles.equationOperator, { color: palette.text.disabled }]}>-</Text>
                <View style={styles.equationItem}>
                    <Text style={[styles.equationValue, { color: palette.text.primary }]}>{Math.round(eaten)}</Text>
                    <Text style={[styles.equationLabel, { color: palette.text.secondary }]}>Mat</Text>
                </View>
                <Text style={[styles.equationOperator, { color: palette.text.disabled }]}>+</Text>
                <View style={styles.equationItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <FontAwesome name="fire" color={palette.status.warning} size={14} style={{ marginRight: 4, marginTop: 2 }} />
                        <Text style={[styles.equationValue, { color: palette.status.warning }]}>{Math.round(burned)}</Text>
                    </View>
                    <Text style={[styles.equationLabel, { color: palette.status.warning }]}>Aktivitet</Text>
                </View>
            </View>

            {/* Center Circle */}
            <View style={{ alignItems: 'center' }}>
                <View style={[styles.circleContainer, { borderColor: palette.primary.main }]}>
                    <Text style={[styles.remainingValue, { color: palette.text.primary }]}>{Math.round(remaining)}</Text>
                    <Text style={[styles.remainingLabel, { color: palette.text.secondary }]}>Kcal kvar</Text>
                </View>
            </View>

            {/* Bottom row: Macros */}
            <View style={[styles.macrosRow, { marginTop: spacing.xl }]}>
                {renderMacroBar('Kolhydr...', macros.carbs, defaultMacroGoals.carbs, palette.status.info)}
                {renderMacroBar('Fett', macros.fat, defaultMacroGoals.fat, palette.status.error)}
                {renderMacroBar('Proteiner', macros.protein, defaultMacroGoals.protein, palette.status.success)}
                {renderMacroBar('Fibrer', macros.fiber, defaultMacroGoals.fiber, palette.status.warning)}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    equationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    equationItem: {
        alignItems: 'center',
    },
    equationValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    equationLabel: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    },
    equationOperator: {
        fontSize: 20,
        fontWeight: '300',
        paddingBottom: 16,
    },
    circleContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    remainingValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    remainingLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    macrosRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    macroCol: {
        alignItems: 'center',
        flex: 1,
    },
    macroTrack: {
        width: 40,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        justifyContent: 'flex-start',
        flexDirection: 'row',
        marginBottom: 8,
    },
    macroFill: {
        height: '100%',
        borderRadius: 4,
    },
    macroLabel: {
        fontSize: 10,
        marginBottom: 2,
    },
    macroValue: {
        fontSize: 12,
        fontWeight: '600',
    }
});
