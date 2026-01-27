export interface Exercise {
    id?: string;
    name: string;
    type: string;
    primaryMuscleGroup: string;
    isBodyweight: boolean;
    defaultVideoUrl?: string;
}

export interface WorkoutSet {
    id: string;
    reps: number;
    weight: number;
    isCompleted: boolean;
    isPr?: boolean;
    type?: 'warmup' | 'normal' | 'drop' | 'failure';
}

export interface WorkoutExercise {
    exerciseId: string;
    name: string; // Denormalized name
    sets: WorkoutSet[];
    videoLink?: string;
    isBodyweight: boolean;
}

export interface Workout {
    id?: string;
    userId: string;
    name: string;
    date: Date;
    status: 'Planned' | 'In Progress' | 'Completed';
    exercises: WorkoutExercise[];
    notes?: string;
    programId?: string;
    stravaActivityId?: string;
}

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    weight?: number;
    height?: number;
}
