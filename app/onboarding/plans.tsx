import Button from '@/components/ui/Button';
import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PLANS = [
    { id: '3months', title: '3 Månader', price: '1200 kr', desc: 'Testa tjänsten eller träna mot ett specifikt lopp.' },
    { id: '6months', title: '6 Månader', price: '2400 kr', bonus: '+ 3 bonusveckor', desc: 'För dig som vill utvecklas över en hel säsong.', recommended: true },
    { id: '9months', title: '9 Månader', price: '3600 kr', bonus: '+ 4 bonusveckor', desc: 'Kontinuerlig utvecklingsresa.' },
    { id: '12months', title: '12 Månader', price: '4800 kr', bonus: '+ 6 bonusveckor', desc: 'Löpning som livsstil. Långsiktighet som fungerar.' },
];

export default function PlanSelectionScreen() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    const handleContinue = () => {
        if (selectedPlan) {
            router.push('/onboarding/questionnaire');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.title}>Välj din plan</Text>
                <Text style={styles.subtitle}>Din resa börjar här. Välj en period som passar dina mål.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {PLANS.map((plan) => (
                    <TouchableOpacity
                        key={plan.id}
                        style={[
                            styles.card,
                            selectedPlan === plan.id && styles.selectedCard,
                            plan.recommended && selectedPlan !== plan.id && styles.recommendedCard
                        ]}
                        onPress={() => setSelectedPlan(plan.id)}
                        activeOpacity={0.9}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={[styles.planTitle, selectedPlan === plan.id && styles.selectedText]}>{plan.title}</Text>
                            {plan.recommended && <View style={styles.badge}><Text style={styles.badgeText}>Populärast</Text></View>}
                        </View>

                        <Text style={[styles.price, selectedPlan === plan.id && styles.selectedText]}>
                            {plan.price}
                            {plan.bonus && <Text style={[styles.bonus, selectedPlan === plan.id && styles.selectedText]}> {plan.bonus}</Text>}
                        </Text>

                        <Text style={[styles.desc, selectedPlan === plan.id && styles.selectedText]}>{plan.desc}</Text>

                        {selectedPlan === plan.id && (
                            <View style={styles.checkIcon}>
                                <FontAwesome name="check-circle" size={24} color={Palette.primary.contrastText} />
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Fortsätt"
                    onPress={handleContinue}
                    disabled={!selectedPlan}
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
        backgroundColor: Palette.background.paper,
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
        paddingBottom: 100,
    },
    card: {
        backgroundColor: Palette.background.paper,
        borderRadius: BorderRadius.l,
        padding: Spacing.l,
        marginBottom: Spacing.m,
        borderWidth: 2,
        borderColor: 'transparent',
        ...Shadows.small,
    },
    selectedCard: {
        borderColor: Palette.primary.main,
        backgroundColor: Palette.primary.main, // Full fill for selected
    },
    recommendedCard: {
        borderColor: Palette.accent.main,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.s,
    },
    planTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    price: {
        fontSize: Typography.size.xl,
        fontWeight: 'bold',
        color: Palette.primary.main,
        marginBottom: Spacing.s,
    },
    bonus: {
        fontSize: Typography.size.s,
        fontWeight: '600',
        color: Palette.accent.main,
    },
    desc: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        lineHeight: 20,
    },
    selectedText: {
        color: '#FFF',
    },
    badge: {
        backgroundColor: Palette.accent.main,
        paddingHorizontal: Spacing.s,
        paddingVertical: 2,
        borderRadius: BorderRadius.round,
    },
    badgeText: {
        color: '#FFF',
        fontSize: Typography.size.xs,
        fontWeight: 'bold',
    },
    checkIcon: {
        position: 'absolute',
        top: Spacing.l,
        right: Spacing.l,
    },
    footer: {
        padding: Spacing.m,
        backgroundColor: Palette.background.paper,
        borderTopWidth: 1,
        borderTopColor: Palette.border.default,
    },
});
