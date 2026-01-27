import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Imports updated to include firestore
import { db } from '@/lib/firebaseConfig';
import { seedPrograms } from '@/scripts/seedPrograms';
import { collection, getDocs } from 'firebase/firestore';

const TABS = ['Programs', 'Workouts', 'Mine'];
const FILTERS = ['Löpning', 'Styrketräning', 'Rehab'];

export default function ProgramsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Workouts');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [programs, setPrograms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        setIsLoading(true);
        try {
            await seedPrograms(); // Ensure data exists
            const querySnapshot = await getDocs(collection(db, "programs"));
            const fetchedPrograms = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPrograms(fetchedPrograms);
        } catch (error) {
            console.error("Error fetching programs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter Logic
    const filteredPrograms = programs.filter(item => {
        const matchesSearch = item.title?.toLowerCase().includes(search.toLowerCase()) ||
            item.category?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = activeFilter ? item.category === activeFilter : true;
        return matchesSearch && matchesFilter;
    });

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                router.push({ pathname: '/program/[id]', params: { id: item.id, title: item.title } });
            }}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{item.duration}</Text>
                    <FontAwesome name="clock-o" size={12} color={Palette.accent.main} style={{ marginLeft: 4 }} />
                </View>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{item.category}</Text>
                </View>
                {item.premium && (
                    <Text style={styles.premiumText}>Premium</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>

            {/* HEADER & SEARCH */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <FontAwesome name="search" size={16} color={Palette.text.secondary} style={{ marginLeft: Spacing.s }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Sök träning eller program..."
                        value={search}
                        onChangeText={setSearch}
                        placeholderTextColor={Palette.text.disabled}
                    />
                </View>

                {/* TABS SEGMENT */}
                <View style={styles.tabContainer}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.container}>

                {/* FILTERS */}
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.m }}>
                        {FILTERS.map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.chip,
                                    activeFilter === filter && styles.activeChip
                                ]}
                                onPress={() => setActiveFilter(activeFilter === filter ? null : filter)}
                            >
                                <Text style={[
                                    styles.chipText,
                                    activeFilter === filter && styles.activeChipText
                                ]}>{filter}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* LIST */}
                <FlatList
                    data={filteredPrograms}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={
                        <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                            <Text style={{ color: Palette.text.secondary }}>Inga resultat hittades.</Text>
                        </View>
                    }
                />

            </View>

            {/* FAB for creation */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/workout/log')}
            >
                <FontAwesome name="plus" size={24} color="#FFF" />
            </TouchableOpacity>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Palette.background.default,
    },
    header: {
        backgroundColor: Palette.background.default,
        paddingTop: Spacing.m,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: Spacing.m,
        borderRadius: BorderRadius.round,
        height: 40,
        ...Shadows.small,
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: Spacing.s,
        fontSize: Typography.size.s,
    },
    tabContainer: {
        flexDirection: 'row',
        marginVertical: Spacing.m,
        paddingHorizontal: Spacing.m,
    },
    tab: {
        paddingVertical: Spacing.s,
        paddingHorizontal: Spacing.m,
        borderRadius: BorderRadius.m,
        marginRight: Spacing.s,
    },
    activeTab: {
        backgroundColor: '#FFF',
        ...Shadows.small,
    },
    tabText: {
        fontSize: Typography.size.s,
        fontWeight: '600',
        color: Palette.text.secondary,
    },
    activeTabText: {
        color: Palette.text.primary,
        fontWeight: 'bold',
    },

    container: {
        flex: 1,
        backgroundColor: Palette.background.default,
    },
    filterContainer: {
        height: 40,
        marginBottom: Spacing.s,
    },
    chip: {
        paddingHorizontal: Spacing.m,
        paddingVertical: 6,
        backgroundColor: '#FFF',
        borderRadius: BorderRadius.round,
        marginRight: Spacing.s,
        borderWidth: 1,
        borderColor: Palette.border.default,
        justifyContent: 'center',
    },
    activeChip: {
        backgroundColor: Palette.primary.main,
        borderColor: Palette.primary.main,
    },
    chipText: {
        fontSize: Typography.size.xs,
        fontWeight: '500',
        color: Palette.text.primary,
    },
    activeChipText: {
        color: '#FFF',
    },

    // Note: CategoryHeader removed/integrated into search/filter logic

    listContent: {
        paddingBottom: 80,
    },
    card: {
        padding: Spacing.m,
        backgroundColor: '#FFF',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        fontSize: Typography.size.s,
        fontWeight: '500',
        color: Palette.text.primary,
        flex: 1,
        marginRight: Spacing.s,
    },
    durationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.round,
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    durationText: {
        fontSize: 10,
        color: Palette.text.secondary,
        fontWeight: '600',
    },
    premiumText: {
        color: Palette.accent.main, // Salmon text
        fontSize: 10,
        marginLeft: 8,
        fontWeight: '600',
        alignSelf: 'center',
    },
    tagBadge: {
        backgroundColor: Palette.background.paper,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Palette.border.default,
    },
    tagText: {
        fontSize: 10,
        color: Palette.text.secondary,
    },
    separator: {
        height: 1,
        backgroundColor: Palette.border.default,
        marginLeft: Spacing.m,
    },

    fab: {
        position: 'absolute',
        bottom: Spacing.xl,
        alignSelf: 'center',
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Palette.accent.main, // Salmon FAB
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.medium,
    }
});
