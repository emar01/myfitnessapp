import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../constants/DesignSystem';
import { WorkoutCategory } from '../../types';

interface CategoryBreakdownProps {
    breakdown: Record<WorkoutCategory, number>;
}

export default function CategoryBreakdown({ breakdown }: CategoryBreakdownProps) {
    const { palette, spacing, borderRadius, typography, shadows } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows);
    const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);

    const categoryColors: Record<WorkoutCategory, string> = {
        'löpning': palette.accent.main,
        'styrketräning': palette.primary.main,
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

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any) => StyleSheet.create({
    container: {
        marginTop: spacing.xl,
        padding: spacing.m,
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: palette.border.default,
    },
    title: {
        fontSize: typography.size.l,
        fontWeight: typography.weight.bold as any,
        color: palette.text.primary,
        marginBottom: spacing.m,
    },
    progressBarContainer: {
        height: 12,
        flexDirection: 'row',
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: palette.border.default,
        marginBottom: spacing.l,
    },
    progressSegment: {
        height: '100%',
    },
    legend: {
        gap: spacing.s,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.s,
    },
    categoryName: {
        flex: 1,
        fontSize: typography.size.s,
        color: palette.text.primary,
    },
    categoryCount: {
        fontSize: typography.size.s,
        color: palette.text.secondary,
    },
});
