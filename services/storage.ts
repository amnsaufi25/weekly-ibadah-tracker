import { WeeklyLog } from '../types';

const STORAGE_KEY = 'ibadah_tracker_data_v1';

export const getStoredData = (): WeeklyLog => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to load data", e);
    return {};
  }
};

export const saveStoredData = (data: WeeklyLog) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};
