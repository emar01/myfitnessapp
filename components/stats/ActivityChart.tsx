import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../constants/DesignSystem';

interface ActivityChartProps {
    data: { date: string, count: number, dayName: string }[];
}

export default function ActivityChart({ data }: ActivityChartProps) {
    const { palette, spacing, borderRadius, typography, shadows } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows);
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Senaste 7 dagarna</Text>

            <View style={styles.chart}>
                {data.map((item, index) => {
                    const heightPercent = (item.count / maxCount) * 100;
                    return (
                        <View key={item.date} style={styles.barContainer}>
                            <View style={styles.barWrapper}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: `${heightPercent}%`,
                                            backgroundColor: item.count > 0 ? palette.primary.main : palette.border.default
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.dayLabel}>{item.dayName}</Text>
                        </View>
                    );
                })}
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
        marginBottom: spacing.xl,
    },
    chart: {
        flexDirection: 'row',
        height: 150,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.s,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barWrapper: {
        height: '100%',
        width: 20,
        backgroundColor: palette.background.input || palette.background.default,
        borderRadius: 10,
        justifyContent: 'flex-end',
        overflow: 'hidden',
        marginBottom: spacing.s,
    },
    bar: {
        width: '100%',
        borderRadius: 10,
    },
    dayLabel: {
        fontSize: typography.size.xs,
        color: palette.text.secondary,
        textTransform: 'capitalize',
    },
});
