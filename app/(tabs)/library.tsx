import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { db } from '@/lib/firebaseConfig';
import { Program, WorkoutTemplate } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function LibraryScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data
    const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);

    // View State
    const [activeTab, setActiveTab] = useState<'workouts' | 'programs'>('workouts');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [subFilter, setSubFilter] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Workouts
            const wSnap = await getDocs(collection(db, 'workout_templates'));
            const wList = wSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutTemplate));
            setWorkouts(wList);

            // Fetch Programs (All non-daily?)
            const pSnap = await getDocs(collection(db, 'programs'));
            const pList = pSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Program))
                .filter(p => p.type !== 'daily'); // Exclude daily from main list
            setPrograms(pList);

        } catch (e) {
            console.error('Failed to fetch library data', e);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const filteredWorkouts = workouts.filter(w => {
        if (activeFilter && w.category !== activeFilter) return false;
        if (subFilter && w.subcategory !== subFilter) return false;
        return true;
    });

    const renderHeader = () => (
        <View>
            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'workouts' && styles.tabActive]}
                    onPress={() => setActiveTab('workouts')}
                >
                    <Text style={[styles.tabText, activeTab === 'workouts' && styles.tabTextActive]}>Träningspass</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'programs' && styles.tabActive]}
                    onPress={() => setActiveTab('programs')}
                >
                    <Text style={[styles.tabText, activeTab === 'programs' && styles.tabTextActive]}>Program</Text>
                </TouchableOpacity>
            </View>

            {/* Filters (Only for Workouts) */}
            {activeTab === 'workouts' && (
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[styles.filterChip, activeFilter === null && styles.filterChipActive]}
                            onPress={() => setActiveFilter(null)}
                        >
                            <Text style={[styles.filterText, activeFilter === null && styles.filterTextActive]}>Alla</Text>
                        </TouchableOpacity>
                        {['styrketräning', 'löpning', 'rehab'].map(tag => (
                            <TouchableOpacity
                                key={tag}
                                style={[styles.filterChip, activeFilter === tag && styles.filterChipActive]}
                                onPress={() => {
                                    setActiveFilter(tag);
                                    setSubFilter(null); // Reset subfilter when changing main filter
                                }}
                            >
                                <Text style={[styles.filterText, activeFilter === tag && styles.filterTextActive]}>
                                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
            {/* Sub-Filters (Only for Running) */}
            {activeTab === 'workouts' && activeFilter === 'löpning' && (
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[styles.filterChip, subFilter === null && styles.filterChipActive]}
                            onPress={() => setSubFilter(null)}
                        >
                            <Text style={[styles.filterText, subFilter === null && styles.filterTextActive]}>Alla typer</Text>
                        </TouchableOpacity>
                        {['distans', 'intervall', 'långpass'].map(tag => (
                            <TouchableOpacity
                                key={tag}
                                style={[styles.filterChip, subFilter === tag && styles.filterChipActive]}
                                onPress={() => setSubFilter(tag)}
                            >
                                <Text style={[styles.filterText, subFilter === tag && styles.filterTextActive]}>
                                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    const renderWorkoutItem = ({ item }: { item: WorkoutTemplate }) => {
        const cat = item.category || 'Övrigt';
        const displayCat = cat.charAt(0).toUpperCase() + cat.slice(1);

        return (
            <TouchableOpacity
                style={styles.itemCard}
                onPress={() => router.push({ pathname: '/workout/[id]', params: { id: item.id || 'new', title: item.name, type: 'template' } })}
            >
                <View>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.itemSubtitle}>
                        {displayCat}
                        {cat !== 'löpning' && item.exercises ? ` • ${item.exercises.length} Övningar` : ''}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Palette.text.disabled} />
            </TouchableOpacity>
        );
    };

    const renderProgramItem = ({ item }: { item: Program }) => (
        <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push({ pathname: '/program/[id]', params: { id: item.id! } })}
        >
            <View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.duration || 'N/A'} • {item.category || 'Generellt'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Palette.text.disabled} />
        </TouchableOpacity>
    );

    const getListData = () => activeTab === 'workouts' ? filteredWorkouts : programs;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bibliotek</Text>
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Palette.primary.main} />
                </View>
            ) : (
                <FlatList
                    data={getListData() as any}
                    keyExtractor={(item) => item.id || Math.random().toString()}
                    renderItem={(activeTab === 'workouts' ? renderWorkoutItem : renderProgramItem) as any}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            {activeTab === 'workouts' ? 'Inga träningspass hittades.' : 'Inga program hittades.'}
                        </Text>
                    }
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        padding: Spacing.m,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { padding: Spacing.m },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.s,
        padding: 4,
        marginBottom: Spacing.m,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: BorderRadius.s - 2,
    },
    tabActive: {
        backgroundColor: Palette.background.default,
    },
    tabText: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        fontWeight: '600',
    },
    tabTextActive: {
        color: Palette.text.primary,
    },

    // Filters
    filterContainer: {
        marginBottom: Spacing.m,
    },
    filterChip: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#EEE',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: Palette.primary.dark,
        borderColor: Palette.primary.dark,
    },
    filterText: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
    filterTextActive: {
        color: '#FFF',
        fontWeight: 'bold',
    },

    // List Items
    itemCard: {
        backgroundColor: '#FFF',
        padding: Spacing.m,
        borderRadius: BorderRadius.m,
        marginBottom: Spacing.s,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    itemTitle: {
        fontSize: Typography.size.m,
        fontWeight: '600',
        color: Palette.text.primary,
    },
    itemSubtitle: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: Palette.text.secondary,
        marginTop: 20,
    }
});
