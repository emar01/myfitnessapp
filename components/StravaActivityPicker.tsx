import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { useAlert } from '@/context/AlertContext';
import { useSession } from '@/context/ctx';
import { getStravaActivities, StravaActivity } from '@/services/stravaService';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StravaActivityPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (activity: StravaActivity) => void;
}

const STRAVA_ORANGE = '#FC4C02';

export default function StravaActivityPicker({ visible, onClose, onSelect }: StravaActivityPickerProps) {
    const { user } = useSession();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [activities, setActivities] = useState<StravaActivity[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<StravaActivity | null>(null);

    useEffect(() => {
        if (visible && user) {
            fetchActivities();
        } else if (!visible) {
            setSelectedActivity(null);
        }
    }, [visible, user]);

    const fetchActivities = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getStravaActivities(user.uid, 1, 30);
            setActivities(data || []);
            // Auto-select first if none selected and we have data
            if (data && data.length > 0 && !selectedActivity) {
                // setSelectedActivity(data[0]); // Optional: auto-select first
            }
        } catch (e: any) {
            console.error("Failed to fetch Strava activities:", e);
            if (e.message.includes("No Strava connection")) {
                await showAlert("Koppla Strava", "Du måste koppla ditt Strava-konto under Profil för att hämta pass.");
                onClose();
            } else {
                await showAlert("Fel", "Kunde inte hämta aktiviteter från Strava.");
            }
        } finally {
            setLoading(false);
        }
    };

    const formatPace = (distanceMeters: number, timeSeconds: number) => {
        if (distanceMeters === 0) return '0:00';
        const paceMinPerKm = (timeSeconds / 60) / (distanceMeters / 1000);
        const mins = Math.floor(paceMinPerKm);
        const secs = Math.round((paceMinPerKm - mins) * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}t ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <Ionicons name="flash" size={20} color={STRAVA_ORANGE} />
                        <Text style={styles.title}>Hämta från Strava</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <FontAwesome name="close" size={24} color={Palette.text.primary} />
                    </TouchableOpacity>
                </View>

                {loading && activities.length === 0 ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={STRAVA_ORANGE} />
                        <Text style={styles.loadingText}>Hämtar dina senaste pass...</Text>
                    </View>
                ) : (
                    <View style={{ flex: 1 }}>
                        <View style={[styles.listContainer, selectedActivity ? styles.listContainerCompact : null]}>
                            <FlatList
                                data={activities}
                                horizontal={!!selectedActivity}
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={styles.listContent}
                                renderItem={({ item }) => {
                                    const isSelected = selectedActivity?.id === item.id;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.activityCard,
                                                isSelected && styles.activityCardSelected,
                                                selectedActivity && styles.activityCardCompact
                                            ]}
                                            onPress={() => setSelectedActivity(item)}
                                        >
                                            <View style={styles.cardHeader}>
                                                <Text
                                                    style={[styles.activityName, isSelected && styles.textWhite]}
                                                    numberOfLines={1}
                                                >
                                                    {item.name}
                                                </Text>
                                                {!selectedActivity && (
                                                    <Text style={styles.activityDate}>
                                                        {new Date(item.start_date).toLocaleDateString('sv-SE')}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={styles.activityStatsRow}>
                                                <Text style={[styles.compactStat, isSelected && styles.textWhite]}>
                                                    {(item.distance / 1000).toFixed(1)} km
                                                </Text>
                                                {selectedActivity && isSelected && (
                                                    <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={
                                    !loading ? (
                                        <View style={styles.emptyState}>
                                            <Text style={styles.emptyText}>Inga aktiviteter hittades på Strava.</Text>
                                        </View>
                                    ) : null
                                }
                            />
                        </View>

                        {selectedActivity ? (
                            <ScrollView style={styles.detailsContainer} contentContainerStyle={styles.detailsContent}>
                                <Text style={styles.detailsTitle}>{selectedActivity.name}</Text>
                                <Text style={styles.detailsDate}>
                                    {new Date(selectedActivity.start_date).toLocaleString('sv-SE', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>

                                <View style={styles.mainStatsGrid}>
                                    <View style={styles.mainStatBox}>
                                        <Text style={styles.mainStatLabel}>DISTANS</Text>
                                        <Text style={styles.mainStatValue}>{(selectedActivity.distance / 1000).toFixed(2)}</Text>
                                        <Text style={styles.mainStatUnit}>km</Text>
                                    </View>
                                    <View style={styles.mainStatBox}>
                                        <Text style={styles.mainStatLabel}>TID</Text>
                                        <Text style={styles.mainStatValue}>{Math.floor(selectedActivity.moving_time / 60)}</Text>
                                        <Text style={styles.mainStatUnit}>min</Text>
                                    </View>
                                </View>

                                <View style={styles.secondaryStatsRow}>
                                    <View style={styles.secondaryStatItem}>
                                        <Ionicons name="speedometer-outline" size={20} color={Palette.text.secondary} />
                                        <View>
                                            <Text style={styles.secondaryStatLabel}>Tempo</Text>
                                            <Text style={styles.secondaryStatValue}>
                                                {formatPace(selectedActivity.distance, selectedActivity.moving_time)} /km
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.secondaryStatItem}>
                                        <Ionicons name="trending-up" size={20} color={Palette.text.secondary} />
                                        <View>
                                            <Text style={styles.secondaryStatLabel}>Höjdvinst</Text>
                                            <Text style={styles.secondaryStatValue}>
                                                {Math.round(selectedActivity.total_elevation_gain)} m
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={() => onSelect(selectedActivity)}
                                >
                                    <Text style={styles.saveButtonText}>Logga detta pass</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </ScrollView>
                        ) : (
                            <View style={styles.placeholderContainer}>
                                <Ionicons name="arrow-up" size={40} color={Palette.text.disabled} />
                                <Text style={styles.placeholderText}>Välj ett pass från listan ovan för att se detaljer</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Palette.background.default,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.m,
        backgroundColor: Palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.s,
    },
    title: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    closeButton: {
        padding: Spacing.xs,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    loadingText: {
        marginTop: Spacing.m,
        color: Palette.text.secondary,
        fontSize: Typography.size.m,
    },
    listContainer: {
        maxHeight: '100%',
        backgroundColor: Palette.background.paper,
    },
    listContainerCompact: {
        maxHeight: 120,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
    },
    listContent: {
        padding: Spacing.m,
    },
    activityCard: {
        backgroundColor: Palette.background.paper,
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.s,
        ...Shadows.small,
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    activityCardCompact: {
        width: 150,
        marginRight: Spacing.s,
        marginBottom: 0,
        padding: Spacing.s,
    },
    activityCardSelected: {
        backgroundColor: STRAVA_ORANGE,
        borderColor: STRAVA_ORANGE,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    activityName: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
        flex: 1,
    },
    textWhite: {
        color: '#FFF',
    },
    activityDate: {
        fontSize: Typography.size.xs,
        color: Palette.text.disabled,
    },
    activityStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    compactStat: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
    detailsContainer: {
        flex: 1,
    },
    detailsContent: {
        padding: Spacing.l,
    },
    detailsTitle: {
        fontSize: Typography.size.xl,
        fontWeight: 'bold',
        color: Palette.text.primary,
        marginBottom: Spacing.xs,
    },
    detailsDate: {
        fontSize: Typography.size.m,
        color: Palette.text.secondary,
        marginBottom: Spacing.xl,
        textTransform: 'capitalize',
    },
    mainStatsGrid: {
        flexDirection: 'row',
        gap: Spacing.m,
        marginBottom: Spacing.xl,
    },
    mainStatBox: {
        flex: 1,
        backgroundColor: Palette.background.paper,
        borderRadius: BorderRadius.l,
        padding: Spacing.l,
        alignItems: 'center',
        ...Shadows.medium,
    },
    mainStatLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Palette.text.disabled,
        letterSpacing: 1,
        marginBottom: Spacing.xs,
    },
    mainStatValue: {
        fontSize: Typography.size.xxl,
        fontWeight: '900',
        color: Palette.text.primary,
    },
    mainStatUnit: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        fontWeight: 'bold',
    },
    secondaryStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: Palette.background.paper,
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.xxl,
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    secondaryStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.s,
    },
    secondaryStatLabel: {
        fontSize: 10,
        color: Palette.text.disabled,
        textTransform: 'uppercase',
    },
    secondaryStatValue: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    saveButton: {
        backgroundColor: STRAVA_ORANGE,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.l,
        borderRadius: BorderRadius.round,
        gap: Spacing.s,
        ...Shadows.large,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: Typography.size.l,
        fontWeight: 'bold',
    },
    placeholderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xxl,
        opacity: 0.5,
    },
    placeholderText: {
        color: Palette.text.secondary,
        textAlign: 'center',
        marginTop: Spacing.m,
        maxWidth: 250,
    },
    emptyState: {
        padding: Spacing.xxl,
        alignItems: 'center',
    },
    emptyText: {
        color: Palette.text.secondary,
        textAlign: 'center',
    },
});
