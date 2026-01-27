import Button from '@/components/ui/Button';
import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');

    const handleLogin = () => {
        // Navigate to onboarding flow for new users
        router.replace('/onboarding/plans');
    };

    return (
        <View style={styles.container}>
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1552674605-46d52677663d?q=80&w=2070&auto=format&fit=crop' }}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                {/* Overlay Gradient/Tint could go here */}
                <View style={styles.overlay} />

                <SafeAreaView style={styles.safeArea}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>

                        <View style={styles.content}>
                            <Text style={styles.title}>Logga in</Text>

                            <View style={styles.formContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#666"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />

                                <Button
                                    title="Fortsätt"
                                    onPress={handleLogin}
                                    style={styles.button}
                                />
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerTitle}>Löpning & Livet</Text>
                            <Text style={styles.footerSubtitle}>Med Fredrik och Simon</Text>
                        </View>

                    </KeyboardAvoidingView>
                </SafeAreaView>

            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)', // Slight dark overlay for text readability
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'space-between',
    },
    content: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xxl * 2,
        alignItems: 'center',
    },
    title: {
        fontSize: Typography.size.xxl,
        fontFamily: Typography.fontFamily.bold,
        color: '#FFF', // White text on image
        marginBottom: Spacing.xl,
        fontWeight: 'bold',
    },
    formContainer: {
        width: '100%',
        gap: Spacing.m,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: BorderRadius.round,
        paddingHorizontal: Spacing.l,
        paddingVertical: Spacing.m,
        fontSize: Typography.size.m,
        color: Palette.text.primary,
    },
    button: {
        width: '100%',
        // Primary green from design system
    },
    footer: {
        paddingBottom: Spacing.xl,
        alignItems: 'center',
    },
    footerTitle: {
        color: '#FFF',
        fontSize: Typography.size.xl,
        fontWeight: 'bold',
        fontFamily: Typography.fontFamily.bold,
    },
    footerSubtitle: {
        color: '#E0E0E0',
        fontSize: Typography.size.s,
        marginTop: Spacing.xs,
    },
});
