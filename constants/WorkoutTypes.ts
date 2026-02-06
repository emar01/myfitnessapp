export const WORKOUT_CATEGORIES = [
    { label: 'Styrketräning', value: 'styrketräning' },
    { label: 'Löpning', value: 'löpning' },
    { label: 'Rehab', value: 'rehab' },
    { label: 'Rörlighet', value: 'rörlighet' },
    { label: 'Övrigt', value: 'övrigt' }
] as const;

export const RUNNING_SUBCATEGORIES = [
    { label: 'Distans', value: 'distans' },
    { label: 'Långpass', value: 'långpass' },
    { label: 'Intervall', value: 'intervall' },
    { label: 'Fartpass', value: 'fartpass' },
    { label: 'Testlopp', value: 'testlopp' }
] as const;

export const STRENGTH_SUBCATEGORIES = [
    { label: 'Crossfit', value: 'crossfit' },
    { label: 'Styrka', value: 'styrka' },
    { label: 'Rörlighet', value: 'rörlighet' }
] as const;

export const PROGRAM_DURATIONS = [
    '4 veckor',
    '6 veckor',
    '8 veckor',
    'Tillsvidare'
] as const;

export const PROGRAM_TYPES = [
    { label: 'Periodization', value: 'period' },
    { label: 'Daily Challenge', value: 'daily' }
] as const;
