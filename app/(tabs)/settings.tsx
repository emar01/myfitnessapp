import { Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
    const router = useRouter();

    const sections = [
        {
            title: 'Content Management',
            items: [
                { label: 'Manage Exercises', icon: 'barbell', route: '/settings/exercises' },
                { label: 'Manage Programs', icon: 'list', route: '/settings/programs' },
                { label: 'Manage Workouts', icon: 'fitness', route: '/settings/workouts' },
            ]
        },
        // Account section placeholder
        {
            title: 'Account',
            items: [
                { label: 'Profile', icon: 'person', route: '/profile' }, // Placeholder
                { label: 'Log Out', icon: 'log-out', route: '/logout' }, // Placeholder
            ]
        }
    ];

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
                                    onPress={() => item.route !== '/logout' ? router.push(item.route) : alert('Log out not implemented')}
                                >
                                    <View style={styles.rowLeft}>
                                        <View style={styles.iconContainer}>
                                            <Ionicons name={item.icon as any} size={20} color={Palette.primary.main} />
                                        </View>
                                        <Text style={styles.rowLabel}>{item.label}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={Palette.text.disabled} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        padding: Spacing.m,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    content: {
        padding: Spacing.m,
    },
    section: {
        marginBottom: Spacing.l,
    },
    sectionTitle: {
        fontSize: Typography.size.s,
        fontWeight: '600',
        color: Palette.text.secondary,
        marginBottom: Spacing.s,
        marginLeft: Spacing.s,
        textTransform: 'uppercase',
    },
    sectionBox: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: Spacing.m,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EEE',
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
        fontSize: Typography.size.m,
        color: Palette.text.primary,
    },
});
