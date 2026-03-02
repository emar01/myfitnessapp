import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Palette, Shadows, Spacing, Typography } from '../../constants/DesignSystem';

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
                    color={Palette.primary.main}
                />
                <StatCard
                    label="Distans"
                    value={`${totalDistance} km`}
                    icon="trail-sign"
                    color={Palette.accent.main}
                />
                <StatCard
                    label="Tid"
                    value={formatDuration(totalDuration)}
                    icon="time"
                    color="#2196F3"
                />
                <StatCard
                    label="Tempo"
                    value={`${formatPace(averagePace)}/km`}
                    icon="speedometer"
                    color="#4CAF50"
                />
            </View>
        </View>
    );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) {
    return (
        <View style={[styles.card, Shadows.small]}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.m,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: Spacing.m,
    },
    card: {
        backgroundColor: Palette.background.paper,
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        width: '47%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    iconContainer: {
        padding: Spacing.s,
        borderRadius: BorderRadius.round,
        marginBottom: Spacing.s,
    },
    value: {
        fontSize: Typography.size.l,
        fontWeight: Typography.weight.bold as any,
        color: Palette.text.primary,
    },
    label: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        marginTop: 2,
    },
});
