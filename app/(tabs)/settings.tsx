import { useTheme } from '@/constants/DesignSystem';
import { useAlert } from '@/context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useSession } from '@/context/ctx';

export default function SettingsScreen() {
    const { palette, spacing, borderRadius, typography, shadows, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows, isDark);
    const router = useRouter();
    const { signOut } = useSession();
    const { showConfirm } = useAlert();

    const sections = [
        {
            title: 'Content Management',
            items: [
                { label: 'Manage Exercises', icon: 'barbell', route: '/settings/exercises' },
                { label: 'Manage Programs', icon: 'list', route: '/settings/programs' },
                { label: 'Manage Workouts', icon: 'fitness', route: '/settings/workouts' },
            ]
        },
        // Account section
        {
            title: 'Account',
            items: [
                { label: 'Profile', icon: 'person', route: '/settings/profile' },
                { label: 'Log Out', icon: 'log-out', route: 'logout' },
            ]
        }
    ];

    const handlePress = async (item: any) => {
        if (item.route === 'logout') {
            const confirmed = await showConfirm(
                'Logga ut',
                'Är du säker på att du vill logga ut?',
                { confirmText: 'Logga ut', cancelText: 'Avbryt', isDestructive: true }
            );
            if (confirmed) {
                signOut();
            }
        } else {
            router.push(item.route);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.sectionBox}>
                            {section.items.map((item, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        styles.row,
                                        idx === section.items.length - 1 && styles.rowLast // Remove border for last item
                                    ]}
                                    onPress={() => handlePress(item)}
                                >
                                    <View style={styles.rowLeft}>
                                        <View style={styles.iconContainer}>
                                            <Ionicons name={item.icon as any} size={20} color={palette.primary.main} />
                                        </View>
                                        <Text style={styles.rowLabel}>{item.label}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={palette.text.disabled} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView >
    );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background.default,
    },
    header: {
        padding: spacing.m,
        backgroundColor: palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: palette.border.default,
    },
    headerTitle: {
        fontSize: typography.size.l,
        fontWeight: 'bold',
        color: palette.text.primary,
    },
    content: {
        padding: spacing.m,
    },
    section: {
        marginBottom: spacing.l,
    },
    sectionTitle: {
        fontSize: typography.size.s,
        fontWeight: '600',
        color: palette.text.secondary,
        marginBottom: spacing.s,
        marginLeft: spacing.s,
        textTransform: 'uppercase',
    },
    sectionBox: {
        backgroundColor: palette.background.paper,
        borderRadius: 12,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: spacing.m,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: palette.border.default,
    },
    rowLast: {
        borderBottomWidth: 0,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        alignItems: 'center',
        marginRight: 12,
    },
    rowLabel: {
        fontSize: typography.size.m,
        color: palette.text.primary,
    },
});
