import { useTheme } from '@/constants/DesignSystem';
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
    const { palette, spacing, borderRadius, typography, shadows, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows, isDark);
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
                                    <Ionicons name="person" size={20} color={palette.primary.main} />
                                </View>
                                <Text style={styles.menuText}>Min Profil</Text>
                                <Ionicons name="chevron-forward" size={16} color={palette.text.disabled} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="log-out" size={20} color={palette.status.error} />
                                </View>
                                <Text style={[styles.menuText, { color: palette.status.error }]}>Logga ut</Text>
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

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, isDark: boolean) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.l,
    },
    modalContent: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.l,
        padding: spacing.m,
        ...shadows.medium,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.m,
        paddingBottom: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: palette.border.default,
    },
    headerTitle: {
        fontSize: typography.size.m,
        fontWeight: 'bold',
        color: palette.text.primary,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: typography.size.s,
        color: palette.text.secondary,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: spacing.s,
    },
    iconContainer: {
        width: 32,
        alignItems: 'center',
        marginRight: 12,
    },
    menuText: {
        fontSize: typography.size.m,
        color: palette.text.primary,
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: palette.border.default,
        marginVertical: 4,
    },
    cancelButton: {
        marginTop: spacing.m,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: isDark ? '#2C2C2C' : '#F5F5F7',
        borderRadius: borderRadius.m,
    },
    cancelText: {
        color: palette.text.primary,
        fontWeight: '600',
    },
    confirmText: {
        fontSize: typography.size.m,
        color: palette.text.primary,
        marginBottom: spacing.m,
        textAlign: 'center',
    },
    confirmRow: {
        flexDirection: 'row',
        gap: spacing.m,
        justifyContent: 'center',
    },
    cancelButtonAuth: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: isDark ? '#2C2C2C' : '#F5F5F7',
        borderRadius: borderRadius.m,
    },
    logoutButtonAuth: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: isDark ? '#3D1B1B' : '#FCECEC',
        borderRadius: borderRadius.m,
    },
    logoutText: {
        color: palette.status.error,
        fontWeight: 'bold',
    },
});
