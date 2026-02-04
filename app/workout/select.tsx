import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { db } from '@/lib/firebaseConfig';
import { WorkoutTemplate } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WorkoutSelectScreen() {
    const router = useRouter();
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchTemplates();
        }, [])
    );

    const fetchTemplates = async () => {
        try {
            // Fetch only running templates or all?
            // User requested "available pass jag har i min bank" when clicking "Lägg till löppass".
            // Since the button on home is "Lägg till pass" (Add Workout), maybe we should show all or tabs?
            // But the user specifically asked for "Lägg till löppass" flow in the chat.
            // For now, I'll filter by 'löpning' to satisfy the specific "running" request context,
            // OR I can fetch all and let user filter.
            // Let's explicitly fetch 'löpning' since the user focused on that.
            // actually, let's fetch all and filter in UI or just fetch 'löpning' if we assume this is the "Running" flow.
            // The user said "När jag väljer ... Lägg till löppass". But the button says "Lägg till pass".
            // I will update the button on Home to specifically be "Lägg till löppass" or general?
            // The existing button says "Lägg till pass". I will assume generic for now but focus on running as requested.
            // Let's filter by category 'löpning' for now to match the user's specific request.

            const q = query(collection(db, 'workout_templates'), where('category', '==', 'löpning'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutTemplate));
            setTemplates(data);
        } catch (e) {
            console.error("Error fetching templates:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTemplate = (template: WorkoutTemplate) => {
        // Navigate to WorkoutDetailsView in "template" mode to schedule/log it
        router.push({
            pathname: '/workout/[id]',
            params: {
                id: template.id!,
                workoutType: 'template',
                showBack: 'true' // ensure string
            }
        });
    };

    const handleCreateCustom = () => {
        router.push('/workout/create-custom');
    };

    const handleEditTemplate = (e: any, template: WorkoutTemplate) => {
        e.stopPropagation();
        router.push({
            pathname: '/workout/edit-template',
            params: { id: template.id! }
        });
    };

    const renderItem = ({ item }: { item: WorkoutTemplate }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleSelectTemplate(item)}>
            <View style={styles.iconContainer}>
                <Ionicons name="flame" size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.subcategory || 'Löpning'} • {(item.note || (item as any).description || '').slice(0, 30)}...</Text>
            </View>

            {/* Edit Button */}
            <TouchableOpacity onPress={(e) => handleEditTemplate(e, item)} style={{ padding: 8 }}>
                <Ionicons name="pencil" size={20} color={Palette.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={{ marginLeft: 4 }}>
                <Ionicons name="chevron-forward" size={20} color={Palette.text.secondary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Palette.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Välj Pass</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Mina Mallar</Text>

                {loading ? (
                    <ActivityIndicator size="large" color={Palette.primary.main} />
                ) : (
                    <FlatList
                        data={templates}
                        keyExtractor={item => item.id!}
                        renderItem={renderItem}
                        ListHeaderComponent={
                            <TouchableOpacity style={styles.createButton} onPress={handleCreateCustom}>
                                <View style={[styles.iconContainer, { backgroundColor: Palette.primary.main }]}>
                                    <Ionicons name="add" size={24} color="#FFF" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>Skapa eget pass</Text>
                                    <Text style={styles.cardSubtitle}>Titel, sträcka, tid</Text>
                                </View>
                            </TouchableOpacity>
                        }
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: Palette.text.secondary }}>Inga mallar hittades.</Text>}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Palette.background.default,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        backgroundColor: Palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    content: {
        flex: 1,
        padding: Spacing.m,
    },
    sectionTitle: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.secondary,
        marginBottom: Spacing.m,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: Spacing.m,
        borderRadius: BorderRadius.m,
        marginBottom: Spacing.m,
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF', // Or distinct color?
        padding: Spacing.m,
        borderRadius: BorderRadius.m,
        marginBottom: Spacing.l,
        borderWidth: 1,
        borderColor: Palette.primary.main,
        borderStyle: 'dashed',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FF6B6B', // Example color for template icon
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.m,
    },
    cardTitle: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        color: Palette.text.primary,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
});
