import WorkoutDetailsView from '@/components/WorkoutDetailsView';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function WorkoutDetailsScreen() {
    const { id, type } = useLocalSearchParams();

    const workoutId = Array.isArray(id) ? id[0] : id;

    if (!workoutId) return <View />;

    return (
        <WorkoutDetailsView
            workoutId={workoutId}
            workoutType={type as 'template' | 'workout'}
        />
    );
}
