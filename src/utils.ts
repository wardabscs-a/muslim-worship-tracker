/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DailyLog, PrayerState, DhikrState } from "./types";
import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes, Madhab } from "adhan";

// Dynamic Hijri Date Calculator
export function getFormattedDateString(dateObj: Date = new Date()): { Gregorian: string; Hijri: string } {
  // Gregorian Formatting e.g. "Friday, 17 Jul"
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const dayNum = dateObj.getDate();
  const monthName = dateObj.toLocaleDateString("en-US", { month: "short" });
  const gregorianStr = `${weekday}, ${dayNum} ${monthName}`;

  // Hijri Approximation: Using Intl.DateTimeFormat
  try {
    const hijriFormatter = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const hijriParts = hijriFormatter.format(dateObj);
    return {
      Gregorian: gregorianStr,
      Hijri: hijriParts,
    };
  } catch (e) {
    return {
      Gregorian: gregorianStr,
      Hijri: "2 Safar 1448",
    };
  }
}

export type CityName =
  | "Sialkot"
  | "Lahore"
  | "Karachi"
  | "Islamabad"
  | "Peshawar"
  | "Multan"
  | "Quetta";

export const CITIES: CityName[] = [
  "Sialkot",
  "Lahore",
  "Karachi",
  "Islamabad",
  "Peshawar",
  "Multan",
  "Quetta",
];

// Coordinates map for accurate astronomical calculation
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Sialkot: { lat: 32.4945, lng: 74.5229 },
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
  Multan: { lat: 30.1575, lng: 71.5249 },
  Quetta: { lat: 30.1798, lng: 66.9750 },
};

