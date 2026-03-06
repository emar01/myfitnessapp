import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../constants/DesignSystem';

interface StatsOverviewProps {
    totalWorkouts: number;
    totalDistance: number;
    totalDuration: number;
    averagePace: number;
}

export default function StatsOverview({
    totalWorkouts,
    totalDistance,
    totalDuration,
    averagePace
}: StatsOverviewProps) {
    const { palette, spacing, borderRadius, typography, shadows } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows);

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    const formatPace = (secondsPerKm: number) => {
        if (secondsPerKm === 0) return '0:00';
        const minutes = Math.floor(secondsPerKm / 60);
        const seconds = Math.round(secondsPerKm % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                <StatCard
                    label="Pass"
                    value={totalWorkouts.toString()}
                    icon="fitness"
                    color={palette.primary.main}
                    styles={styles}
                />
                <StatCard
                    label="Distans"
                    value={`${totalDistance} km`}
                    icon="trail-sign"
                    color={palette.accent.main}
                    styles={styles}
                />
                <StatCard
                    label="Tid"
                    value={formatDuration(totalDuration)}
                    icon="time"
                    color={palette.primary.light || "#2196F3"}
                    styles={styles}
                />
                <StatCard
                    label="Tempo"
                    value={`${formatPace(averagePace)}/km`}
                    icon="speedometer"
                    color={palette.status.success || "#4CAF50"}
                    styles={styles}
                />
            </View>
        </View>
    );
}

function StatCard({ label, value, icon, color, styles }: { label: string, value: string, icon: any, color: string, styles: any }) {
    return (
        <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any) => StyleSheet.create({
    container: {
        paddingVertical: spacing.m,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.m,
    },
    card: {
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.m,
        padding: spacing.m,
        width: '47%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border.default,
        ...shadows.small,
    },
    iconContainer: {
        padding: spacing.s,
        borderRadius: borderRadius.round,
        marginBottom: spacing.s,
    },
    value: {
        fontSize: typography.size.l,
        fontWeight: typography.weight.bold as any,
        color: palette.text.primary,
    },
    label: {
        fontSize: typography.size.s,
        color: palette.text.secondary,
        marginTop: 2,
    },
});
