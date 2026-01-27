import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface VideoPlayerProps {
    url: string | null;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
    if (!url) {
        return (
            <View style={styles.center}>
                <Text style={styles.text}>No video URL provided.</Text>
            </View>
        );
    }

    // Prepare Embed URL for YouTube
    let embedUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
        embedUrl = url.replace('watch?v=', 'embed/');
    } else if (url.includes('youtu.be/')) {
        embedUrl = url.replace('youtu.be/', 'www.youtube.com/embed/');
    }

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ border: 'none', height: '100%', width: '100%' }}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: embedUrl }} // WebView handles regular Youtube links well, but embed is safer
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111',
    },
    text: {
        color: '#FFF',
    }
});
