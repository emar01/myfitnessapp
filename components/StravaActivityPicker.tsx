import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { useAlert } from '@/context/AlertContext';
import { useSession } from '@/context/ctx';
import { getStravaActivities, StravaActivity } from '@/services/stravaService';
import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StravaActivityPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (activity: StravaActivity) => void;
}

export default function StravaActivityPicker({ visible, onClose, onSelect }: StravaActivityPickerProps) {
    const { user } = useSession();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [activities, setActivities] = useState<StravaActivity[]>([]);

    useEffect(() => {
        if (visible && user) {
            fetchActivities();
        }
    }, [visible, user]);

    const fetchActivities = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getStravaActivities(user.uid, 1, 30);
            setActivities(data || []);
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

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Välj Strava-pass</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <FontAwesome name="close" size={24} color={Palette.text.primary} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={Palette.primary.main} />
                        <Text style={styles.loadingText}>Hämtar aktiviteter...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={activities}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.activityCard}
                                onPress={() => onSelect(item)}
                            >
                                <View style={styles.cardHeader}>
                                    <Text style={styles.activityName}>{item.name}</Text>
                                    <Text style={styles.activityDate}>
                                        {new Date(item.start_date).toLocaleDateString('sv-SE')}
                                    </Text>
                                </View>
                                <View style={styles.activityStats}>
                                    <View style={styles.statItem}>
                                        <FontAwesome name="road" size={14} color={Palette.text.secondary} />
                                        <Text style={styles.statText}>{(item.distance / 1000).toFixed(2)} km</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <FontAwesome name="clock-o" size={14} color={Palette.text.secondary} />
                                        <Text style={styles.statText}>{Math.floor(item.moving_time / 60)} min</Text>
                                    </View>
                                    {item.total_elevation_gain > 0 && (
                                        <View style={styles.statItem}>
                                            <FontAwesome name="area-chart" size={14} color={Palette.text.secondary} />
                                            <Text style={styles.statText}>{Math.round(item.total_elevation_gain)}m</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>Inga aktiviteter hittades på Strava.</Text>
                            </View>
                        }
                    />
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.s,
    },
    activityName: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
        flex: 1,
        marginRight: Spacing.s,
    },
    activityDate: {
        fontSize: Typography.size.xs,
        color: Palette.text.disabled,
    },
    activityStats: {
        flexDirection: 'row',
        gap: Spacing.m,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
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
