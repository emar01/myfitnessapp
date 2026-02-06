export type WorkoutCategory = 'löpning' | 'styrketräning' | 'rehab' | 'rörlighet' | 'övrigt';
export type RunningSubcategory = 'distans' | 'långpass' | 'intervall' | 'fartpass' | 'testlopp';
export type StrengthSubcategory = 'crossfit' | 'styrka' | 'rörlighet';

export interface Exercise {
    id?: string;
    name: string;
    type: string;
    primaryMuscleGroup: string;
    isBodyweight: boolean;
    videoLink?: string;
    defaultVideoUrl?: string; // Legacy/Fallback
    isPublic?: boolean;
    createdBy?: string;
}

export interface WorkoutSet {
    id: string;
    reps: number;
    weight: number;
    isCompleted: boolean;
    isPr?: boolean;
    type?: 'warmup' | 'normal' | 'drop' | 'failure';
    // Running specific fields
    distance?: number; // in km
    duration?: number; // in seconds
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
    scheduledDate?: Date;
    status: 'Planned' | 'In Progress' | 'Completed';
    exercises: WorkoutExercise[];
    category?: WorkoutCategory;
    subcategory?: RunningSubcategory | StrengthSubcategory;
    notes?: string;
    programId?: string;
    stravaActivityId?: string;
    distance?: number; // in km
    duration?: number; // in seconds
    completedAt?: Date | any; // Firestore timestamp or Date
}

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    weight?: number;
    height?: number;
    age?: number;
    gender?: 'Man' | 'Kvinna' | 'Annat';
    aiEnabled?: boolean;
    aiTotalCost?: number; // Accumulated cost in USD
    role?: 'user' | 'admin';
}

export interface PersonalRecord {
    id?: string;
    exerciseId: string;
    exerciseName: string;
    weight: number;
    reps: number;
    date: any; // Timestamp
    workoutId?: string;
}

export interface ProgramScheduleItem {
    dayOffset: number; // 0 = start date, 1 = day after, etc.
    workoutTemplateId?: string; // Link to a predefined workout
    workoutTitle?: string; // Fallback or override title
    description?: string;
}

export interface Program {
    id?: string;
    title: string;
    duration: string;
    type: 'daily' | 'period'; // Updated type
    category: string; // e.g. 'Styrketräning'
    description?: string;
    workoutIds?: string[];
    schedule?: ProgramScheduleItem[];
    isPublic?: boolean;
    createdBy?: string;
}

export interface WorkoutTemplate {
    id?: string;
    name: string;
    category: WorkoutCategory;
    subcategory?: RunningSubcategory | StrengthSubcategory;
    exercises: WorkoutExercise[];
    note?: string;
    distance?: number; // km
    duration?: number; // minutes
    isPublic?: boolean;
    createdBy?: string;
}
