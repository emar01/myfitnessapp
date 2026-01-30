import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { getUserPrs } from '@/services/prService';
import { PersonalRecord } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StatsScreen() {
    const router = useRouter();
    const { user } = useSession();
    const [prs, setPrs] = useState<PersonalRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadPrs();
        }
    }, [user]);

    const loadPrs = async () => {
        if (!user) return;
        setIsLoading(true);
        const prMap = await getUserPrs(user.uid);
        // Convert map to array and sort by date descending
        const prList = Object.values(prMap).sort((a, b) => {
            // Handle Timestamp objects
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });
        setPrs(prList);
        setIsLoading(false);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Palette.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mina Personbästa 🏆</Text>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Palette.primary.main} />
                </View>
            ) : (
                <FlatList
                    data={prs}
                    keyExtractor={(item) => item.exerciseId}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.exerciseName}>{item.exerciseName}</Text>
                                <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                            </View>
                            <View style={styles.prValueParams}>
                                <Text style={styles.prWeight}>{item.weight} kg</Text>
                                <Text style={styles.prReps}>{item.reps} reps</Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="trophy-outline" size={48} color={Palette.text.disabled} />
                            <Text style={styles.emptyText}>Inga personbästa registrerade än.</Text>
                            <Text style={styles.emptySubText}>Kör hårt och logga dina pass!</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.m,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backButton: {
        marginRight: Spacing.m,
    },
    headerTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: Spacing.m,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: Spacing.m,
        marginBottom: Spacing.s,
        borderRadius: BorderRadius.m,
        // Shadow usually
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    exerciseName: {
        fontSize: Typography.size.m,
        fontWeight: '600',
        color: Palette.text.primary,
        marginBottom: 4,
    },
    dateText: {
        fontSize: Typography.size.xs,
        color: Palette.text.secondary,
    },
    prValueParams: {
        alignItems: 'flex-end',
    },
    prWeight: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.primary.main, // Or Gold
    },
    prReps: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: Spacing.xl,
        marginTop: Spacing.xl,
    },
    emptyText: {
        marginTop: Spacing.m,
        fontSize: Typography.size.m,
        fontWeight: '500',
        color: Palette.text.secondary,
    },
    emptySubText: {
        marginTop: Spacing.s,
        fontSize: Typography.size.s,
        color: Palette.text.disabled,
    }
});
