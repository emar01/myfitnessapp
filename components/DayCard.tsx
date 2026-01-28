import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type DayCardType =
    | 'distans' | 'långpass' | 'intervall'
    | 'crossfit' | 'styrka' | 'rörlighet'
    | 'rest';


export type DayCardStatus = 'completed' | 'pending' | 'skipped';

interface DayCardProps {
    day: string;
    date: string;
    title?: string;
    subtitle?: string;
    type: DayCardType | string; // Allow string for flexibility
    status?: DayCardStatus;
    onPress?: () => void;
    onLongPress?: () => void;
    showDragHandle?: boolean;
    isToday?: boolean;
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
    showDragHandle,
    isToday,
}: DayCardProps) {

    const isRest = type === 'rest';

    // Tag Color based on workout type
    const getTagColor = () => {
        switch (type) {
            // Running
            case 'distans': return Palette.primary.main; // Green (Default)
            case 'långpass': return '#2196F3'; // Blue
            case 'intervall': return '#F44336'; // Red

            // Strength
            case 'crossfit': return '#FF9800'; // Orange
            case 'styrka': return '#9C27B0'; // Purple
            case 'rörlighet': return '#009688'; // Teal

            case 'rest': return Palette.text.disabled;
            default: return Palette.text.disabled;
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.dayLabel}>{day}</Text>

            {isRest ? (
                <View style={styles.restCard}>
                    <FontAwesome name="leaf" size={16} color={Palette.text.secondary} style={{ marginRight: 8 }} />
                    <Text style={styles.restText}>Vilodag</Text>
                </View>
            ) : (
                <View
                    style={[
                        styles.workoutCard,
                        status === 'completed' && styles.completedBorder
                    ]}
                >
                    <TouchableOpacity
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                        onPress={onPress}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.typeTag, { backgroundColor: getTagColor() }]}>
                            <Text style={styles.typeTagText}>
                                {String(type).charAt(0).toUpperCase() + String(type).slice(1)}
                            </Text>
                        </View>

                        <View style={styles.content}>
                            <Text style={styles.dateText}>{day} {date}</Text>
                            {title && <Text style={styles.titleText}>{title}</Text>}
                            {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
                        </View>

                        {status === 'completed' && (
                            <View style={styles.checkIcon}>
                                <FontAwesome name="check-circle" size={24} color={Palette.primary.main} />
                            </View>
                        )}
                    </TouchableOpacity>

                    {showDragHandle ? (
                        <TouchableOpacity
                            style={styles.dragHandle}
                            onPressIn={onLongPress}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <FontAwesome name="bars" size={20} color={Palette.text.disabled} />
                        </TouchableOpacity>
                    ) : (
                        !status && (
                            <View style={{ marginRight: 12 }}>
                                <FontAwesome name="chevron-right" size={14} color={Palette.text.disabled} />
                            </View>
                        )
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.m,
    },
    dayLabel: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        marginBottom: Spacing.s,
        marginLeft: Spacing.xs,
    },
    workoutCard: {
        backgroundColor: Palette.background.paper,
        borderRadius: BorderRadius.m,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0, // Removed padding to allow full touch areas
        ...Shadows.small,
        overflow: 'hidden',
        position: 'relative',
        height: 80,
    },
    dragHandle: {
        padding: Spacing.m,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: 1,
        borderLeftColor: Palette.border.default,
        backgroundColor: '#F9FAFB',
    },
    completedBorder: {
        borderWidth: 1,
        borderColor: Palette.primary.main,
    },
    restCard: {
        backgroundColor: '#F5F5F5', // Lighter grey for rest
        borderRadius: BorderRadius.round,
        paddingVertical: Spacing.s,
        paddingHorizontal: Spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        alignSelf: 'flex-start',
        width: '100%',
    },
    restText: {
        color: Palette.text.secondary,
        fontSize: Typography.size.s,
        fontStyle: 'italic',
    },
    typeTag: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeTagText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        transform: [{ rotate: '-90deg' }],
        width: 80, // Ensure enough width for text before rotation
        textAlign: 'center',
    },
    content: {
        flex: 1,
        marginLeft: 20 + Spacing.m, // Space for tag + padding
        paddingVertical: Spacing.m,
    },
    dateText: {
        fontSize: Typography.size.xs,
        color: Palette.text.primary,
        fontWeight: '600',
        marginBottom: 2,
    },
    titleText: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
    subtitleText: {
        fontSize: Typography.size.xs,
        color: Palette.text.disabled,
    },
    checkIcon: {
        marginLeft: Spacing.s,
    },
});
