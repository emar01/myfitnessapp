import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
    themePreference: ThemePreference;
    setThemePreference: (pref: ThemePreference) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

    useEffect(() => {
        // Load saved preference
        AsyncStorage.getItem('theme_preference').then((value) => {
            if (value === 'light' || value === 'dark' || value === 'system') {
                setThemePreferenceState(value as ThemePreference);
            }
        });
    }, []);

    const setThemePreference = (pref: ThemePreference) => {
        setThemePreferenceState(pref);
        AsyncStorage.setItem('theme_preference', pref);
    };

    const isDark =
        themePreference === 'system'
            ? systemColorScheme === 'dark'
            : themePreference === 'dark';

    return (
        <ThemeContext.Provider value={{ themePreference, setThemePreference, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
}
