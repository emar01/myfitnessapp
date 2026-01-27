import { BorderRadius, Palette, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function WorkoutDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id, title, date, status, type } = params;

    // Mock data to match screenshot
    // In a real app we would fetch this by ID
    const isCompleted = status === 'completed';

    return (
        <View style={styles.container}>
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=2070&auto=format&fit=crop' }}
                style={styles.headerImage}
            >
                <View style={styles.headerOverlay}>
                    <SafeAreaView>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <FontAwesome name="chevron-left" size={24} color="#FFF" />
                        </TouchableOpacity>

                        <View style={styles.headerContent}>
                            <Text style={styles.headerDate}>{date || 'Måndag 18 Mars'}</Text>
                            <Text style={styles.headerTitle}>{title || 'Långpass'}</Text>
                        </View>
                    </SafeAreaView>
                </View>
            </ImageBackground>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* COMPLETED CARD (Blue) */}
                {isCompleted && (
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <FontAwesome name="check-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.summaryTitle}>Pass klarmarkerat!</Text>
                            </View>
                            <FontAwesome name="ellipsis-v" size={20} color="#FFF" />
                        </View>

                        <View style={styles.statsRow}>
                            <View>
                                <Text style={styles.statLabel}>Tid</Text>
                                <Text style={styles.statValue}>32:17</Text>
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Dist</Text>
                                <Text style={styles.statValue}>7.7 <Text style={{ fontSize: 14, fontWeight: 'normal' }}>km</Text></Text>
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Fart <Text style={{ fontSize: 10, fontWeight: 'normal' }}>(min/km)</Text></Text>
                                <Text style={styles.statValue}>4:42</Text>
                            </View>
                        </View>

                        <View style={[styles.statsRow, { marginTop: Spacing.m }]}>
                            <View>
                                <Text style={styles.statLabel}>Glädje</Text>
                                <Text style={styles.statValue}>😁</Text>
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Ansträngning</Text>
                                <Text style={styles.statValue}>3/10 <Text style={{ fontSize: 14, fontWeight: 'normal' }}>Medel</Text></Text>
                            </View>
                        </View>

                        <View style={styles.commentContainer}>
                            <Text style={styles.statLabel}>Kommentar</Text>
                            <Text style={styles.commentText}>Kul pass i månskenet :)</Text>
                        </View>
                    </View>
                )}

                {/* PLANNED CARD (Actions) */}
                {!isCompleted && (
                    <View style={styles.actionContainer}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionText}>Skippa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionText}>Byt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.primaryAction]}
                            onPress={() => router.push({ pathname: '/workout/log', params: { workoutName: title } })}
                        >
                            <Text style={[styles.actionText, { color: Palette.text.primary }]}>Klarmarkera</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* DETAILS SECTION */}
                <View style={styles.detailsContainer}>
                    <View style={styles.detailsHeader}>
                        <Text style={styles.detailsTitle}>Långpass - 75 min</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>Tid</Text>
                            <Text style={styles.detailValue}>60 - 70 min</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>Fart</Text>
                            <Text style={styles.detailValue}>Långsamt fokus på...</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Vila under passet</Text>
                        <Text style={styles.detailValue}>Ingen, men stanna, gå eller gå ner... om du är trött.</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Ansträngning</Text>
                        <View style={styles.sliderVisual}>
                            <View style={[styles.sliderTrack, { backgroundColor: '#E0E0E0' }]} />
                            <View style={[styles.sliderFill, { width: '40%', backgroundColor: '#5D9CEC' }]} />
                        </View>
                        <Text style={styles.detailSmall}>4/10 lätt</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <FontAwesome name="file-text-o" size={14} color={Palette.text.secondary} style={{ marginRight: 6 }} />
                            <Text style={styles.detailLabel}>Beskrivning</Text>
                        </View>
                        <Text style={styles.descriptionText}>
                            Beroende på känslan i kroppen kan du springa mellan 60 - 75 minuter. Långpasset är ett av de viktigaste passen...
                        </Text>
                        <Text style={[styles.descriptionText, { marginTop: 8 }]}>
                            Det är ett njutarpass!
                        </Text>
                    </View>

                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Palette.background.default,
    },
    headerImage: {
        width: '100%',
        height: 250,
    },
    headerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'space-between',
        padding: Spacing.m,
    },
    backButton: {
        marginTop: Spacing.s,
    },
    headerContent: {
        marginBottom: Spacing.l,
    },
    headerDate: {
        color: '#E0E0E0',
        fontSize: Typography.size.s,
        fontWeight: '600',
        marginBottom: 4,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: Typography.size.xxl,
        fontFamily: Typography.fontFamily.bold,
        fontWeight: 'bold',
    },
    content: {
        marginTop: -20, // Overlap header
        borderTopLeftRadius: BorderRadius.l,
        borderTopRightRadius: BorderRadius.l,
        backgroundColor: Palette.background.default,
        padding: Spacing.m,
    },
    // BLUE SUMMARY CARD
    summaryCard: {
        backgroundColor: '#5282CA', // Matching screenshot blue
        borderRadius: BorderRadius.m,
        padding: Spacing.m,
        marginBottom: Spacing.l,
        ...Shadows.medium,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.m,
    },
    summaryTitle: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: Typography.size.m,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: Typography.size.xs,
        fontWeight: '600',
        marginBottom: 2,
    },
    statValue: {
        color: '#FFF',
        fontSize: Typography.size.l,
        fontWeight: 'bold',
    },
    commentContainer: {
        marginTop: Spacing.m,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        paddingTop: Spacing.s,
    },
    commentText: {
        color: '#FFF',
        fontStyle: 'italic',
    },

    // ACTION BUTTONS (Planned)
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.l,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingVertical: Spacing.s,
        marginHorizontal: 4,
        borderRadius: BorderRadius.round,
        alignItems: 'center',
        ...Shadows.small,
    },
    primaryAction: {
        backgroundColor: '#FFF', // Keeping white background as per screenshot
        borderWidth: 2,
        borderColor: Palette.text.primary, // Dark border to signify primary
    },
    actionText: {
        fontWeight: 'bold',
        fontSize: Typography.size.s,
        color: Palette.text.primary,
    },

    // DETAILS SECTION
    detailsContainer: {
        backgroundColor: Palette.background.paper,
        borderRadius: BorderRadius.m,
        padding: 0, // Header is colored
        overflow: 'hidden',
        ...Shadows.small,
    },
    detailsHeader: {
        backgroundColor: '#5282CA', // Blue header
        padding: Spacing.s,
        paddingHorizontal: Spacing.m,
    },
    detailsTitle: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: Typography.size.s,
    },
    detailRow: {
        flexDirection: 'row',
        padding: Spacing.m,
    },
    detailSection: {
        padding: Spacing.m,
    },
    detailLabel: {
        fontWeight: 'bold',
        fontSize: Typography.size.xs,
        marginBottom: 4,
        color: Palette.text.primary,
    },
    detailValue: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
    },
    detailSmall: {
        fontSize: Typography.size.xs,
        color: Palette.text.secondary,
        textAlign: 'right',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: Palette.border.default,
        marginHorizontal: Spacing.m,
    },
    sliderVisual: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E0E0E0',
        position: 'relative',
        overflow: 'hidden',
    },
    sliderTrack: {
        ...StyleSheet.absoluteFillObject,
    },
    sliderFill: {
        height: '100%',
    },
    descriptionText: {
        fontSize: Typography.size.s,
        color: Palette.text.secondary,
        lineHeight: 20,
    }
});
