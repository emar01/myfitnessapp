import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Simple fallback for web since react-native-markdown-display doesn't support web
export const MarkdownDisplay = (props: any) => {
    return (
        <View style={styles.container}>
            <Text style={[styles.text, props.style?.body]}>{props.children}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // Basic container style
    },
    text: {
        fontSize: 16,
        color: '#000',
    }
});
