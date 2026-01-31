import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { auth } from '@/lib/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
// import { GoogleSignin } from '@react-native-google-signin/google-signin'; // TODO: Enable when installed/configured
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Google Signin Config Placeholder
// GoogleSignin.configure({
//     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
// });

export default function LoginScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        if (Platform.OS === 'web') {
            try {
                setLoading(true);
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
                router.replace('/(tabs)');
            } catch (error: any) {
                console.error("Google Web Login Error:", error);
                if (error.code === 'auth/popup-closed-by-user') return;
                Alert.alert('Inloggning misslyckades', error.message);
            } finally {
                setLoading(false);
            }
        } else {
            // Validation check for real Google Auth
            Alert.alert('Google Login', 'Google Sign-In kräver konfiguration i Firebase Console. I dev-läge, använd "Dev Login" om du inte har nycklar.');
        }
    };

    const handleDevLogin = async () => {
        setLoading(true);
        const DEV_EMAIL = "dev_admin@myfitnessapp.com";
        const DEV_PASS = "DevPass123!";

        console.log("Attempting Dev Login...");

        try {
            await signInWithEmailAndPassword(auth, DEV_EMAIL, DEV_PASS);
            router.replace('/(tabs)');
        } catch (loginError: any) {
            console.log("Dev Login failed, attempting creation...", loginError.code);

            // auth/invalid-credential or auth/user-not-found means user doesn't exist (or wrong pass, but we use const pass)
            if (loginError.code === 'auth/invalid-credential' || loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-email') {
                try {
                    await createUserWithEmailAndPassword(auth, DEV_EMAIL, DEV_PASS);
                    Alert.alert('Konto Skapat', 'Dev-konto skapat och inloggad!');
                    router.replace('/(tabs)');
                } catch (createError: any) {
                    console.error("Dev Creation Error:", createError);
                    if (createError.code === 'auth/operation-not-allowed') {
                        Alert.alert(
                            'Kräver Inställning',
                            'Email/Lösenord är INTE aktiverat i ditt Firebase-projekt.\n\nGå till Firebase Console -> Authentication -> Sign-in method och aktivera "Email/Password".'
                        );
                    } else if (createError.code === 'auth/email-already-in-use') {
                        // Should satisfy the login first, but weird race condition or password changed?
                        Alert.alert('Fel', 'Kontot finns redan men lösenordet stämmer inte?');
                    } else {
                        Alert.alert('Kunde inte skapa konto', createError.message);
                    }
                }
            } else {
                Alert.alert('Login Error', loginError.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Hidden trigger info
    const handleLongPressSecret = async () => {
        if (__DEV__) {
            Alert.alert('Dev Info', 'Dev läge är aktivt.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>

                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="fitness" size={48} color={Palette.primary.main} />
                    </View>
                    <TouchableOpacity onLongPress={handleLongPressSecret} delayLongPress={2000}>
                        <Text style={styles.title}>My Fitness App</Text>
                    </TouchableOpacity>
                    <Text style={styles.subtitle}>Din personliga träningspartner</Text>
                </View>

                {/* Login Actions */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <View style={styles.googleContent}>
                            <Ionicons name="logo-google" size={24} color={Palette.text.primary} style={{ marginRight: 12 }} />
                            <Text style={styles.googleText}>Logga in med Google</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Developer Login - ONLY visible in __DEV__ */}
                    {__DEV__ && (
                        <TouchableOpacity
                            style={[styles.googleButton, { backgroundColor: '#F0F0F0', borderColor: Palette.status.info, marginTop: 10 }]}
                            onPress={handleDevLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={Palette.text.primary} />
                            ) : (
                                <View style={styles.googleContent}>
                                    <Ionicons name="code-slash" size={24} color={Palette.status.info} style={{ marginRight: 12 }} />
                                    <Text style={[styles.googleText, { color: Palette.status.info }]}>Dev Login</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    <Text style={styles.disclaimer}>
                        Genom att logga in godkänner du våra användarvillkor och integritetspolicy.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        flex: 1,
        padding: Spacing.xl,
        justifyContent: 'space-between',
        paddingVertical: 60,
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#F0F7F4', // Light green tint
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.l,
    },
    title: {
        fontSize: Typography.size.xxl,
        fontWeight: 'bold',
        color: Palette.primary.main,
        textAlign: 'center',
        marginBottom: Spacing.s,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: Typography.size.l,
        color: Palette.text.secondary,
        textAlign: 'center',
    },
    actionContainer: {
        width: '100%',
        marginBottom: 40,
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        paddingVertical: 16,
        borderRadius: BorderRadius.l,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        ...Shadows.small,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.l,
    },
    googleContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    googleText: {
        fontSize: Typography.size.m,
        fontWeight: '600',
        color: Palette.text.primary,
    },
    disclaimer: {
        fontSize: 12,
        color: Palette.text.disabled,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: Spacing.m,
    }
});
