import Button from '@/components/ui/Button';
import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Mock Data for questions
const LEVELS = ['Nybörjare', 'Motionär', 'Avancerad'];
const GOALS = ['Genomföra ett lopp', 'Hälsa & Välmående', 'Bli snabbare', 'Bli starkare'];
const DAYS = ['2-3 dagar', '3-4 dagar', '4-5 dagar', '5+ dagar'];

const OptionGroup = ({ title, options, selected, onSelect }: any) => (
    <View style={styles.group}>
        <Text style={styles.groupTitle}>{title}</Text>
        <View style={styles.optionsContainer}>
            {options.map((option: string) => (
                <TouchableOpacity
                    key={option}
                    style={[
                        styles.optionchip,
                        selected === option && styles.selectedChip
                    ]}
                    onPress={() => onSelect(option)}
                >
                    <Text style={[styles.optionText, selected === option && styles.selectedOptionText]}>
                        {option}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

export default function QuestionnaireScreen() {
    const router = useRouter();
    const [level, setLevel] = useState<string | null>(null);
    const [goal, setGoal] = useState<string | null>(null);
    const [days, setDays] = useState<string | null>(null);

    const handleFinish = () => {
        // Here we would save the profile data
        // For now just navigate to dashboard
        router.replace('/(tabs)');
    };

    const isComplete = level && goal && days;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.title}>Berätta om dig</Text>
                <Text style={styles.subtitle}>För att vi ska kunna skapa det bästa upplägget för dig.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <OptionGroup
                    title="Vad är din nuvarande nivå?"
                    options={LEVELS}
                    selected={level}
                    onSelect={setLevel}
                />

                <OptionGroup
                    title="Vad är ditt huvudmål?"
                    options={GOALS}
                    selected={goal}
                    onSelect={setGoal}
                />

                <OptionGroup
                    title="Hur många dagar vill du träna?"
                    options={DAYS}
                    selected={days}
                    onSelect={setDays}
                />
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Skapa mitt program"
                    onPress={handleFinish}
                    disabled={!isComplete}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Palette.background.default,
    },
    header: {
        padding: Spacing.xl,
        paddingBottom: Spacing.l,
    },
    title: {
        fontSize: Typography.size.xl,
        fontFamily: Typography.fontFamily.bold,
        fontWeight: 'bold',
        marginBottom: Spacing.s,
        color: Palette.text.primary,
    },
    subtitle: {
        fontSize: Typography.size.m,
        color: Palette.text.secondary,
        lineHeight: 24,
    },
    content: {
        padding: Spacing.m,
    },
    group: {
        marginBottom: Spacing.xl,
    },
    groupTitle: {
        fontSize: Typography.size.m,
        fontWeight: '600',
        marginBottom: Spacing.m,
        color: Palette.text.primary,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.s,
    },
    optionchip: {
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        borderRadius: BorderRadius.round,
        backgroundColor: Palette.background.paper,
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    selectedChip: {
        backgroundColor: Palette.primary.main,
        borderColor: Palette.primary.main,
    },
    optionText: {
        fontSize: Typography.size.s,
        color: Palette.text.primary,
    },
    selectedOptionText: {
        color: '#FFF',
        fontWeight: '600',
    },
    footer: {
        padding: Spacing.m,
        backgroundColor: Palette.background.paper,
        borderTopWidth: 1,
        borderTopColor: Palette.border.default,
    },
});
