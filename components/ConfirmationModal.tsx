import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
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
                                        color={isDestructive ? Palette.status.error : Palette.primary.main}
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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.l,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.l,
        padding: Spacing.l,
        ...Shadows.medium,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.m,
    },
    destructiveIconBackground: {
        backgroundColor: '#FCECEC',
    },
    headerTitle: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
        textAlign: 'center',
    },
    messageText: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        textAlign: 'center',
        marginBottom: Spacing.l,
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: Spacing.m,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: BorderRadius.m,
    },
    cancelText: {
        color: Palette.text.primary,
        fontWeight: '600',
        fontSize: Typography.size.s,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: Palette.primary.main,
        borderRadius: BorderRadius.m,
    },
    destructiveButton: {
        backgroundColor: Palette.status.error,
    },
    singleConfirmButton: {
        backgroundColor: Palette.primary.main,
    },
    confirmText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: Typography.size.s,
    },
    singleConfirmText: {
        color: '#FFF',
    },
});
