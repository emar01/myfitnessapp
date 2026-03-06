import { useTheme } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    singleButton?: boolean;
}

export default function ConfirmationModal({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Ta bort',
    cancelText = 'Avbryt',
    isDestructive = true,
    singleButton = false,
}: ConfirmationModalProps) {
    const { palette, spacing, borderRadius, typography, shadows, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows, isDark);
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <TouchableWithoutFeedback onPress={onCancel}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.header}>
                                <View style={[styles.iconContainer, isDestructive && styles.destructiveIconBackground]}>
                                    <Ionicons
                                        name={isDestructive ? "trash-outline" : "alert-circle-outline"}
                                        size={24}
                                        color={isDestructive ? palette.status.error : palette.primary.main}
                                    />
                                </View>
                                <Text style={styles.headerTitle}>{title}</Text>
                            </View>

                            <Text style={styles.messageText}>{message}</Text>

                            <View style={styles.buttonRow}>
                                {!singleButton && (
                                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                                        <Text style={styles.cancelText}>{cancelText}</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.confirmButton,
                                        isDestructive && !singleButton && styles.destructiveButton,
                                        singleButton && styles.singleConfirmButton,
                                    ]}
                                    onPress={onConfirm}
                                >
                                    <Text style={[styles.confirmText, singleButton && styles.singleConfirmText]}>{confirmText}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, isDark: boolean) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.l,
        zIndex: 1000, // Ensure it's above other modals
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.l,
        padding: spacing.l,
        ...shadows.medium,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: isDark ? '#2C2C2C' : '#F5F5F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.m,
    },
    destructiveIconBackground: {
        backgroundColor: isDark ? '#3D1B1B' : '#FCECEC',
    },
    headerTitle: {
        fontSize: typography.size.m,
        fontWeight: 'bold',
        color: palette.text.primary,
        textAlign: 'center',
    },
    messageText: {
        fontSize: typography.size.s,
        color: palette.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.l,
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: isDark ? '#2C2C2C' : '#F5F5F7',
        borderRadius: borderRadius.m,
    },
    cancelText: {
        color: palette.text.primary,
        fontWeight: '600',
        fontSize: typography.size.s,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: palette.primary.main,
        borderRadius: borderRadius.m,
    },
    destructiveButton: {
        backgroundColor: palette.status.error,
    },
    singleConfirmButton: {
        backgroundColor: palette.primary.main,
    },
    confirmText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: typography.size.s,
    },
    singleConfirmText: {
        color: '#FFF',
    },
});
