import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProgramOverviewScreen() {
    const router = useRouter();
    const { id, title } = useLocalSearchParams(); // Allow passing title

    const PROGRAM_TITLE = (title as string) || "Beginner Barbell Program";

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color={Palette.text.primary} />
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="scale-outline" size={20} color={Palette.text.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="share-social-outline" size={20} color={Palette.text.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="copy-outline" size={20} color={Palette.text.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                <Text style={styles.pageTitle}>{PROGRAM_TITLE}</Text>

                {/* Hero / Information Card */}
                <View style={styles.heroCard}>
                    <View style={styles.heroContent}>
                        {/* Muscle Map Placeholder */}
                        <View style={styles.muscleMapContainer}>
                            <Ionicons name="body" size={80} color="#E57373" />
                        </View>

                        {/* Description */}
                        <Text style={styles.descriptionText}>
                            A beginner program where you train three times per week, and switch back and forth between two different workouts. Try to increase the weights every workout.
                        </Text>
                    </View>
                </View>

                {/* Start Button */}
                <TouchableOpacity style={styles.startButton} onPress={() => router.push('/workout/log')}>
                    <Ionicons name="play" size={20} color={Palette.accent.main} style={{ marginRight: 8 }} />
                    <Text style={styles.startButtonText}>Start following program</Text>
                </TouchableOpacity>

                {/* Week Header */}
                <View style={styles.weekHeader}>
                    <Ionicons name="chevron-up" size={16} color={Palette.accent.main} style={{ marginRight: 4 }} />
                    <Text style={styles.weekHeaderText}>Week 1</Text>
                </View>

                {/* Workout A */}
                <Text style={styles.sectionLabel}>Week 1, Workout A</Text>
                <View style={styles.workoutCard}>
                    <View style={styles.exerciseRow}>
                        <View style={styles.exerciseItem}>
                            <Text style={styles.exerciseName}>Squat</Text>
                            <Text style={styles.exerciseMeta}>30 reps in 3 sets</Text>
                        </View>
                        <View style={styles.exerciseItem}>
                            <Text style={styles.exerciseName}>Bench Press</Text>
                            <Text style={styles.exerciseMeta}>30 reps in 3 sets</Text>
                        </View>
                    </View>
                    <View style={[styles.exerciseRow, { marginTop: Spacing.m }]}>
                        <View style={styles.exerciseItem}>
                            <Text style={styles.exerciseName}>Barbell Row</Text>
                            <Text style={styles.exerciseMeta}>30 reps in 3 sets</Text>
                        </View>
                    </View>
                </View>

                {/* Workout B */}
                <Text style={[styles.sectionLabel, { marginTop: Spacing.l }]}>Week 1, Workout B</Text>
                <View style={styles.workoutCard}>
                    <View style={styles.exerciseRow}>
                        <View style={styles.exerciseItem}>
                            <Text style={styles.exerciseName}>Deadlift</Text>
                            <Text style={styles.exerciseMeta}>24 reps in 3 sets</Text>
                        </View>
                        <View style={styles.exerciseItem}>
                            <Text style={styles.exerciseName}>Lat Pulldown</Text>
                            <Text style={styles.exerciseMeta}>30 reps in 3 sets</Text>
                        </View>
                    </View>
                    <View style={[styles.exerciseRow, { marginTop: Spacing.m }]}>
                        <View style={styles.exerciseItem}>
                            <Text style={styles.exerciseName}>Overhead Press</Text>
                            <Text style={styles.exerciseMeta}>30 reps in 3 sets</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
    },
    headerActions: {
        flexDirection: 'row',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.s,
        ...Shadows.small,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.m,
        paddingBottom: 40,
    },
    pageTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
        marginBottom: Spacing.m,
    },
    heroCard: {
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.l,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        ...Shadows.small,
    },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    muscleMapContainer: {
        width: 80,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.m,
    },
    descriptionText: {
        flex: 1,
        fontSize: Typography.size.s,
        lineHeight: 20,
        color: Palette.text.secondary,
    },
    startButton: {
        backgroundColor: '#FFF',
        borderRadius: 30, // Pill shape
        paddingVertical: Spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.m,
        ...Shadows.small,
    },
    startButtonText: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    weekHeader: {
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        paddingVertical: 8,
        borderRadius: BorderRadius.m,
        alignSelf: 'flex-start',
        marginBottom: Spacing.m,
        ...Shadows.small,
    },
    weekHeaderText: {
        fontSize: Typography.size.s,
        fontWeight: '600',
        color: Palette.text.primary,
    },
    sectionLabel: {
        fontSize: Typography.size.m,
        fontWeight: '600',
        color: Palette.text.primary,
        marginBottom: Spacing.s,
        marginLeft: 4,
    },
    workoutCard: {
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.l,
        padding: Spacing.m,
        ...Shadows.small,
    },
    exerciseRow: {
        flexDirection: 'row',
    },
    exerciseItem: {
        flex: 1,
    },
    exerciseName: {
        fontSize: Typography.size.s,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    exerciseMeta: {
        fontSize: Typography.size.xs,
        color: Palette.text.secondary,
        marginTop: 2,
    },
});
