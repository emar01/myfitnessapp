import { auth } from '@/lib/firebaseConfig';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import React from 'react';

const AuthContext = React.createContext<{
    signIn: () => void;
    signOut: () => void;
    user: User | null;
    isLoading: boolean;
}>({
    signIn: () => null,
    signOut: () => null,
    user: null,
    isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
    const value = React.useContext(AuthContext);
    if (process.env.NODE_ENV !== 'production') {
        if (!value) {
            throw new Error('useSession must be wrapped in a <SessionProvider />');
        }
    }
    return value;
}

export function SessionProvider(props: React.PropsWithChildren) {
    const [user, setUser] = React.useState<User | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider
            value={{
                signIn: () => { },
                signOut: () => signOut(auth),
                user,
                isLoading,
            }}>
            {props.children}
        </AuthContext.Provider>
    );
}
