import { useTheme } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

interface WorkoutTypeSelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelectType: (type: 'styrketräning' | 'löpning' | 'template' | 'custom' | 'strava') => void;
}

export default function WorkoutTypeSelector({ visible, onClose, onSelectType }: WorkoutTypeSelectorProps) {
    const { palette, spacing, borderRadius, typography, shadows, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows, isDark);
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
                            <Ionicons name="close" size={24} color={palette.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>Vad vill du träna idag?</Text>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => onSelectType('styrketräning')}
                            accessibilityRole="button"
                        >
                            <View style={[styles.iconContainer, { backgroundColor: palette.primary.main + '20' }]}>
                                <Ionicons name="barbell" size={32} color={palette.primary.main} />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Styrketräning</Text>
                                <Text style={styles.optionDescription}>Gym, kroppsvikt eller fria vikter</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={palette.text.disabled} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => onSelectType('löpning')}
                            accessibilityRole="button"
                        >
                            <View style={[styles.iconContainer, { backgroundColor: palette.accent.main + '20' }]}>
                                <Ionicons name="footsteps" size={32} color={palette.accent.main} />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Löpning</Text>
                                <Text style={styles.optionDescription}>Konditionspass ute eller på rullband</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={palette.text.disabled} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => onSelectType('template')}
                            accessibilityRole="button"
                        >
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#FF980030' : '#FF980020' }]}>
                                <Ionicons name="library" size={32} color="#FF9800" />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Välj från bibliotek</Text>
                                <Text style={styles.optionDescription}>Använd en sparad mall</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={palette.text.disabled} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => onSelectType('strava')}
                            accessibilityRole="button"
                        >
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#FC4C0240' : '#FC4C0220' }]}>
                                <Ionicons name="flash" size={32} color="#FC4C02" />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Hämta från Strava</Text>
                                <Text style={styles.optionDescription}>Logga ett pass du redan kört</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={palette.text.disabled} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={() => onSelectType('custom')}
                            accessibilityRole="button"
                        >
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#4CAF5030' : '#4CAF5020' }]}>
                                <Ionicons name="create" size={32} color="#4CAF50" />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Skapa eget pass</Text>
                                <Text style={styles.optionDescription}>Planera ett helt nytt pass</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={palette.text.disabled} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, isDark: boolean) => StyleSheet.create({
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
        backgroundColor: palette.background.paper,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.xl,
        paddingBottom: spacing.xxl, // Extra padding for safe area
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center', // Center on desktop
        ...shadows.large,
    },
    modalContentDesktop: {
        borderRadius: borderRadius.xl, // full border radius on desktop
        paddingBottom: spacing.xl, // no extra padding for safe area needed
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    title: {
        fontSize: typography.size.xl,
        fontWeight: 'bold',
        color: palette.text.primary,
    },
    closeButton: {
        padding: spacing.xs,
    },
    subtitle: {
        fontSize: typography.size.m,
        color: palette.text.secondary,
        marginBottom: spacing.xl,
    },
    optionsContainer: {
        gap: spacing.m,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.l,
        backgroundColor: palette.background.default,
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: palette.border.default,
        minHeight: 80, // Accessibility target
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.m,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: typography.size.l,
        fontWeight: 'bold',
        color: palette.text.primary,
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: typography.size.s,
        color: palette.text.secondary,
    },
});
