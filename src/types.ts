/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  name: string;
  email: string;
  joinedDate: string; // e.g. "October 2023"
  level: number;
  xp: number;
  streak: number;
  dhikrCount: number;
  isLoggedIn: boolean;
}

export interface PrayerState {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  tahajjud: boolean;
  ayatulKursi: boolean;
}

export interface DhikrState {
  subhanallahWabihamdihi: number;
  allahuAkbar: number;
  subhanallah: number;
  alhamdulillah: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  prayers: PrayerState;
  dhikr: DhikrState;
  score: number; // calculated spiritual strength percentage (0-100)
  reflection?: string; // custom AI generated or user reflection
}

export interface AppSettings {
  notifications: {
    adhanAlerts: boolean;
    prePrayerReminder: boolean;
    tahajjudAlert: boolean;
  };
  appearance: 'light' | 'dark' | 'system';
}

export interface DailyVerse {
  verse: string;
  translation: string;
  reference: string;
  reflection: string;
}
