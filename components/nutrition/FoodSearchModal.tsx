import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useTheme } from '@/constants/DesignSystem';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { FoodItem, MealType } from '@/types';
import { parseFoodImage, estimateFoodNutrition } from '@/services/aiService';
import { nutritionService } from '@/services/nutritionService';
import { useSession } from '@/context/ctx';
import { useAlert } from '@/context/AlertContext';

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
    const { showAlert } = useAlert();
    const [activeTab, setActiveTab] = useState<'search' | 'photo' | 'create'>('search');
    const [editingFood, setEditingFood] = useState<Partial<FoodItem> | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    const [inputValues, setInputValues] = useState({
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        servingSize: '',
    });
    const [aiAlternatives, setAiAlternatives] = useState<any[]>([]);
    const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
    const isSearching = searchQuery.trim().length > 0;

    useEffect(() => {
        console.log("FoodSearchModal isLoading:", isLoading);
    }, [isLoading]);

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
            setAiAlternatives([]);
            setAiStatusMessage(null);
            setEditingFood(null);
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
            showAlert("Behörighet saknas", "Du måste ge tillgång till kameran för att använda denna funktion.");
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

            if (aiData?.error === 'RATE_LIMIT') {
                showAlert("Belastning", aiData.message);
                setIsLoading(false);
                return;
            }

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
                showAlert("Ett fel uppstod", "Kunde inte tolka bilden. Försök igen.");
            }
        } catch (error) {
            console.error("AI parse failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateMissingFood = async (manualName?: string) => {
        const nameToUse = manualName || searchQuery.trim();
        if (!nameToUse || !user || !mealType) return;
        
        setIsLoading(true);
        Keyboard.dismiss();
        try {
            // Pre-initialize with what we have
            setEditingFood(prev => ({
                ...prev,
                name: nameToUse,
                calories: prev?.calories || 0,
                protein: prev?.protein || 0,
                carbs: prev?.carbs || 0,
                fat: prev?.fat || 0,
                fiber: prev?.fiber || 0,
                servingSize: prev?.servingSize || 100,
                servingUnit: prev?.servingUnit || 'g'
            }));

            setInputValues(prev => ({
                calories: prev.calories || '0',
                protein: prev.protein || '0',
                carbs: prev.carbs || '0',
                fat: prev.fat || '0',
                servingSize: prev.servingSize || '100',
            }));
            
            const aiData = await estimateFoodNutrition(nameToUse, mealType);

            if (aiData?.error === 'RATE_LIMIT') {
                showAlert("Belastning", aiData.message);
                setIsLoading(false);
                return;
            }

            const alternatives = aiData?.alternatives || [];
            setAiAlternatives(alternatives);
            setAiStatusMessage(aiData?.message || null);

            if (alternatives.length > 0) {
                const first = alternatives[0];
                const newFood: Partial<FoodItem> = {
                    name: first.name || nameToUse,
                    calories: first.calories || 0,
                    protein: first.protein || 0,
                    carbs: first.carbs || 0,
                    fat: first.fat || 0,
                    fiber: first.fiber || 0,
                    servingSize: first.servingSize || 100,
                    servingUnit: first.servingUnit || 'g',
                    categories: [mealType]
                };
                
                setEditingFood(newFood);
                setInputValues({
                    calories: (first.calories || 0).toString(),
                    protein: (first.protein || 0).toString(),
                    carbs: (first.carbs || 0).toString(),
                    fat: (first.fat || 0).toString(),
                    servingSize: (first.servingSize || 100).toString(),
                });
            }
            
            setActiveTab('create');
            // Only clear search query if we are SURE it's a manual override from the create tab
            if (manualName && manualName !== searchQuery) setSearchQuery(''); 

            setIsLoading(false);

            if (!aiData || alternatives.length === 0) {
                // If AI failed, at least we have the name set from the pre-initialization
                if (!aiData) {
                    showAlert("Manuell justering", "AI kunde inte hämta data just nu, du får fylla i fälten manuellt.");
                }
            }
        } catch (e) {
            setIsLoading(false);
            console.error("Kunde inte ai-skapa", e);
            showAlert("Fel", "Ett fel uppstod.");
        } finally {
            setIsLoading(false);
        }
    };

    const saveManualFood = async () => {
        if (!editingFood?.name || !user) return;
        
        setIsLoading(true);
        try {
            const foodToSave: Omit<FoodItem, 'id'> = {
                name: editingFood.name,
                calories: editingFood.calories || 0,
                protein: editingFood.protein || 0,
                carbs: editingFood.carbs || 0,
                fat: editingFood.fat || 0,
                fiber: editingFood.fiber || 0,
                servingSize: editingFood.servingSize || 100,
                servingUnit: editingFood.servingUnit || 'g',
                isPublic: true,
                createdBy: user.uid,
                categories: editingFood.categories || (mealType ? [mealType] : [])
            };
            
            const newId = await nutritionService.createFoodItem(foodToSave);
            onAddFood({ ...foodToSave, id: newId }, 1);
            
            setActiveTab('search');
            setEditingFood(null);
            setSearchQuery('');
        } catch (error) {
            showAlert("Fel", 'Kunde inte spara matvaran.');
        } finally {
            setIsLoading(false);
        }
    };

    const displayedItems = isSearching ? searchResults : suggestions;
    const listLabel = isSearching
        ? `${displayedItems.length} resultat`
        : `Förslag för ${mealType}`;

    const updateNumericField = (field: keyof typeof inputValues, value: string) => {
        setInputValues(prev => ({ ...prev, [field]: value }));
        const parsed = parseFloat(value.replace(',', '.'));
        setEditingFood(prev => ({ ...prev, [field]: isNaN(parsed) ? 0 : parsed }));
    };

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
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : (Platform.OS === 'android' ? 'height' : undefined)} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                enabled={Platform.OS !== 'web'}
            >
                <View style={[styles.container, { backgroundColor: palette.background.default }]} pointerEvents="auto">
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
                        style={[styles.tab, activeTab === 'create' && { borderBottomColor: palette.primary.main, borderBottomWidth: 2 }]}
                        onPress={() => setActiveTab('create')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'create' ? palette.primary.main : palette.text.secondary }]}>
                            Skapa
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
                    {activeTab === 'create' ? (
                        <View style={{ flex: 1, paddingHorizontal: 4 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: palette.text.primary }}>Skapa ny matvara</Text>
                            
                            <Text style={[styles.inputLabel, { color: palette.text.secondary }]}>Namn</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInput 
                                    style={[styles.createInput, { flex: 1, borderColor: palette.border.default, color: palette.text.primary }]} 
                                    value={editingFood?.name || ''} 
                                    onChangeText={t => setEditingFood(prev => prev ? { ...prev, name: t } : { name: t, calories: 0, servingSize: 100, servingUnit: 'g' })} 
                                    placeholder="T.ex. Kycklingsallad"
                                    placeholderTextColor={palette.text.disabled}
                                />
                                <TouchableOpacity 
                                    onPress={() => handleCreateMissingFood(editingFood?.name)}
                                    style={{ marginLeft: 10, backgroundColor: palette.primary.main, padding: 12, borderRadius: 8 }}
                                    disabled={isLoading}
                                >
                                    <FontAwesome name="magic" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {/* AI Status Message and Alternatives */}
                            {(aiStatusMessage || aiAlternatives.length > 1) && (
                                <View style={{ marginVertical: 12, padding: 12, backgroundColor: palette.primary.main + '10', borderRadius: 8, borderWidth: 1, borderColor: palette.primary.main + '30' }}>
                                    {aiStatusMessage && (
                                        <Text style={{ fontSize: 13, color: palette.text.primary, fontWeight: '600', marginBottom: aiAlternatives.length > 1 ? 8 : 0 }}>
                                            <FontAwesome name="info-circle" size={14} color={palette.primary.main} /> {aiStatusMessage}
                                        </Text>
                                    )}
                                    {aiAlternatives.length > 1 && (
                                        <View>
                                            <Text style={{ fontSize: 11, color: palette.text.secondary, marginBottom: 6 }}>Hittade flera alternativ. Välj ett:</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                                {aiAlternatives.map((alt, idx) => (
                                                    <TouchableOpacity 
                                                        key={idx}
                                                        onPress={() => {
                                                            setEditingFood(prev => ({ 
                                                                ...prev, 
                                                                name: alt.name, 
                                                                calories: alt.calories, 
                                                                protein: alt.protein,
                                                                carbs: alt.carbs,
                                                                fat: alt.fat,
                                                                fiber: alt.fiber,
                                                                servingSize: alt.servingSize,
                                                                servingUnit: alt.servingUnit
                                                            }));
                                                            setInputValues({
                                                                calories: (alt.calories || 0).toString(),
                                                                protein: (alt.protein || 0).toString(),
                                                                carbs: (alt.carbs || 0).toString(),
                                                                fat: (alt.fat || 0).toString(),
                                                                servingSize: (alt.servingSize || 100).toString(),
                                                            });
                                                        }}
                                                        style={{ 
                                                            paddingHorizontal: 10, 
                                                            paddingVertical: 6, 
                                                            borderRadius: 16, 
                                                            backgroundColor: editingFood?.name === alt.name ? palette.primary.main : palette.background.paper,
                                                            marginRight: 6,
                                                            marginBottom: 6,
                                                            borderWidth: 1,
                                                            borderColor: palette.primary.main + '50'
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 12, color: editingFood?.name === alt.name ? '#fff' : palette.text.primary }}>{alt.name}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={[styles.inputLabel, { color: palette.text.secondary }]}>Kalorier (kcal)</Text>
                                    <TextInput 
                                        style={[styles.createInput, { borderColor: palette.border.default, color: palette.text.primary }]} 
                                        keyboardType="numeric" 
                                        value={inputValues.calories} 
                                        onChangeText={t => updateNumericField('calories', t)} 
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={[styles.inputLabel, { color: palette.text.secondary }]}>Protein (g)</Text>
                                    <TextInput 
                                        style={[styles.createInput, { borderColor: palette.border.default, color: palette.text.primary }]} 
                                        keyboardType="numeric" 
                                        value={inputValues.protein} 
                                        onChangeText={t => updateNumericField('protein', t)} 
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={[styles.inputLabel, { color: palette.text.secondary }]}>Kolhydrater (g)</Text>
                                    <TextInput 
                                        style={[styles.createInput, { borderColor: palette.border.default, color: palette.text.primary }]} 
                                        keyboardType="numeric" 
                                        value={inputValues.carbs} 
                                        onChangeText={t => updateNumericField('carbs', t)} 
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={[styles.inputLabel, { color: palette.text.secondary }]}>Fett (g)</Text>
                                    <TextInput 
                                        style={[styles.createInput, { borderColor: palette.border.default, color: palette.text.primary }]} 
                                        keyboardType="numeric" 
                                        value={inputValues.fat} 
                                        onChangeText={t => updateNumericField('fat', t)} 
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={[styles.inputLabel, { color: palette.text.secondary }]}>Enhet (t.ex. g, portion)</Text>
                                    <TextInput 
                                        style={[styles.createInput, { borderColor: palette.border.default, color: palette.text.primary }]} 
                                        value={editingFood?.servingUnit || 'g'} 
                                        onChangeText={t => setEditingFood(prev => ({ ...prev, servingUnit: t }))} 
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={[styles.inputLabel, { color: palette.text.secondary }]}>Storlek på enhet (t.ex. 100)</Text>
                                    <TextInput 
                                        style={[styles.createInput, { borderColor: palette.border.default, color: palette.text.primary }]} 
                                        keyboardType="numeric" 
                                        value={inputValues.servingSize} 
                                        onChangeText={t => updateNumericField('servingSize', t)} 
                                    />
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={[styles.createButton, { backgroundColor: palette.primary.main, borderRadius: borderRadius.l, marginTop: 24, justifyContent: 'center' }]} 
                                onPress={saveManualFood}
                                disabled={isLoading}
                            >
                                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createButtonText}>Spara matvara</Text>}
                            </TouchableOpacity>

                        </View>
                    ) : activeTab === 'search' ? (
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
                                    {isSearching && (
                                        <TouchableOpacity 
                                            style={[styles.createButton, { backgroundColor: palette.primary.main, borderRadius: borderRadius.l, opacity: isLoading ? 0.6 : 1 }]}
                                            onPress={() => handleCreateMissingFood()}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                                            ) : (
                                                <FontAwesome name="magic" size={16} color="#fff" style={{ marginRight: 8 }} />
                                            )}
                                            <Text style={styles.createButtonText}>
                                                {isLoading ? 'Analyserar...' : `Ai-skapa "${searchQuery}"`}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                <FlatList
                                    data={displayedItems}
                                    keyExtractor={(item, index) => item.id || index.toString()}
                                    renderItem={renderItem}
                                    keyboardShouldPersistTaps="handled"
                                    ListFooterComponent={
                                        isSearching ? (
                                            <TouchableOpacity 
                                                style={[styles.createButton, { backgroundColor: palette.primary.main, borderRadius: borderRadius.l, alignSelf: 'center', opacity: isLoading ? 0.6 : 1 }]}
                                                onPress={() => handleCreateMissingFood()}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                                                ) : (
                                                    <FontAwesome name="magic" size={16} color="#fff" style={{ marginRight: 8 }} />
                                                )}
                                                <Text style={styles.createButtonText}>
                                                    {isLoading ? 'Analyserar...' : `Hittar du inte rätt? Ai-skapa "${searchQuery}"`}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null
                                    }
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
            </KeyboardAvoidingView>
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
    createButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, marginTop: 24, marginBottom: 20 },
    createButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4, marginTop: 12 },
    createInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
});
