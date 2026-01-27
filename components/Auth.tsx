import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { Button, Platform, StyleSheet, View } from 'react-native'
import { auth } from '../lib/firebaseConfig'

export default function Auth() {
    GoogleSignin.configure({
        scopes: ['https://www.googleapis.com/auth/drive.readonly'], // example scope
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    })

    async function signInWithGoogle() {
        try {
            if (Platform.OS === 'web') {
                const provider = new GoogleAuthProvider()
                const { signInWithPopup } = await import('firebase/auth')
                await signInWithPopup(auth, provider)
            } else {
                await GoogleSignin.hasPlayServices()
                const userInfo: any = await GoogleSignin.signIn()
                if (userInfo.idToken) {
                    const credential = GoogleAuthProvider.credential(userInfo.idToken);
                    await signInWithCredential(auth, credential);
                } else {
                    throw new Error('No ID token present!')
                }
            }
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
            } else {
                // some other error happened
                console.error(error)
            }
        }
    }

    return (
        <View style={styles.container}>
            <Button title="Sign in with Google" onPress={signInWithGoogle} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 12,
    },
})
