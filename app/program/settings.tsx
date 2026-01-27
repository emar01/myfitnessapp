import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function ProgramSettingsScreen() {
    const router = useRouter();
    const [includeStrength, setIncludeStrength] = useState(true);
    const [raceFocus, setRaceFocus] = useState(false);
    const [notifications, setNotifications] = useState(true);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: Spacing.s }}>
                    <FontAwesome name="chevron-left" size={20} color={Palette.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Programinställningar</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Träningsupplägg</Text>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Inkludera Styrka</Text>
                            <Text style={styles.sublabel}>Lägger till 1-2 styrkepass i veckan</Text>
                        </View>
                        <Switch
                            value={includeStrength}
                            onValueChange={setIncludeStrength}
                            trackColor={{ true: Palette.primary.main, false: '#ccc' }}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Loppfokus</Text>
                            <Text style={styles.sublabel}>Anpassa programmet för tävling</Text>
                        </View>
                        <Switch
                            value={raceFocus}
                            onValueChange={setRaceFocus}
                            trackColor={{ true: Palette.primary.main, false: '#ccc' }}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notiser</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Påminnelser</Text>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ true: Palette.primary.main, false: '#ccc' }}
                        />
                    </View>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Palette.background.default,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.m,
        backgroundColor: Palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
    },
    headerTitle: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    content: {
        padding: Spacing.m,
    },
    section: {
        marginBottom: Spacing.l,
        backgroundColor: Palette.background.paper,
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
    },
    sectionTitle: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        fontWeight: '600',
        marginBottom: Spacing.m,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.s,
    },
    label: {
        fontSize: Typography.size.m,
        color: Palette.text.primary,
        fontWeight: '500',
    },
    sublabel: {
        fontSize: Typography.size.xs,
        color: Palette.text.secondary,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: Palette.border.default,
        marginVertical: Spacing.s,
    }
});
