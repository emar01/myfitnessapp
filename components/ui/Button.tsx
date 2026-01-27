import { BorderRadius, Palette, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export default function Button({
    title,
    variant = 'primary',
    size = 'medium',
    loading = false,
    style,
    textStyle,
    disabled,
    ...props
}: ButtonProps) {

    const getBackgroundColor = () => {
        if (disabled) return Palette.text.disabled;
        switch (variant) {
            case 'primary': return Palette.primary.main;
            case 'secondary': return Palette.accent.main;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return Palette.primary.main;
        }
    };

    const getTextColor = () => {
        if (disabled) return Palette.text.inverse;
        switch (variant) {
            case 'primary': return Palette.primary.contrastText;
            case 'secondary': return Palette.accent.contrastText;
            case 'outline': return Palette.primary.main;
            case 'ghost': return Palette.text.primary;
            default: return Palette.primary.contrastText;
        }
    };

    const getBorder = () => {
        if (variant === 'outline') {
            return {
                borderWidth: 1,
                borderColor: disabled ? Palette.text.disabled : Palette.primary.main,
            };
        }
        return {};
    };

    const getHeight = () => {
        switch (size) {
            case 'small': return 32;
            case 'medium': return 48;
            case 'large': return 56;
            default: return 48;
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'small': return Typography.size.xs;
            case 'medium': return Typography.size.m;
            case 'large': return Typography.size.l;
            default: return Typography.size.m;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    height: getHeight(),
                    ...getBorder(),
                },
                style,
            ]}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text
                    style={[
                        styles.text,
                        {
                            color: getTextColor(),
                            fontSize: getFontSize(),
                        },
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.round,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
    },
    text: {
        fontWeight: '600',
        fontFamily: Typography.fontFamily.bold,
    },
});
