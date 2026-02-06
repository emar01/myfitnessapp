
export const Palette = {
    primary: {
        main: '#1B4436', // Forest Green
        light: '#2C5E4E',
        dark: '#0F2C21',
        contrastText: '#FFFFFF',
    },
    accent: {
        main: '#D97960', // Salmon/Coral
        light: '#E69A86',
        dark: '#B0563E',
        contrastText: '#FFFFFF',
    },
    background: {
        default: '#F8F9FA', // Off-white/Light Grey
        paper: '#FFFFFF',
        input: '#F0F0F0',
    },
    text: {
        primary: '#1A1A1A',
        secondary: '#666666',
        disabled: '#9E9E9E',
        inverse: '#FFFFFF',
    },
    status: {
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#F44336',
        info: '#2196F3',
    },
    border: {
        default: '#EEEEEE',
        focus: '#1B4436',
    },
};

export const Spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const BorderRadius = {
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    round: 9999,
};

export const Layout = {
    maxWidth: 800,
    container: {
        flex: 1,
        width: '100%' as any, // Cast to any to avoid DimensionValue issues across RN versions
        maxWidth: 800,
        alignSelf: 'center' as 'center',
    },
    // Useful for full-screen setups where we only want to constrain content
    contentContainer: {
        width: '100%' as any,
        maxWidth: 800,
        alignSelf: 'center' as 'center',
    }
};

export const Typography = {
    fontFamily: {
        regular: 'SpaceMono', // Placeholder, we might want to swap this if user has other fonts
        bold: 'SpaceMono',
    },
    size: {
        xs: 12,
        s: 14,
        m: 16,
        l: 18,
        xl: 24,
        xxl: 32,
        display: 48,
    },
    weight: {
        regular: '400',
        medium: '500',
        bold: '700',
    },
};

import { Platform } from 'react-native';

export const Shadows = {
    small: Platform.select({
        web: { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)' },
        default: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        },
    }),
    medium: Platform.select({
        web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' },
        default: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
        },
    }),
    large: Platform.select({
        web: { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)' },
        default: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
        },
    }),
};
