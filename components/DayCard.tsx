import { useTheme } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Removed react-native-gesture-handler TouchableOpacity for better web/desktop compatibility

export type DayCardType =
    | 'distans' | 'långpass' | 'intervall'
    | 'crossfit' | 'styrka' | 'rörlighet'
    | 'rest' | 'öövrigt';

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
    onDeletePress?: () => void;
    onToggleComplete?: () => void;
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
    onDeletePress,
    onToggleComplete,
    showDragHandle,
}: DayCardProps) {
    const { palette, spacing, borderRadius, typography, isDark } = useTheme();
    const styles = getStyles(palette, spacing, borderRadius, typography, isDark);

    const isRest = type === 'rest';

    // Highlight color based on workout type
        const getAccentColor = () => {
        switch (type) {
            case 'distans': return palette.workouts.distans;
            case 'l�ngpass': return palette.workouts.langpass;
            case 'intervall': return palette.workouts.intervall;
            case 'crossfit': return palette.workouts.crossfit;
            case 'styrka': return palette.workouts.styrka;
            case 'r�rlighet': return palette.workouts.rorligheten;
            case 'rest': return palette.text.disabled;
            case '�övrigt': return palette.text.secondary;
            default: return palette.text.disabled;
        }
    };

    const accentColor = getAccentColor();

    return (
        <View style={styles.container}>
            {type === 'rest' ? (
                <View style={styles.restCard}>
                    <Ionicons name="leaf-outline" size={16} color={palette.text.secondary} style={{ marginRight: 8 }} />
                    <Text style={styles.restText}>Vilodag</Text>
                </View>
            ) : (
                <View style={[
                    styles.cardContainer,
                    status === 'completed' && styles.completedBorder,
                ]}>
                    <TouchableOpacity
                        style={styles.mainActionArea}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />
                        <View style={styles.contentContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                                        {status === 'completed' && (
                                            <TouchableOpacity
                                                onPress={onToggleComplete}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={22}
                                                    color={palette.primary.main}
                                                    style={{ marginLeft: 6 }}
                                                />
                                            </TouchableOpacity>
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
                            <Ionicons name="reorder-two-outline" size={24} color={palette.text.disabled} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {onMenuPress && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={onMenuPress}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="ellipsis-vertical" size={20} color={palette.text.secondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const getStyles = (palette: any, spacing: any, borderRadius: any, typography: any, isDark: boolean) => StyleSheet.create({
    container: {
        marginBottom: spacing.s,
    },
    // Main Card
    cardContainer: {
        backgroundColor: palette.background.paper,
        borderRadius: borderRadius.m,
        // ...shadows.small, // Removed shadow for cleaner Google-style flat look with border
        borderWidth: 1,
        borderColor: palette.border.default,
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
    mainActionArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    contentContainer: {
        flex: 1, // Takes all available space
        paddingVertical: spacing.m, // More airy padding
        paddingHorizontal: spacing.m,
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
        fontSize: typography.size.m, // Slightly larger for better read
        fontWeight: 'bold', // Stronger title
        color: palette.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: typography.size.s,
        color: palette.text.secondary,
        marginBottom: 4,
    },
    chipContainer: {
        alignSelf: 'flex-start',
        backgroundColor: isDark ? '#2C2C2C' : '#F5F5F5',
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
        backgroundColor: isDark ? '#1E1E1E' : '#F9FAFB',
        borderRadius: borderRadius.m,
        padding: spacing.s,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderWidth: 1,
        borderColor: isDark ? '#333' : '#EEE',
        borderStyle: 'dashed',
    },
    restText: {
        color: palette.text.secondary,
        fontStyle: 'italic',
        fontSize: typography.size.s,
        fontWeight: '500',
    },

    // Status Styles
    completedBorder: {
        borderWidth: 1,
        borderColor: palette.primary.main,
        backgroundColor: isDark ? '#0F2C21' : '#F0FFF4',
    },
});
