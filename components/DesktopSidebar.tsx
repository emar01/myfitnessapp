import { BorderRadius, Palette, Spacing } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DesktopSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/' || path === '/(tabs)') {
            return pathname === '/' || pathname === '/(tabs)' || pathname === '/index';
        }
        return pathname.includes(path);
    };

    const NavItem = ({ label, icon, route, exact = false }: { label: string, icon: any, route: string, exact?: boolean }) => {
        const active = isActive(route);
        return (
            <TouchableOpacity
                style={active ? styles.navItemActive : styles.navItem}
                onPress={() => router.push(route as any)}
            >
                <Ionicons
                    name={icon}
                    size={20}
                    color={active ? Palette.primary.main : Palette.text.secondary}
                    style={{ marginRight: 8 }}
                />
                <Text style={active ? styles.navTextActive : styles.navText}>{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.sidebar}>
            <Text style={styles.logoText}>MyFitness</Text>
            <View style={styles.navLinks}>
                <NavItem label="Översikt" icon="home" route="/(tabs)" />
                <NavItem label="Bibliotek" icon="book" route="/library" />
                <NavItem label="Kalender" icon="calendar" route="/calendar" />
                <NavItem label="Coach" icon="flash" route="/coach" />
                <NavItem label="Inställningar" icon="settings" route="/settings" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    sidebar: {
        width: 250,
        backgroundColor: '#FFF',
        borderRightWidth: 1,
        borderRightColor: Palette.border.default,
        padding: Spacing.l,
        height: '100%',
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Palette.primary.main,
        marginBottom: Spacing.xl,
    },
    navLinks: {},
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.m,
        paddingHorizontal: Spacing.m,
        borderRadius: BorderRadius.m,
        marginBottom: Spacing.s,
    },
    navItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.m,
        paddingHorizontal: Spacing.m,
        borderRadius: BorderRadius.m,
        marginBottom: Spacing.s,
        backgroundColor: '#F0F9FF', // Light blue tint
    },
    navText: {
        fontSize: 16,
        color: Palette.text.secondary,
        fontWeight: '500',
    },
    navTextActive: {
        fontSize: 16,
        color: Palette.primary.main,
        fontWeight: 'bold',
    },
});
