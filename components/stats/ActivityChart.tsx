import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Palette, Spacing, Typography } from '../../constants/DesignSystem';

interface ActivityChartProps {
    data: { date: string, count: number, dayName: string }[];
}

export default function ActivityChart({ data }: ActivityChartProps) {
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
                                            backgroundColor: item.count > 0 ? Palette.primary.main : Palette.border.default
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
        marginBottom: Spacing.xl,
    },
    chart: {
        flexDirection: 'row',
        height: 150,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.s,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barWrapper: {
        height: '100%',
        width: 20,
        backgroundColor: Palette.background.input,
        borderRadius: 10,
        justifyContent: 'flex-end',
        overflow: 'hidden',
        marginBottom: Spacing.s,
    },
    bar: {
        width: '100%',
        borderRadius: 10,
    },
    dayLabel: {
        fontSize: Typography.size.xs,
        color: Palette.text.secondary,
        textTransform: 'capitalize',
    },
});