// Converts "19:06" or "19:06:00" to "07:06 PM"
export function convert24To12(time24: string): string {
  if (!time24) return "";
  const cleanTime = time24.split(" ")[0];
  const [hoursStr, minutesStr] = cleanTime.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return time24;
  
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

// Calculate exact prayer times using adhan library
export function calculatePrayerTimes(city: string = "Sialkot", dateObj: Date = new Date()) {
  const coords = CITY_COORDINATES[city] || CITY_COORDINATES["Sialkot"];
  const coordinates = new Coordinates(coords.lat, coords.lng);
  
  // University of Islamic Sciences, Karachi method for Pakistan
  const params = CalculationMethod.Karachi();
  params.madhab = Madhab.Hanafi;

  const prayerTimes = new AdhanPrayerTimes(coordinates, dateObj, params);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return {
    fajr: formatTime(prayerTimes.fajr),
    dhuhr: formatTime(prayerTimes.dhuhr),
    asr: formatTime(prayerTimes.asr),
    maghrib: formatTime(prayerTimes.maghrib),
    isha: formatTime(prayerTimes.isha),
  };
}

// Fetch exact prayer times from Aladhan API with fallback to calculation
export async function fetchPrayerTimesFromAPI(city: string = "Sialkot", dateObj: Date = new Date()) {
  try {
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    const dateStr = `${day}-${month}-${year}`;

    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(city)}&country=Pakistan&method=1`
    );
    if (!res.ok) throw new Error("API request failed");
    const json = await res.json();
    if (json.code === 200 && json.data && json.data.timings) {
      const timings = json.data.timings;
      return {
        fajr: convert24To12(timings.Fajr),
        dhuhr: convert24To12(timings.Dhuhr),
        asr: convert24To12(timings.Asr),
        maghrib: convert24To12(timings.Maghrib),
        isha: convert24To12(timings.Isha),
      };
    }
  } catch (err) {
    console.warn("Falling back to local adhan calculation:", err);
  }
  return calculatePrayerTimes(city, dateObj);
}

export function getPrayerTimesForCity(city: string = "Sialkot", dateObj: Date = new Date()) {
  return calculatePrayerTimes(city, dateObj);
}

// Default Prayer Times based on Sialkot
export const DEFAULT_PRAYER_TIMES = calculatePrayerTimes("Sialkot", new Date());

// Default structures
export const createEmptyPrayerState = (): PrayerState => ({
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false,
  tahajjud: false,
  ayatulKursi: false,
});

export const createEmptyDhikrState = (): DhikrState => ({
  subhanallahWabihamdihi: 0,
  allahuAkbar: 0,
  subhanallah: 0,
  alhamdulillah: 0,
});

// Calculate the spiritual score for a day
export function calculateSpiritualScore(prayers: PrayerState, dhikr: DhikrState): number {
  let score = 0;
  
  // 5 Daily Fardh Prayers are worth 15% each = 75% max
  const completedPrayers = [
    prayers.fajr,
    prayers.dhuhr,
    prayers.asr,
    prayers.maghrib,
    prayers.isha
  ].filter(Boolean).length;
  score += completedPrayers * 15;

  // Ayat-ul-Kursi recitation is worth 5%
  if (prayers.ayatulKursi) score += 5;

  // Dhikr completions: 20% total divided amongst 4 dhikr practices
  // SubhanAllahi wa bihamdihi (target 100 reps) -> max 5%
  const dhikr1Progress = Math.min(dhikr.subhanallahWabihamdihi / 100, 1);
  score += dhikr1Progress * 5;

  // Allahu Akbar (target 34 reps) -> max 5%
  const dhikr2Progress = Math.min(dhikr.allahuAkbar / 34, 1);
  score += dhikr2Progress * 5;

  // SubhanAllah (target 33 reps) -> max 5%
  const dhikr3Progress = Math.min(dhikr.subhanallah / 33, 1);
  score += dhikr3Progress * 5;

  // Alhamdulillah (target 33 reps) -> max 5%
  const dhikr4Progress = Math.min(dhikr.alhamdulillah / 33, 1);
  score += dhikr4Progress * 5;

  return Math.round(score);
}

// Generate past week of empty logs so the user starts from a clean zero-history state
export function generateMockHistory(): DailyLog[] {
  const history: DailyLog[] = [];
  const today = new Date();
  
  // Seed the past 7 days (including today) with zero history
  for (let i = 6; i >= 0; i--) {
    const currentDay = new Date(today);
    currentDay.setDate(today.getDate() - i);
    const dateStr = currentDay.toISOString().split("T")[0];

    history.push({
      date: dateStr,
      prayers: createEmptyPrayerState(),
      dhikr: createEmptyDhikrState(),
      score: 0,
    });
  }

  return history;
}

// Parse prayer time string into hours and minutes
export function parsePrayerTime(timeStr: string): { hours: number; minutes: number } {
  const [time, modifier] = timeStr.split(" ");
  const [hoursStr, minutesStr] = time.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (modifier === "PM" && hours < 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }
  return { hours, minutes };
}

export interface UpcomingPrayerInfo {
  name: string;
  timeStr: string;
  minutesRemaining: number;
  formattedRemaining: string;
}

// Get upcoming prayer and countdown dynamically
export function getUpcomingPrayer(customTimes = DEFAULT_PRAYER_TIMES): UpcomingPrayerInfo {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayers = [
    { name: "Fajr", time: customTimes.fajr },
    { name: "Dhuhr", time: customTimes.dhuhr },
    { name: "Asr", time: customTimes.asr },
    { name: "Maghrib", time: customTimes.maghrib },
    { name: "Isha", time: customTimes.isha },
  ];

  let nextPrayer = null;
  let minDiff = Infinity;

  for (const prayer of prayers) {
    const { hours, minutes } = parsePrayerTime(prayer.time);
    let prayerMinutes = hours * 60 + minutes;

    let diff = prayerMinutes - currentMinutes;
    if (diff < 0) {
      // Next day
      diff += 1440;
    }

    if (diff < minDiff) {
      minDiff = diff;
      nextPrayer = { ...prayer, minutesRemaining: diff };
    }
  }

  if (!nextPrayer) {
    return {
      name: "Fajr",
      timeStr: customTimes.fajr,
      minutesRemaining: 120,
      formattedRemaining: "2 hours",
    };
  }

  const hoursLeft = Math.floor(nextPrayer.minutesRemaining / 60);
  const minsLeft = nextPrayer.minutesRemaining % 60;
  let formattedRemaining = "";
  if (hoursLeft > 0) {
    formattedRemaining += `${hoursLeft}h `;
  }
  formattedRemaining += `${minsLeft}m`;

  return {
    name: nextPrayer.name,
    timeStr: nextPrayer.time,
    minutesRemaining: nextPrayer.minutesRemaining,
    formattedRemaining,
  };
}

// Synthesize a beautiful, clean dual-tone spiritual chime using AudioContext
export function playSoothingChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const playTone = (freq: number, startDelay: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startDelay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startDelay + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + startDelay);
      osc.stop(ctx.currentTime + startDelay + duration);
    };

    // Deeply resonant soothing chime chord (528 Hz, 660 Hz, 792 Hz)
    playTone(528, 0, 1.8, 0.25);
    playTone(660, 0.1, 1.5, 0.18);
    playTone(792, 0.2, 1.2, 0.12);
  } catch (e) {
    console.error("Audio chime failed to play:", e);
  }
}

// Fire an operating system level notification
export function triggerSystemNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body });
      }
    });
  }
}

