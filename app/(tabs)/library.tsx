import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { RUNNING_SUBCATEGORIES, WORKOUT_CATEGORIES } from '@/constants/WorkoutTypes'; // Import constants
import { useSession } from '@/context/ctx'; // Import Session
import { db } from '@/lib/firebaseConfig';
import { Exercise, Program, WorkoutTemplate } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import {
    FlatList,
    Linking,
    Modal,
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
    const { user } = useSession(); // Get User
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data
    const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);

    // View State
    const [activeTab, setActiveTab] = useState<'workouts' | 'programs' | 'exercises'>('workouts');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [subFilter, setSubFilter] = useState<string | null>(null);

    // Exercise Filters
    const [activeMuscleGroup, setActiveMuscleGroup] = useState<string | null>(null);

    // Creation Modal
    const [createModalVisible, setCreateModalVisible] = useState(false);


    useFocusEffect(
        useCallback(() => {
            if (user) fetchData();
        }, [user])
    );

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Helper to fetch Public + Private
            const fetchDual = async (colName: string): Promise<any[]> => {
                const colRef = collection(db, colName);

                // 1. Fetch Public
                const qPublic = query(colRef, where('isPublic', '==', true));
                const snapPublic = await getDocs(qPublic);
                const publicDocs = snapPublic.docs.map(d => ({ id: d.id, ...d.data() }));

                // 2. Fetch My Private (if user exists)
                let privateDocs: any[] = [];
                if (user?.uid) {
                    const qPrivate = query(colRef, where('createdBy', '==', user.uid));
                    const snapPrivate = await getDocs(qPrivate);
                    privateDocs = snapPrivate.docs.map(d => ({ id: d.id, ...d.data() }));
                }

                // Merge (Dedupe by ID just in case overlap)
                const combined = [...publicDocs];
                privateDocs.forEach(p => {
                    if (!combined.find(c => c.id === p.id)) {
                        combined.push(p);
                    }
                });

                return combined;
            };

            const wList = await fetchDual('workout_templates') as WorkoutTemplate[];
            // Sort client side for mixed sources
            wList.sort((a, b) => a.name.localeCompare(b.name));
            setWorkouts(wList);

            const pListRaw = await fetchDual('programs') as Program[];
            const pList = pListRaw; // Show all programs
            pList.sort((a, b) => a.title.localeCompare(b.title));
            setPrograms(pList);

            const eList = await fetchDual('exercises') as Exercise[];
            eList.sort((a, b) => a.name.localeCompare(b.name));
            setExercises(eList);

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
        if (activeFilter && w.category?.toLowerCase() !== activeFilter) return false;
        if (subFilter && w.subcategory !== subFilter) return false;
        return true;
    });

    const filteredExercises = exercises.filter(e => {
        if (!activeMuscleGroup) return true;
        return e.primaryMuscleGroup === activeMuscleGroup;
    });

    const muscleGroups = Array.from(new Set(exercises.map(e => e.primaryMuscleGroup))).sort();


    // Navigation Handlers
    const handleCreate = (type: 'workout' | 'program' | 'exercise') => {
        setCreateModalVisible(false);
        if (type === 'workout') {
            router.push('/workout/edit-template'); // Assuming this exists or points correctly
        } else if (type === 'program') {
            router.push('/program/edit');
        } else if (type === 'exercise') {
            router.push('/exercise/edit');
        }
    };

    const handleEdit = (item: any, type: 'workout' | 'program' | 'exercise') => {
        if (!item.id) return;
        if (type === 'workout') {
            router.push({ pathname: '/workout/edit-template', params: { id: item.id } });
        } else if (type === 'program') {
            router.push({ pathname: '/program/edit', params: { id: item.id } });
        } else if (type === 'exercise') {
            router.push({ pathname: '/exercise/edit', params: { id: item.id } });
        }
    };

    const renderHeader = () => (
        <View>
            <View style={[styles.headerTop, Layout.contentContainer]}>
                {/* Empty left to center title or just spacer */}
                <View style={{ width: 40 }} />
                <Text style={styles.headerTitle}>Bibliotek</Text>

                {/* Add Button */}
                <TouchableOpacity onPress={() => setCreateModalVisible(true)} style={styles.addButton}>
                    <Ionicons name="add" size={28} color={Palette.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, Layout.contentContainer]}>
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
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'exercises' && styles.tabActive]}
                    onPress={() => setActiveTab('exercises')}
                >
                    <Text style={[styles.tabText, activeTab === 'exercises' && styles.tabTextActive]}>Övningar</Text>
                </TouchableOpacity>
            </View>

            {/* Filters (Only for Workouts) */}
            {activeTab === 'workouts' && (
                <View style={[styles.filterContainer, Layout.contentContainer]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[styles.filterChip, activeFilter === null && styles.filterChipActive]}
                            onPress={() => setActiveFilter(null)}
                        >
                            <Text style={[styles.filterText, activeFilter === null && styles.filterTextActive]}>Alla</Text>
                        </TouchableOpacity>
                        {WORKOUT_CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.value}
                                style={[styles.filterChip, activeFilter === cat.value && styles.filterChipActive]}
                                onPress={() => {
                                    setActiveFilter(cat.value);
                                    setSubFilter(null); // Reset subfilter when changing main filter
                                }}
                            >
                                <Text style={[styles.filterText, activeFilter === cat.value && styles.filterTextActive]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
            {/* Sub-Filters */}
            {activeTab === 'workouts' && activeFilter === 'löpning' && (
                <View style={[styles.filterContainer, Layout.contentContainer]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[styles.filterChip, subFilter === null && styles.filterChipActive]}
                            onPress={() => setSubFilter(null)}
                        >
                            <Text style={[styles.filterText, subFilter === null && styles.filterTextActive]}>Alla typer</Text>
                        </TouchableOpacity>
                        {RUNNING_SUBCATEGORIES.map(sub => (
                            <TouchableOpacity
                                key={sub.value}
                                style={[styles.filterChip, subFilter === sub.value && styles.filterChipActive]}
                                onPress={() => setSubFilter(sub.value)}
                            >
                                <Text style={[styles.filterText, subFilter === sub.value && styles.filterTextActive]}>
                                    {sub.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Filters (Exercises) */}
            {activeTab === 'exercises' && (
                <View style={[styles.filterContainer, Layout.contentContainer]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[styles.filterChip, activeMuscleGroup === null && styles.filterChipActive]}
                            onPress={() => setActiveMuscleGroup(null)}
                        >
                            <Text style={[styles.filterText, activeMuscleGroup === null && styles.filterTextActive]}>Alla</Text>
                        </TouchableOpacity>
                        {muscleGroups.map(group => (
                            <TouchableOpacity
                                key={group}
                                style={[styles.filterChip, activeMuscleGroup === group && styles.filterChipActive]}
                                onPress={() => setActiveMuscleGroup(group)}
                            >
                                <Text style={[styles.filterText, activeMuscleGroup === group && styles.filterTextActive]}>
                                    {group}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    // Render Helpers
    const renderPrivateBadge = (isPublic?: boolean) => {
        if (isPublic) return null;
        return (
            <View style={styles.privateBadge}>
                <Ionicons name="lock-closed" size={12} color="#666" />
                <Text style={styles.privateText}>Privat</Text>
            </View>
        );
    };

    const isOwner = (item: any) => {
        const ADMIN_EMAILS = ['emil.artursson@gmail.com', 'test@test.com'];
        const isAdmin = ADMIN_EMAILS.includes(user?.email || '');
        return (user?.uid && item.createdBy === user.uid) || isAdmin;
    };


    const renderWorkoutItem = ({ item }: { item: WorkoutTemplate }) => {
        const cat = item.category || 'Övrigt';
        const displayCat = cat.charAt(0).toUpperCase() + cat.slice(1);
        const owned = isOwner(item);

        return (
            <TouchableOpacity
                style={styles.itemCard}
                onPress={() => router.push({ pathname: '/workout/[id]', params: { id: item.id || 'new', title: item.name, type: 'template' } })}
            >
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.itemTitle}>{item.name}</Text>
                        {renderPrivateBadge(item.isPublic)}
                    </View>
                    <Text style={styles.itemSubtitle}>
                        {displayCat}
                        {cat !== 'löpning' && item.exercises ? ` • ${item.exercises.length} Övningar` : ''}
                    </Text>
                </View>
                {owned ? (
                    <TouchableOpacity onPress={() => handleEdit(item, 'workout')} hitSlop={10}>
                        <Ionicons name="pencil-outline" size={20} color={Palette.text.secondary} />
                    </TouchableOpacity>
                ) : (
                    <Ionicons name="chevron-forward" size={20} color={Palette.text.disabled} />
                )}
            </TouchableOpacity>
        );
    };

    const renderProgramItem = ({ item }: { item: Program }) => {
        const owned = isOwner(item);
        return (
            <TouchableOpacity
                style={styles.itemCard}
                onPress={() => router.push({ pathname: '/program/[id]', params: { id: item.id! } })}
            >
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        {renderPrivateBadge(item.isPublic)}
                    </View>
                    <Text style={styles.itemSubtitle}>{item.duration || 'N/A'} • {item.category || 'Generellt'}</Text>
                </View>
                {owned ? (
                    <TouchableOpacity onPress={() => handleEdit(item, 'program')} hitSlop={10}>
                        <Ionicons name="pencil-outline" size={20} color={Palette.text.secondary} />
                    </TouchableOpacity>
                ) : (
                    <Ionicons name="chevron-forward" size={20} color={Palette.text.disabled} />
                )}
            </TouchableOpacity>
        );
    };

    const renderExerciseItem = ({ item }: { item: Exercise }) => {
        const owned = isOwner(item);
        return (
            <TouchableOpacity
                style={styles.itemCard}
                onPress={() => {
                    if (item.videoLink) {
                        Linking.openURL(item.videoLink);
                    }
                }}
            >
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.itemTitle}>{item.name}</Text>
                            {renderPrivateBadge(item.isPublic)}
                        </View>
                        <View style={styles.muscleBadge}>
                            <Text style={styles.muscleBadgeText}>{item.primaryMuscleGroup}</Text>
                        </View>
                    </View>
                    <Text style={styles.itemSubtitle}>
                        {item.type} {item.isBodyweight ? '(Kroppsvikt)' : ''}
                    </Text>
                </View>
                {item.videoLink && (
                    <View style={{ marginLeft: 16 }}>
                        <Ionicons name="play-circle" size={28} color={Palette.primary.main} />
                    </View>
                )}
                {owned && (
                    <TouchableOpacity onPress={() => handleEdit(item, 'exercise')} style={{ paddingLeft: 16 }} hitSlop={10}>
                        <Ionicons name="pencil-outline" size={20} color={Palette.text.secondary} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const getListData = () => {
        if (activeTab === 'workouts') return filteredWorkouts;
        if (activeTab === 'exercises') return filteredExercises;
        return programs;
    };

    const renderItem = ({ item }: { item: any }) => {
        if (activeTab === 'workouts') return renderWorkoutItem({ item });
        if (activeTab === 'exercises') return renderExerciseItem({ item });
        return renderProgramItem({ item });
    }

    const getEmptyText = () => {
        if (activeTab === 'workouts') {
            const categories = Array.from(new Set(workouts.map(w => w.category))).join(', ');
            return `Inga träningspass hittades.\n(Debug: Fetched ${workouts.length}, Filter: ${activeFilter}, Cats: ${categories})`;
        }
        if (activeTab === 'exercises') return 'Inga övningar hittades.';
        return 'Inga program hittades.';
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Custom Modal for Selection */}
            <Modal
                transparent={true}
                visible={createModalVisible}
                animationType="fade"
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setCreateModalVisible(false)}
                >
                    <View style={styles.actionSheet}>
                        <Text style={styles.actionSheetTitle}>Skapa nytt</Text>

                        <TouchableOpacity style={styles.actionButton} onPress={() => handleCreate('workout')}>
                            <Ionicons name="barbell-outline" size={24} color={Palette.text.primary} style={{ marginRight: 12 }} />
                            <Text style={styles.actionButtonText}>Träningspass</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => handleCreate('program')}>
                            <Ionicons name="calendar-outline" size={24} color={Palette.text.primary} style={{ marginRight: 12 }} />
                            <Text style={styles.actionButtonText}>Program</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => handleCreate('exercise')}>
                            <Ionicons name="body-outline" size={24} color={Palette.text.primary} style={{ marginRight: 12 }} />
                            <Text style={styles.actionButtonText}>Övning</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => setCreateModalVisible(false)}>
                            <Text style={[styles.actionButtonText, { color: Palette.status.error }]}>Avbryt</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>


            <FlatList
                data={getListData() as any[]}
                keyExtractor={(item: any) => item.id || item.name || Math.random().toString()}
                renderItem={renderItem as any}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {getEmptyText()}
                    </Text>
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.m,
        paddingTop: Spacing.s,
        paddingBottom: Spacing.s
    },
    headerTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    addButton: {
        padding: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.m,
        marginBottom: Spacing.s,
    },
    tab: {
        marginRight: Spacing.m,
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: Palette.primary.main,
    },
    tabText: {
        fontSize: Typography.size.m,
        color: Palette.text.secondary,
        fontWeight: '600',
    },
    tabTextActive: {
        color: Palette.primary.main,
    },
    filterContainer: {
        paddingHorizontal: Spacing.m,
        marginBottom: Spacing.m,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    filterChipActive: {
        backgroundColor: Palette.primary.dark,
        borderColor: Palette.primary.dark,
    },
    filterText: {
        fontSize: Typography.size.s,
        color: Palette.text.primary,
    },
    filterTextActive: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    listContent: {
        padding: Spacing.m,
    },
    itemCard: {
        backgroundColor: '#FFF',
        padding: Spacing.m,
        borderRadius: BorderRadius.m,
        marginBottom: Spacing.s,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    itemTitle: {
        fontSize: Typography.size.m,
        fontWeight: '600',
        color: Palette.text.primary,
    },
    itemSubtitle: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        marginTop: 4,
    },
    muscleBadge: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    muscleBadgeText: {
        fontSize: 10,
        color: Palette.text.secondary,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: Palette.text.secondary,
        marginTop: 20,
    },
    privateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4
    },
    privateText: {
        fontSize: 10,
        color: '#666',
        fontWeight: '600'
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    actionSheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: BorderRadius.l,
        borderTopRightRadius: BorderRadius.l,
        padding: Spacing.m,
        paddingBottom: Spacing.xl, // Safe area
    },
    actionSheetTitle: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.secondary,
        marginBottom: Spacing.m,
        textAlign: 'center'
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    actionButtonText: {
        fontSize: Typography.size.m,
        color: Palette.text.primary,
        fontWeight: '500'
    },
    cancelButton: {
        borderBottomWidth: 0,
        justifyContent: 'center',
        marginTop: Spacing.s
    }
});
