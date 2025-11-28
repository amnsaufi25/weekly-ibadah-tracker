export enum HabitType {
  BOOLEAN = 'BOOLEAN',
  COUNTER = 'COUNTER',
  MAX_COUNTER = 'MAX_COUNTER'
}

export interface HabitConfig {
  id: string;
  label: string;
  type: HabitType;
  max?: number; // For MAX_COUNTER
  unit?: string; // For display, e.g., "pages", "x"
  icon: string;
  description?: string;
}

export interface DailyLog {
  [habitId: string]: number | boolean;
}

export interface WeeklyLog {
  [dateKey: string]: DailyLog;
}

export const HABITS: HabitConfig[] = [
  { id: 'solat_fardhu', label: 'Solat Fardhu', type: HabitType.MAX_COUNTER, max: 5, unit: 'times', icon: 'Sun', description: '5 Daily Prayers' },
  { id: 'tilawah', label: 'Tilawah Al-Quran', type: HabitType.MAX_COUNTER, max: 20, unit: 'pages', icon: 'BookOpen', description: 'Quran recitation' },
  { id: 'solat_subuh', label: 'Solat Subuh', type: HabitType.BOOLEAN, icon: 'Sunrise', description: 'On time / Jamaah' },
  { id: 'solat_rawatib', label: 'Solat Rawatib', type: HabitType.MAX_COUNTER, max: 5, unit: 'times', icon: 'Plus', description: 'Sunnah prayers' },
  { id: 'al_mathurat', label: 'Al-Mathurat', type: HabitType.MAX_COUNTER, max: 2, unit: 'times', icon: 'BookHeart', description: 'Morning & Evening' },
  { id: 'qiamullail', label: 'Qiamullail', type: HabitType.BOOLEAN, icon: 'Moon', description: 'Night prayer' },
  { id: 'istighfar', label: 'Istighfar', type: HabitType.BOOLEAN, icon: 'RefreshCcw', description: 'Seeking forgiveness' },
  { id: 'puasa', label: 'Puasa', type: HabitType.BOOLEAN, icon: 'UtensilsCrossed', description: 'Fasting' },
  { id: 'bersenam', label: 'Bersenam', type: HabitType.BOOLEAN, icon: 'Activity', description: 'Exercise' },
];

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];