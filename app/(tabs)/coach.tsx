import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { useSession } from '@/context/ctx';
import { db } from '@/lib/firebaseConfig';
import { generateAtlasResponse } from '@/services/aiService';
import { UserProfile } from '@/types';
import { buildAiContext } from '@/utils/aiContext';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { addDoc, collection, doc, increment, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Markdown from 'react-native-markdown-display';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'atlas';
    createdAt: any; // Firestore Timestamp
}

const QUICK_ACTIONS = [
    "Analysera min vecka",
    "Har jag tränat balanserat?",
    "Förslag på nästa pass?",
    "Jag har ont i knät"
];

export default function CoachScreen() {
    const { user } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [context, setContext] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!user) return;

        // 1. Build Context
        buildAiContext(user.uid).then(setContext);

        // 2. Subscribe to Messages
        const msgRef = collection(db, 'users', user.uid, 'coachMessages');
        const q = query(msgRef, orderBy('createdAt', 'asc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedMsgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];

            // If empty, add welcome message locally
            if (loadedMsgs.length === 0) {
                setMessages([{
                    id: 'init',
                    text: 'Hej! Jag är Atlas. Jag har tittat på din träningslogg. Vad funderar du på idag?',
                    sender: 'atlas',
                    createdAt: new Date()
                }]);
            } else {
                setMessages(loadedMsgs);
            }
        });

        // 3. Subscribe to User Profile (for AI settings)
        const userRef = doc(db, 'users', user.uid);
        const unsubProfile = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                setProfile(doc.data() as UserProfile);
            }
        });

        return () => {
            unsubscribe();
            unsubProfile();
        };
    }, [user]);

    const calculateCost = (inputText: string, outputText: string) => {
        // Gemini 1.5 Flash Pricing (approximate)
        // Input: $0.075 / 1M tokens
        // Output: $0.30 / 1M tokens
        // 1 Token ≈ 4 chars
        const inputTokens = inputText.length / 4;
        const outputTokens = outputText.length / 4;

        const inputCost = (inputTokens / 1000000) * 0.075;
        const outputCost = (outputTokens / 1000000) * 0.30;

        return inputCost + outputCost;
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || !user) return;

        // CHECK IF AI IS ENABLED
        if (profile?.aiEnabled === false) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: "⚠️ Atlas är avstängd i din profil.",
                sender: 'atlas',
                createdAt: new Date()
            }]);
            return;
        }

        setInputText('');
        setIsLoading(true);

        try {
            // 1. Save User Message to DB
            const msgRef = collection(db, 'users', user.uid, 'coachMessages');
            await addDoc(msgRef, {
                text: text.trim(),
                sender: 'user',
                createdAt: serverTimestamp()
            });

            // 2. Prepare History for AI (Last 10 messages)
            const recentHistory = messages.slice(-10).map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            } as any));
            recentHistory.push({ role: 'user', content: text }); // Add current

            // 3. Call AI
            const currentContext = context || await buildAiContext(user.uid);
            const aiText = await generateAtlasResponse(recentHistory, currentContext);

            // 4. Extract Memories
            const memoryRegex = /\[\[MEMORY:\s*(.*?)\]\]/g;
            let match;
            const memoriesToSave: string[] = [];
            let cleanAiText = aiText;

            while ((match = memoryRegex.exec(aiText)) !== null) {
                memoriesToSave.push(match[1].trim());
            }

            // Remove tags from display text
            cleanAiText = cleanAiText.replace(memoryRegex, '').trim();

            // Save Memories to Firestore
            if (memoriesToSave.length > 0) {
                const memRef = collection(db, 'users', user.uid, 'memories');
                for (const memContent of memoriesToSave) {
                    await addDoc(memRef, {
                        content: memContent,
                        type: 'auto',
                        createdAt: serverTimestamp()
                    });
                }
                // Optional: Toast or small indicator? For now, we trust the process.
            }

            // 5. Save AI Response to DB (Clean text)
            await addDoc(msgRef, {
                text: cleanAiText,
                sender: 'atlas',
                createdAt: serverTimestamp()
            });

            // 5. Update Cost
            const cost = calculateCost(text, aiText);
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                aiTotalCost: increment(cost)
            });

        } catch (e) {
            console.error("Chat Error", e);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.atlasBubble
            ]}>
                {!isUser && (
                    <View style={styles.avatarContainer}>
                        <FontAwesome name="stethoscope" size={14} color="white" />
                    </View>
                )}

                {isUser ? (
                    <Text style={[styles.messageText, styles.userText]}>
                        {item.text}
                    </Text>
                ) : (
                    <View style={{ flex: 1 }}>
                        <Markdown style={markdownStyles}>
                            {item.text}
                        </Markdown>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Atlas Coach</Text>
                <TouchableOpacity style={styles.historyIcon}>
                    <FontAwesome name="history" size={20} color={Palette.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={QUICK_ACTIONS}
                    keyExtractor={item => item}
                    contentContainerStyle={{ paddingHorizontal: Spacing.m }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.chip}
                            onPress={() => sendMessage(item)}
                        >
                            <Text style={styles.chipText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Chat Area */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.chatContainer}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Fråga Atlas..."
                        value={inputText}
                        onChangeText={setInputText}
                        placeholderTextColor={Palette.text.disabled}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText && !isLoading) && styles.sendButtonDisabled]}
                        onPress={() => sendMessage(inputText)}
                        disabled={!inputText || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Ionicons name="send" size={20} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.m,
        backgroundColor: Palette.background.paper,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border.default,
        position: 'relative',
    },
    headerTitle: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    historyIcon: {
        position: 'absolute',
        right: Spacing.m,
        padding: Spacing.s,
    },

    // Quick Actions
    quickActionsContainer: {
        paddingVertical: Spacing.m,
        backgroundColor: Palette.background.default,
    },
    chip: {
        backgroundColor: Palette.background.paper,
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        borderRadius: BorderRadius.round,
        marginRight: Spacing.s,
        borderWidth: 1,
        borderColor: Palette.primary.main,
    },
    chipText: {
        color: Palette.primary.main,
        fontSize: Typography.size.s,
        fontWeight: '600',
    },

    // Chat
    chatContainer: {
        paddingHorizontal: Spacing.m,
        paddingBottom: Spacing.m,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: Spacing.m,
        borderRadius: BorderRadius.l,
        marginBottom: Spacing.s,
        flexDirection: 'row',
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: Palette.primary.main,
        borderBottomRightRadius: 2,
    },
    atlasBubble: {
        alignSelf: 'flex-start',
        backgroundColor: Palette.background.paper,
        borderBottomLeftRadius: 2,
        // Shadows
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    messageText: {
        fontSize: Typography.size.m,
        lineHeight: 22,
    },
    userText: {
        color: 'white',
    },
    atlasText: {
        color: Palette.text.primary,
    },
    avatarContainer: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: Palette.accent.main,
        alignItems: 'center', justifyContent: 'center',
        marginRight: Spacing.s,
        marginTop: 0,
    },

    // Input
    inputContainer: {
        flexDirection: 'row',
        padding: Spacing.m,
        backgroundColor: Palette.background.paper,
        borderTopWidth: 1,
        borderTopColor: Palette.border.default,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: Palette.background.default,
        borderRadius: BorderRadius.round,
        paddingHorizontal: Spacing.m,
        paddingVertical: 10, // Fixed height feel
        fontSize: Typography.size.m,
        color: Palette.text.primary,
        marginRight: Spacing.s,
    },
    sendButton: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Palette.primary.main,
        alignItems: 'center', justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: Palette.text.disabled,
    },
});

const markdownStyles = StyleSheet.create({
    body: {
        fontSize: Typography.size.m,
        color: Palette.text.primary,
        lineHeight: 22,
    },
    heading1: {
        fontSize: Typography.size.l,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
        color: Palette.primary.main,
    },
    heading2: {
        fontSize: Typography.size.m,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
        color: Palette.text.primary,
    },
    strong: {
        fontWeight: 'bold',
        color: Palette.text.primary,
    },
    em: {
        fontStyle: 'italic',
    },
    list_item: {
        marginVertical: 4,
    },
    bullet_list_icon: {
        marginLeft: 8,
        marginRight: 8,
        ...Platform.select({
            android: { marginTop: 4 }, // Adjust alignment
            ios: { marginTop: 0 }
        })
    },
    paragraph: {
        marginTop: 0,
        marginBottom: 8,
    },
    link: {
        color: Palette.primary.main,
        textDecorationLine: 'underline',
    },
    blockquote: {
        backgroundColor: Palette.background.default,
        borderLeftColor: Palette.accent.main,
        borderLeftWidth: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginVertical: 4,
    }
});
