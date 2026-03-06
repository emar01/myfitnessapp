import { useTheme } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DesktopSidebar() {
    const { palette, spacing, borderRadius, typography, shadows, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, shadows, isDark);
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
                    color={active ? palette.primary.main : palette.text.secondary}
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
                <NavItem label="Statistik" icon="stats-chart" route="/stats" />
                <NavItem label="Bibliotek" icon="book" route="/library" />
                <NavItem label="Kalender" icon="calendar" route="/calendar" />
                <NavItem label="Coach" icon="flash" route="/coach" />
                <NavItem label="Inställningar" icon="settings" route="/settings" />
            </View>
        </View>
    );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, shadows: any, isDark: boolean) => StyleSheet.create({
    sidebar: {
        width: 250,
        backgroundColor: palette.background.paper,
        borderRightWidth: 1,
        borderRightColor: palette.border.default,
        padding: spacing.l,
        height: '100%',
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: palette.primary.main,
        marginBottom: spacing.xl,
    },
    navLinks: {},
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.m,
        borderRadius: borderRadius.m,
        marginBottom: spacing.s,
    },
    navItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.m,
        borderRadius: borderRadius.m,
        marginBottom: spacing.s,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F0F9FF', // Subtle tint for dark, light blue for light
    },
    navText: {
        fontSize: 16,
        color: palette.text.secondary,
        fontWeight: '500',
    },
    navTextActive: {
        fontSize: 16,
        color: palette.primary.main,
        fontWeight: 'bold',
    },
});
