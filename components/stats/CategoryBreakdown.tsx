import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Palette, Spacing, Typography } from '../../constants/DesignSystem';
import { WorkoutCategory } from '../../types';

interface CategoryBreakdownProps {
    breakdown: Record<WorkoutCategory, number>;
}

export default function CategoryBreakdown({ breakdown }: CategoryBreakdownProps) {
    const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);

    const categoryColors: Record<WorkoutCategory, string> = {
        'löpning': Palette.accent.main,
        'styrketräning': Palette.primary.main,
        'rehab': '#2196F3',
        'rörlighet': '#9C27B0',
        'övrigt': '#757575'
    };

    const categories = Object.entries(breakdown)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

    if (total === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Träningsfördelning</Text>

            <View style={styles.progressBarContainer}>
                {categories.map(([category, count]) => (
                    <View
                        key={category}
                        style={[
                            styles.progressSegment,
                            {
                                width: `${(count / total) * 100}%`,
                                backgroundColor: categoryColors[category as WorkoutCategory]
                            }
                        ]}
                    />
                ))}
            </View>

            <View style={styles.legend}>
                {categories.map(([category, count]) => (
                    <View key={category} style={styles.legendItem}>
                        <View
                            style={[
                                styles.dot,
                                { backgroundColor: categoryColors[category as WorkoutCategory] }
                            ]}
                        />
                        <Text style={styles.categoryName}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                        <Text style={styles.categoryCount}>{count} pass</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.xl,
        padding: Spacing.m,
        backgroundColor: Palette.background.paper,
        borderRadius: BorderRadius.l,
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    title: {
        fontSize: Typography.size.l,
        fontWeight: Typography.weight.bold as any,
        color: Palette.text.primary,
        marginBottom: Spacing.m,
    },
    progressBarContainer: {
        height: 12,
        flexDirection: 'row',
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: Palette.border.default,
        marginBottom: Spacing.l,
    },
    progressSegment: {
        height: '100%',
    },
    legend: {
        gap: Spacing.s,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: Spacing.s,
    },
    categoryName: {
        flex: 1,
        fontSize: Typography.size.s,
        color: Palette.text.primary,
    },
    categoryCount: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
});
