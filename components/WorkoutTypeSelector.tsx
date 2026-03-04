import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

interface WorkoutTypeSelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelectType: (type: 'styrketräning' | 'löpning' | 'template' | 'custom' | 'strava') => void;
}

export default function WorkoutTypeSelector({ visible, onClose, onSelectType }: WorkoutTypeSelectorProps) {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768; // Web Desktop breakpoint

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={[styles.overlay, isDesktop && { justifyContent: 'center' }]}>
                {/* Backdrop touch to close */}
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <View style={[styles.modalContent, isDesktop && styles.modalContentDesktop]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Starta Pass</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Stäng">
                            <Ionicons name="close" size={24} color={Palette.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>Vad vill du träna idag?</Text>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => onSelectType('styrketräning')}
                            accessibilityRole="button"
                        >
                            <View style={[styles.iconContainer, { backgroundColor: Palette.primary.main + '20' }]}>
                                <Ionicons name="barbell" size={32} color={Palette.primary.main} />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Styrketräning</Text>
                                <Text style={styles.optionDescription}>Gym, kroppsvikt eller fria vikter</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Palette.text.disabled} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => onSelectType('löpning')}
                            accessibilityRole="button"
                        >
                            <View style={[styles.iconContainer, { backgroundColor: Palette.accent.main + '20' }]}>
                                <Ionicons name="footsteps" size={32} color={Palette.accent.main} />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Löpning</Text>
                                <Text style={styles.optionDescription}>Konditionspass ute eller på rullband</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Palette.text.disabled} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => onSelectType('template')}
                            accessibilityRole="button"
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#FF980020' }]}>
                                <Ionicons name="library" size={32} color="#FF9800" />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Välj från bibliotek</Text>
                                <Text style={styles.optionDescription}>Använd en sparad mall</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Palette.text.disabled} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => onSelectType('strava')}
                            accessibilityRole="button"
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#FC4C0220' }]}>
                                <Ionicons name="flash" size={32} color="#FC4C02" />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Hämta från Strava</Text>
                                <Text style={styles.optionDescription}>Logga ett pass du redan kört</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Palette.text.disabled} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => onSelectType('custom')}
                            accessibilityRole="button"
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#4CAF5020' }]}>
                                <Ionicons name="create" size={32} color="#4CAF50" />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Skapa eget pass</Text>
                                <Text style={styles.optionDescription}>Planera ett helt nytt pass</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Palette.text.disabled} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end', // Slide up from bottom on mobile
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        backgroundColor: Palette.background.paper,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.xl,
        paddingBottom: Spacing.xxl, // Extra padding for safe area
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center', // Center on desktop
        ...Shadows.large,
    },
    modalContentDesktop: {
        borderRadius: BorderRadius.xl, // full border radius on desktop
        paddingBottom: Spacing.xl, // no extra padding for safe area needed
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    title: {
        fontSize: Typography.size.xl,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    closeButton: {
        padding: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.size.m,
        color: Palette.text.secondary,
        marginBottom: Spacing.xl,
    },
    optionsContainer: {
        gap: Spacing.m,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.l,
        backgroundColor: Palette.background.default,
        borderRadius: BorderRadius.l,
        borderWidth: 1,
        borderColor: Palette.border.default,
        minHeight: 80, // Accessibility target
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.m,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
});
