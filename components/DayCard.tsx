import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler'; // Ensure this matches platform

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
    showDragHandle,
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
                    <Ionicons name="leaf-outline" size={16} color={Palette.text.secondary} style={{ marginRight: 8 }} />
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                                    {status === 'completed' && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color={Palette.primary.main}
                                            style={{ marginLeft: 6 }}
                                        />
                                    )}
                                </View>
                                {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
                                <View style={styles.chipContainer}>
                                    <Text style={[styles.caption, { color: accentColor }]}>
                                        {String(type).charAt(0).toUpperCase() + String(type).slice(1)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Right Action Area: Menu OR Drag Handle */}
                    {showDragHandle ? (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onLongPress={onLongPress} // Trigger drag on hold
                            delayLongPress={100} // Faster response
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="reorder-two-outline" size={24} color={Palette.text.disabled} />
                        </TouchableOpacity>
                    ) : (
                        onMenuPress && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={onMenuPress}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="ellipsis-vertical" size={20} color={Palette.text.secondary} />
                            </TouchableOpacity>
                        )
                    )}
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
        // ...Shadows.small, // Removed shadow for cleaner Google-style flat look with border
        borderWidth: 1,
        borderColor: Palette.border.default,
        flexDirection: 'row', // Main Flex Layout
        alignItems: 'stretch', // Stretch vertically to match height
        overflow: 'hidden',
        minHeight: 76, // Ensure good touch area
    },
    // Left Accent Border
    accentStrip: {
        width: 4, // Slimmer accent strip
        height: '100%',
    },
    // Content Area
    contentContainer: {
        flex: 1, // Takes all available space
        paddingVertical: Spacing.m, // More airy padding
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
        fontWeight: 'bold', // Stronger title
        color: Palette.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        marginBottom: 4,
    },
    chipContainer: {
        alignSelf: 'flex-start',
        backgroundColor: '#F5F5F5',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 4,
    },
    caption: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: 'bold',
    },

    // Rest Day
    restCard: {
        backgroundColor: '#F9FAFB', // Very subtle grey
        borderRadius: BorderRadius.m,
        padding: Spacing.s,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderWidth: 1,
        borderColor: '#EEE', // Subtle border
        borderStyle: 'dashed', // Dashed border for Rest
    },
    restText: {
        color: Palette.text.secondary,
        fontStyle: 'italic',
        fontSize: Typography.size.s,
        fontWeight: '500',
    },

    // Status Styles
    completedBorder: {
        borderWidth: 1,
        borderColor: Palette.primary.main,
        backgroundColor: '#F0FFF4', // Slight green tint
    },
});
