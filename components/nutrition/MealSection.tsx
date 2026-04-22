import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Alert, Platform } from 'react-native';
import { useTheme } from '@/constants/DesignSystem';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FoodLogEntry } from '@/types';

interface MealSectionProps {
    title: string;
    icon: React.ComponentProps<typeof FontAwesome>['name'];
    entries: FoodLogEntry[];
    targetCalories: number;
    onAddPress: () => void;
    onEntryPress: (entry: FoodLogEntry) => void;
    onDeleteEntry?: (entry: FoodLogEntry) => void;
}

function SwipeableEntry({
    entry,
    isLast,
    onPress,
    onDelete,
}: {
    entry: FoodLogEntry;
    isLast: boolean;
    onPress: () => void;
    onDelete: () => void;
}) {
    const { palette, spacing } = useTheme();
    const translateX = useRef(new Animated.Value(0)).current;
    const [swiped, setSwiped] = useState(false);
    const [hovered, setHovered] = useState(false);
    const SWIPE_THRESHOLD = -72;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 && Math.abs(g.dy) < 20,
            onPanResponderMove: (_, g) => {
                if (g.dx < 0) translateX.setValue(Math.max(g.dx, SWIPE_THRESHOLD - 4));
            },
            onPanResponderRelease: (_, g) => {
                if (g.dx < SWIPE_THRESHOLD / 2) {
                    Animated.spring(translateX, { toValue: SWIPE_THRESHOLD, useNativeDriver: true }).start();
                    setSwiped(true);
                } else {
                    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
                    setSwiped(false);
                }
            },
        })
    ).current;

    const closeSwipe = () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        setSwiped(false);
    };

    // On web/desktop: show a trash icon button that appears on hover
    if (Platform.OS === 'web') {
        return (
            <View
                style={[
                    styles.entryItem,
                    {
                        borderBottomColor: palette.border.default,
                        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                        backgroundColor: hovered ? palette.background.default : palette.background.paper,
                    },
                ]}
                // @ts-ignore - web-only props
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <View style={{ flex: 1 }}>
                    <Text style={[styles.entryName, { color: palette.text.primary }]}>{entry.foodName}</Text>
                    <Text style={[styles.entryAmount, { color: palette.text.secondary }]}>
                        {entry.amountConsumed} {entry.servingUnit}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={[styles.entryCalories, { color: palette.text.primary }]}>{Math.round(entry.calories)} kcal</Text>
                    <TouchableOpacity
                        onPress={onDelete}
                        style={[styles.deleteBtn, { backgroundColor: hovered ? palette.status.error : palette.background.default, borderWidth: 1, borderColor: hovered ? palette.status.error : palette.border.default }]}
                    >
                        <FontAwesome name="trash" size={13} color={hovered ? '#fff' : palette.text.disabled} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // On mobile: swipe to reveal delete
    return (
        <View style={{ overflow: 'hidden' }}>
            {/* Delete background */}
            <View style={[styles.deleteBackground, { backgroundColor: palette.status.error }]}>
                <FontAwesome name="trash" size={20} color="#fff" />
            </View>

            {/* Swipeable row */}
            <Animated.View
                style={{ transform: [{ translateX }] }}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                        if (swiped) { closeSwipe(); return; }
                        onPress();
                    }}
                    style={[
                        styles.entryItem,
                        {
                            borderBottomColor: palette.border.default,
                            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                            backgroundColor: palette.background.paper,
                        },
                    ]}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.entryName, { color: palette.text.primary }]}>{entry.foodName}</Text>
                        <Text style={[styles.entryAmount, { color: palette.text.secondary }]}>
                            {entry.amountConsumed} {entry.servingUnit}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Text style={[styles.entryCalories, { color: palette.text.primary }]}>{Math.round(entry.calories)} kcal</Text>
                        {swiped ? (
                            <TouchableOpacity
                                onPress={onDelete}
                                style={[styles.deleteBtn, { backgroundColor: palette.status.error }]}
                            >
                                <FontAwesome name="trash" size={14} color="#fff" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

export default function MealSection({ title, icon, entries, targetCalories, onAddPress, onEntryPress, onDeleteEntry }: MealSectionProps) {
    const { palette, spacing, borderRadius } = useTheme();

    const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
    const progress = Math.min(totalCalories / targetCalories, 1) || 0;
    const progressColor = totalCalories > targetCalories ? palette.status.error : palette.primary.main;

    const handleDelete = (entry: FoodLogEntry) => {
        if (Platform.OS === 'web') {
            // @ts-ignore
            if (window.confirm(`Ta bort "${entry.foodName}"?`)) {
                onDeleteEntry?.(entry);
            }
            return;
        }
        Alert.alert(
            'Ta bort',
            `Vill du ta bort "${entry.foodName}"?`,
            [
                { text: 'Avbryt', style: 'cancel' },
                { text: 'Ta bort', style: 'destructive', onPress: () => onDeleteEntry?.(entry) },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: palette.background.paper, borderRadius: borderRadius.m, padding: spacing.m }]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: palette.background.default }]}>
                        <FontAwesome name={icon} size={20} color={palette.text.secondary} />
                    </View>
                    <View>
                        <Text style={[styles.title, { color: palette.text.primary }]}>{title}</Text>
                        <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
                            {Math.round(totalCalories)} / {targetCalories} kcal
                        </Text>
                    </View>
                </View>

                <TouchableOpacity onPress={onAddPress} style={[styles.addButton, { backgroundColor: palette.primary.main }]}>
                    <FontAwesome name="plus" size={16} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: palette.background.default, marginTop: spacing.s }]}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: progressColor }]} />
            </View>

            {entries.length > 0 && (
                <View style={[styles.entryList, { marginTop: spacing.s }]}>
                    {entries.map((entry, index) => (
                        <SwipeableEntry
                            key={entry.id || index.toString()}
                            entry={entry}
                            isLast={index === entries.length - 1}
                            onPress={() => onEntryPress(entry)}
                            onDelete={() => handleDelete(entry)}
                        />
                    ))}
                </View>
            )}

            {entries.length === 0 && (
                <Text style={[styles.emptyText, { color: palette.text.disabled }]}>
                    Tryck på + för att logga mat
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    entryList: {
        paddingTop: 8,
    },
    entryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    deleteBackground: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 72,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    entryName: {
        fontSize: 14,
        fontWeight: '500',
    },
    entryAmount: {
        fontSize: 12,
        marginTop: 2,
    },
    entryCalories: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyText: {
        fontSize: 13,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 12,
    },
});
