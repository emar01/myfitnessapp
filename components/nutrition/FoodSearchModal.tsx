import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '@/constants/DesignSystem';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { FoodItem, MealType } from '@/types';
import { parseFoodImage } from '@/services/aiService';
import { nutritionService } from '@/services/nutritionService';
import { useSession } from '@/context/ctx';

interface FoodSearchModalProps {
    visible: boolean;
    mealType: MealType | null;
    onClose: () => void;
    onAddFood: (foodItem: FoodItem, amount: number) => void;
    searchFoods: (query: string) => Promise<FoodItem[]>;
}

export default function FoodSearchModal({ visible, mealType, onClose, onAddFood, searchFoods }: FoodSearchModalProps) {
    const { palette, spacing, borderRadius } = useTheme();
    const { user } = useSession();
    const [activeTab, setActiveTab] = useState<'search' | 'photo'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    const isSearching = searchQuery.trim().length > 0;

    // Load category suggestions when modal opens
    useEffect(() => {
        if (visible && mealType && user) {
            setIsSuggestionsLoading(true);
            nutritionService.getSuggestedFoods(user.uid, mealType)
                .then(setSuggestions)
                .finally(() => setIsSuggestionsLoading(false));
        }
        if (!visible) {
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [visible, mealType, user]);

    // Live search as user types
    useEffect(() => {
        if (!searchQuery.trim()) return;
        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const results = await searchFoods(searchQuery);
                setSearchResults(results);
            } catch (e) {
                console.error('Search failed', e);
            } finally {
                setIsLoading(false);
            }
        }, 300); // debounce 300ms
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleTakePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            alert("Du måste ge tillgång till kameran för att använda denna funktion.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
        if (!result.canceled && result.assets[0].base64) {
            processImage(result.assets[0].base64);
        }
    };

    const processImage = async (base64Image: string) => {
        setIsLoading(true);
        try {
            const aiData = await parseFoodImage(base64Image);
            if (aiData && aiData.foodName) {
                const newFood: FoodItem = {
                    name: aiData.foodName,
                    calories: aiData.calories,
                    protein: aiData.protein,
                    carbs: aiData.carbs,
                    fat: aiData.fat,
                    fiber: aiData.fiber,
                    servingSize: aiData.amountConsumed || 1,
                    servingUnit: aiData.servingUnit || 'portion',
                };
                onAddFood(newFood, 1);
            } else {
                alert("Kunde inte tolka bilden. Försök igen.");
            }
        } catch (error) {
            console.error("AI parse failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const displayedItems = isSearching ? searchResults : suggestions;
    const listLabel = isSearching
        ? `${displayedItems.length} resultat`
        : `Förslag för ${mealType}`;

    const renderItem = ({ item }: { item: FoodItem }) => (
        <TouchableOpacity
            style={[styles.resultItem, { borderBottomColor: palette.border.default }]}
            onPress={() => onAddFood(item, 1)}
        >
            <View style={{ flex: 1 }}>
                <Text style={[styles.resultName, { color: palette.text.primary }]}>{item.name}</Text>
                <Text style={[styles.resultSub, { color: palette.text.secondary }]}>
                    {item.calories} kcal · {item.servingSize} {item.servingUnit}
                    {item.protein ? ` · Protein: ${item.protein}g` : ''}
                </Text>
            </View>
            <FontAwesome name="plus-circle" size={24} color={palette.primary.main} />
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: palette.background.default }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: palette.background.paper, borderBottomColor: palette.border.default }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <FontAwesome name="times" size={24} color={palette.text.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: palette.text.primary }]}>
                        Lägg till i {mealType}
                    </Text>
                    <View style={styles.closeButton} />
                </View>

                {/* Tabs */}
                <View style={[styles.tabContainer, { backgroundColor: palette.background.paper }]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'search' && { borderBottomColor: palette.primary.main, borderBottomWidth: 2 }]}
                        onPress={() => setActiveTab('search')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'search' ? palette.primary.main : palette.text.secondary }]}>
                            Sök
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'photo' && { borderBottomColor: palette.primary.main, borderBottomWidth: 2 }]}
                        onPress={() => setActiveTab('photo')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'photo' ? palette.primary.main : palette.text.secondary }]}>
                            Foto
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {activeTab === 'search' ? (
                        <>
                            {/* Search bar */}
                            <View style={[styles.searchBar, { backgroundColor: palette.background.paper, borderRadius: borderRadius.m, borderColor: palette.border.default, borderWidth: 1 }]}>
                                <FontAwesome name="search" size={16} color={palette.text.disabled} style={styles.searchIcon} />
                                <TextInput
                                    style={[styles.searchInput, { color: palette.text.primary }]}
                                    placeholder="Sök ett livsmedel..."
                                    placeholderTextColor={palette.text.disabled}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus={false}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <FontAwesome name="times-circle" size={16} color={palette.text.disabled} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* List label */}
                            <Text style={[styles.listLabel, { color: palette.text.secondary }]}>
                                {isSuggestionsLoading && !isSearching ? 'Laddar förslag...' : listLabel}
                            </Text>

                            {/* Results / Suggestions */}
                            {(isLoading || isSuggestionsLoading) && isSearching ? (
                                <ActivityIndicator size="large" color={palette.primary.main} style={{ marginTop: 20 }} />
                            ) : displayedItems.length === 0 ? (
                                <View style={{ alignItems: 'center', marginTop: 40 }}>
                                    <FontAwesome name="search" size={32} color={palette.text.disabled} />
                                    <Text style={[styles.emptyText, { color: palette.text.disabled }]}>
                                        {isSearching ? 'Inga träffar' : 'Inga förslag hittades'}
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={displayedItems}
                                    keyExtractor={(item, index) => item.id || index.toString()}
                                    renderItem={renderItem}
                                    keyboardShouldPersistTaps="handled"
                                />
                            )}
                        </>
                    ) : (
                        <View style={styles.photoContainer}>
                            <Text style={[styles.photoText, { color: palette.text.primary }]}>
                                Ta en bild på din mat så uppskattar AI:n kalorierna.
                            </Text>
                            <TouchableOpacity
                                style={[styles.photoButton, { backgroundColor: palette.primary.main, borderRadius: borderRadius.l }]}
                                onPress={handleTakePhoto}
                            >
                                <FontAwesome name="camera" size={24} color="#fff" />
                                <Text style={styles.photoButtonText}>Öppna Kamera</Text>
                            </TouchableOpacity>
                            {isLoading && <ActivityIndicator size="large" color={palette.primary.main} style={{ marginTop: 20 }} />}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    closeButton: { width: 40, alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    tabContainer: { flexDirection: 'row', elevation: 2 },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    tabText: { fontSize: 16, fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16 },
    listLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    resultItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    resultName: { fontSize: 15, fontWeight: '500' },
    resultSub: { fontSize: 13, marginTop: 3 },
    emptyText: { fontSize: 14, marginTop: 12 },
    photoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    photoText: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
    photoButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
    photoButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
});
