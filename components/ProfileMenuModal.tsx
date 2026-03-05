import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface ProfileMenuModalProps {
    visible: boolean;
    onClose: () => void;
    onProfile: () => void;
    onLogout: () => void;
    userEmail?: string | null;
}

export default function ProfileMenuModal({ visible, onClose, onProfile, onLogout, userEmail }: ProfileMenuModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>Konto</Text>
                                <Text style={styles.userEmail}>{userEmail}</Text>
                            </View>

                            <TouchableOpacity style={styles.menuItem} onPress={onProfile}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="person" size={20} color={Palette.primary.main} />
                                </View>
                                <Text style={styles.menuText}>Min Profil</Text>
                                <Ionicons name="chevron-forward" size={16} color={Palette.text.disabled} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="log-out" size={20} color={Palette.status.error} />
                                </View>
                                <Text style={[styles.menuText, { color: Palette.status.error }]}>Logga ut</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelText}>Avbryt</Text>
                            </TouchableOpacity>
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
        maxWidth: 320,
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.l,
        padding: Spacing.m,
        ...Shadows.medium,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.m,
        paddingBottom: Spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: Spacing.s,
    },
    iconContainer: {
        width: 32,
        alignItems: 'center',
        marginRight: 12,
    },
    menuText: {
        fontSize: Typography.size.m,
        color: Palette.text.primary,
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: 4,
    },
    cancelButton: {
        marginTop: Spacing.m,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: BorderRadius.m,
    },
    cancelText: {
        color: Palette.text.primary,
        fontWeight: '600',
    },
    confirmText: {
        fontSize: Typography.size.m,
        color: Palette.text.primary,
        marginBottom: Spacing.m,
        textAlign: 'center',
    },
    confirmRow: {
        flexDirection: 'row',
        gap: Spacing.m,
        justifyContent: 'center',
    },
    cancelButtonAuth: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        borderRadius: BorderRadius.m,
    },
    logoutButtonAuth: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#FCECEC',
        borderRadius: BorderRadius.m,
    },
    logoutText: {
        color: Palette.status.error,
        fontWeight: 'bold',
    },
});
