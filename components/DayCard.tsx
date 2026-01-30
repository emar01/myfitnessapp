import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

export type DayCardType =
    | 'distans' | 'långpass' | 'intervall'
    | 'crossfit' | 'styrka' | 'rörlighet'
    | 'rest';

export type DayCardStatus = 'completed' | 'pending' | 'skipped';

interface DayCardProps {
    day: string; // Kept for interface compatibility, but might be hidden
    date: string;
    title?: string;
    subtitle?: string;
    type: DayCardType | string;
    status?: DayCardStatus;
    onPress?: () => void;
    onLongPress?: () => void;
    showDragHandle?: boolean;
    isToday?: boolean;
    onMenuPress?: () => void;
}

export default function DayCard({
    day,
    date,
    title,
    subtitle,
    type,
    status,
    onPress,
    onLongPress,
    onMenuPress,
}: DayCardProps) {

    const isRest = type === 'rest';

    // Highlight color based on workout type
    const getAccentColor = () => {
        switch (type) {
            // Running
            case 'distans': return Palette.primary.main;
            case 'långpass': return '#2196F3';
            case 'intervall': return '#F44336';

            // Strength
            case 'crossfit': return '#FF9800';
            case 'styrka': return '#9C27B0'; // Purple
            case 'rörlighet': return '#009688'; // Teal

            case 'rest': return Palette.text.disabled;
            default: return Palette.text.disabled;
        }
    };

    const accentColor = getAccentColor();

    return (
        <View style={styles.container}>
            {isRest ? (
                <View style={styles.restCard}>
                    <FontAwesome name="leaf" size={16} color={Palette.text.secondary} style={{ marginRight: 8 }} />
                    <Text style={styles.restText}>Vilodag</Text>
                </View>
            ) : (
                <View style={[
                    styles.cardContainer,
                    status === 'completed' && styles.completedBorder,
                ]}>
                    <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

                    <TouchableOpacity
                        style={styles.contentContainer}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                        {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
                        {/* If we wanted to show specific tags or small text, we could do it here */}
                        <Text style={styles.caption}>{String(type).charAt(0).toUpperCase() + String(type).slice(1)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onMenuPress}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <FontAwesome name="ellipsis-v" size={16} color={Palette.text.secondary} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.s,
    },
    // Main Card
    cardContainer: {
        backgroundColor: Palette.background.paper,
        borderRadius: BorderRadius.m,
        ...Shadows.small,
        flexDirection: 'row', // Main Flex Layout
        alignItems: 'stretch', // Stretch vertically to match height
        overflow: 'hidden',
        minHeight: 70, // Ensure good touch area
    },
    // Left Accent Border
    accentStrip: {
        width: 6, // Robust solid visible strip
        height: '100%',
    },
    // Content Area
    contentContainer: {
        flex: 1, // Takes all available space
        paddingVertical: Spacing.s,
        paddingHorizontal: Spacing.m,
        justifyContent: 'center',
    },
    // Right Action Area
    actionButton: {
        width: 48, // Fixed width for reliability
        justifyContent: 'center',
        alignItems: 'center',
        // No absolute positioning needed!
    },

    // Typography
    title: {
        fontSize: Typography.size.m, // Slightly larger for better read
        fontWeight: '600',
        color: Palette.text.primary,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        marginBottom: 2,
    },
    caption: {
        fontSize: Typography.size.xs,
        color: Palette.text.disabled,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '600',
        marginTop: 2,
    },

    // Rest Day
    restCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: BorderRadius.m,
        padding: Spacing.s,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
    },
    restText: {
        color: Palette.text.secondary,
        fontStyle: 'italic',
        fontSize: Typography.size.s,
    },

    // Status Styles
    completedBorder: {
        borderWidth: 1,
        borderColor: Palette.primary.main,
    },
});
