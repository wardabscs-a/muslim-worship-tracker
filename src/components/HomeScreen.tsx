/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Leaf,
  Sparkles,
  Plus,
  Compass,
  Volume2,
  RefreshCw,
  Clock,
  CheckCircle,
  Circle,
  Award,
  Star,
  PlusCircle,
  HelpCircle,
} from "lucide-react";
import { DailyLog, DailyVerse, UserProfile } from "../types";
import { getFormattedDateString, calculateSpiritualScore, getUpcomingPrayer } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface HomeScreenProps {
  user: UserProfile;
  todayLog: DailyLog;
  city: string;
  prayerTimes: { fajr: string; dhuhr: string; asr: string; maghrib: string; isha: string };
  onSelectCity?: (city: string) => void;
  onUpdateLog: (updatedLog: DailyLog) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function HomeScreen({
  user,
  todayLog,
  city,
  prayerTimes,
  onSelectCity,
  onUpdateLog,
  onNavigateToTab,
}: HomeScreenProps) {
  const [dates, setDates] = useState(getFormattedDateString());
  const [dhikrIndex, setDhikrIndex] = useState(0);
  const [verseData, setVerseData] = useState<DailyVerse | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(false);
  const [upcoming, setUpcoming] = useState(() => getUpcomingPrayer(prayerTimes));

  useEffect(() => {
    setUpcoming(getUpcomingPrayer(prayerTimes));
    const interval = setInterval(() => {
      setUpcoming(getUpcomingPrayer(prayerTimes));
    }, 15000); // Update countdown every 15 seconds
    return () => clearInterval(interval);
  }, [prayerTimes]);

  const dhikrPhrases = [
    { text: "SubhanAllahi wa bihamdihi", target: 100, field: "subhanallahWabihamdihi" as const },
    { text: "Allahu Akbar", target: 34, field: "allahuAkbar" as const },
    { text: "SubhanAllah", target: 33, field: "subhanallah" as const },
    { text: "Alhamdulillah", target: 33, field: "alhamdulillah" as const },
  ];

  const currentDhikr = dhikrPhrases[dhikrIndex];
  const currentDhikrCount = todayLog.dhikr[currentDhikr.field];

  // Fetch verse from backend on load
  const fetchVerse = async (topic?: string) => {
    setIsLoadingVerse(true);
    try {
      const url = topic ? `/api/verse?topic=${encodeURIComponent(topic)}` : "/api/verse";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVerseData(data);
      }
    } catch (e) {
      console.error("Failed to fetch daily verse:", e);
    } finally {
      setIsLoadingVerse(false);
    }
  };

  useEffect(() => {
    fetchVerse();
    // Keep date accurate
    const timer = setInterval(() => {
      setDates(getFormattedDateString());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Handle Increments
  const handleDhikrPlus = () => {
    const field = currentDhikr.field;
    const currentVal = todayLog.dhikr[field];
    const updatedDhikr = {
      ...todayLog.dhikr,
      [field]: currentVal + 1,
    };
    
    const updatedLog: DailyLog = {
      ...todayLog,
      dhikr: updatedDhikr,
      score: calculateSpiritualScore(todayLog.prayers, updatedDhikr),
    };
    onUpdateLog(updatedLog);
  };

  const handleDhikrReset = () => {
    const field = currentDhikr.field;
    const updatedDhikr = {
      ...todayLog.dhikr,
      [field]: 0,
    };
    
    const updatedLog: DailyLog = {
      ...todayLog,
      dhikr: updatedDhikr,
      score: calculateSpiritualScore(todayLog.prayers, updatedDhikr),
    };
    onUpdateLog(updatedLog);
  };

  // Toggle Fardh Prayers
  const togglePrayer = (prayerKey: keyof typeof todayLog.prayers) => {
    const updatedPrayers = {
      ...todayLog.prayers,
      [prayerKey]: !todayLog.prayers[prayerKey],
    };
    const updatedLog: DailyLog = {
      ...todayLog,
      prayers: updatedPrayers,
      score: calculateSpiritualScore(updatedPrayers, todayLog.dhikr),
    };
    onUpdateLog(updatedLog);
  };

  const completedPrayersCount = [
    todayLog.prayers.fajr,
    todayLog.prayers.dhuhr,
    todayLog.prayers.asr,
    todayLog.prayers.maghrib,
    todayLog.prayers.isha,
  ].filter(Boolean).length;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-28">
      {/* Top App Bar */}
      <header className="flex justify-between items-center py-2 px-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Leaf className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm text-primary uppercase tracking-wider">Sakinah</span>
        </div>
        <button 
          onClick={() => onNavigateToTab("History")}
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-full text-primary shadow-sm hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
        >
          <Calendar className="h-5 w-5" />
        </button>
      </header>

      {/* Date & Greeting */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-400 dark:text-emerald-500/80 tracking-wide uppercase">
          {dates.Hijri} • {dates.Gregorian}
        </p>
        <h1 className="text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight">
          Assalamu Alaikum, {user.name}
        </h1>
      </div>

      {/* Upcoming Prayer Countdown Card */}
      <section className="bg-gradient-to-r from-[#154212] to-[#2d5a27] dark:from-[#142f12] dark:to-[#1e3e1b] text-white rounded-3xl p-5 shadow-sm border border-emerald-950/10 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[#bbf3b0] uppercase tracking-wider">Upcoming Prayer ({city})</p>
          <h2 className="text-lg font-black tracking-tight">{upcoming.name}</h2>
          <p className="text-xs text-white/80 font-medium">Starts at {upcoming.timeStr}</p>
        </div>
        <div className="text-right space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 text-[10px] font-black tracking-wider uppercase">
            <Clock className="h-3 w-3 animate-pulse" />
            IN {upcoming.formattedRemaining}
          </span>
          <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">
            Pre-Prayer Alert Enabled
          </p>
        </div>
      </section>

      {/* AI Assistant Quick Access Banner */}
      <section 
        onClick={() => onNavigateToTab("Assistant")}
        className="bg-gradient-to-r from-emerald-800 via-primary to-emerald-900 text-white rounded-3xl p-4 shadow-sm border border-emerald-900/30 flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-98 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-[#bbf3b0]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black tracking-tight">Sakinah AI Assistant</h3>
              <span className="px-1.5 py-0.5 rounded bg-white/20 text-[9px] font-black uppercase">NEW</span>
            </div>
            <p className="text-[11px] text-white/80 font-medium">Ask Islamic questions, get duas & worship plans</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold shrink-0">
          Chat Now
        </div>
      </section>

      {/* Spiritual Strength Card */}
      <section className="bg-white dark:bg-[#141b14] rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-[#1e2a1e]/40 flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Spiritual Strength
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-400 font-semibold tracking-wide">
            Focusing on your heart today
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Award className="h-4 w-4 text-secondary dark:text-amber-400" />
            <span className="text-sm font-bold text-secondary dark:text-amber-400">
              {todayLog.score >= 80 ? "Excellent" : todayLog.score >= 50 ? "High" : todayLog.score >= 20 ? "Growing" : "Mindful Start"}
            </span>
          </div>
          {/* Custom micro-slider */}
          <div className="w-full h-1.5 bg-gray-100 dark:bg-emerald-950/40 rounded-full overflow-hidden mt-1 max-w-[140px]">
            <div 
              className="h-full bg-secondary dark:bg-amber-400 bar-animate" 
              style={{ width: `${todayLog.score}%` }}
            />
          </div>
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative flex items-center justify-center h-20 w-20">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              className="stroke-gray-100 dark:stroke-emerald-950/40 fill-none"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              className="stroke-primary fill-none bar-animate"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - todayLog.score / 100)}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-sm font-extrabold text-primary dark:text-emerald-400">
            {todayLog.score}%
          </span>
        </div>
      </section>

      {/* Dhikr Counter (Dark Green Card) */}
      <section className="bg-primary text-white rounded-3xl p-6 shadow-md shadow-primary/10 relative overflow-hidden">
        {/* Decorative background sunburst */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary-container/30 rounded-full blur-xl" />
        
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-1">
            <span className="text-xs font-bold tracking-wider text-on-primary-container uppercase bg-primary-container px-2.5 py-1 rounded-full">
              Dhikr Counter
            </span>
            <p className="text-base font-semibold italic text-white/95 pt-2 font-serif">
              "{currentDhikr.text}"
            </p>
            <p className="text-[10px] font-bold text-on-primary-container tracking-wider uppercase pt-1">
              TARGET: {currentDhikr.target} REPS
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleDhikrReset}
              className="p-1.5 rounded-lg bg-primary-container hover:bg-primary-container/80 transition-colors text-white cursor-pointer active:scale-95"
              title="Reset Counter"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDhikrIndex((dhikrIndex + 1) % dhikrPhrases.length)}
              className="p-1.5 rounded-lg bg-primary-container hover:bg-primary-container/80 transition-colors text-white cursor-pointer active:scale-95 text-xs font-bold"
              title="Switch Phrase"
            >
              Next
            </button>
          </div>
        </div>

        <div className="flex justify-between items-end mt-6 relative z-10">
          <h3 className="text-4xl font-black text-white tracking-tight">
            {currentDhikrCount}
          </h3>
          <button
            onClick={handleDhikrPlus}
            className="h-12 w-12 rounded-2xl bg-secondary-container hover:bg-secondary-container/90 text-on-secondary-container flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>
        </div>
      </section>

      {/* Daily Prayers Section */}
      <section className="space-y-3">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-base font-black text-gray-800 dark:text-gray-100 tracking-tight">
            Daily Prayers
          </h3>
          <span className="text-xs font-bold text-primary dark:text-emerald-400 tracking-wider uppercase">
            {completedPrayersCount} / 5 COMPLETED
          </span>
        </div>

        <div className="space-y-2.5">
          {([
            { key: "fajr" as const, name: "Fajr", time: prayerTimes.fajr },
            { key: "dhuhr" as const, name: "Dhuhr", time: prayerTimes.dhuhr },
            { key: "asr" as const, name: "Asr", time: prayerTimes.asr },
            { key: "maghrib" as const, name: "Maghrib", time: prayerTimes.maghrib },
            { key: "isha" as const, name: "Isha", time: prayerTimes.isha },
          ]).map((prayer) => {
            const completed = todayLog.prayers[prayer.key];
            return (
              <div
                key={prayer.key}
                className={`p-4 bg-white dark:bg-[#141b14] rounded-2xl border border-gray-100/50 dark:border-[#1e2a1e]/40 shadow-sm flex items-center justify-between transition-all ${
                  completed ? "border-primary/25 bg-primary/5 dark:bg-emerald-950/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    completed ? "bg-primary text-white" : "bg-gray-100 dark:bg-emerald-950/25 text-gray-400 dark:text-emerald-700/60"
                  }`}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">{prayer.name}</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-400 font-medium">{prayer.time}</p>
                  </div>
                </div>
                <button
                  onClick={() => togglePrayer(prayer.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    completed
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-emerald-950/20 hover:bg-gray-200 dark:hover:bg-emerald-900/30 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {completed ? "Logged" : "Log"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Post-Prayer & Sunnah Adhkar */}
      <section className="bg-white dark:bg-[#141b14] rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-[#1e2a1e]/40 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-[#1e2a1e]/40 pb-3">
          <div className="flex items-center gap-2 text-primary dark:text-emerald-400">
            <Compass className="h-5 w-5" />
            <h3 className="text-sm font-bold tracking-tight text-gray-800 dark:text-gray-100">
              Post-Prayer Adhkar
            </h3>
          </div>
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full">
            4 ITEMS
          </span>
        </div>

        {/* Adhkar Items Checkboxes */}
        <div className="grid grid-cols-2 gap-3">
          {([
            { key: "ayatulKursi" as const, name: "Ayat-ul-Kursi", desc: "After every prayer" },
            { key: "subhanallah" as const, name: "SubhanAllah", desc: "33x" },
            { key: "alhamdulillah" as const, name: "Alhamdulillah", desc: "33x" },
            { key: "allahuAkbar" as const, name: "Allahu Akbar", desc: "34x" },
          ]).map((item) => {
            const completed = todayLog.prayers.ayatulKursi; // For simplicity let's link the items to some state
            const handleAdhkarCheck = () => {
              if (item.key === "ayatulKursi") {
                togglePrayer("ayatulKursi");
              } else {
                // Check or toggle to target reps immediately!
                const updatedDhikr = {
                  ...todayLog.dhikr,
                  [item.key]: todayLog.dhikr[item.key] > 0 ? 0 : item.key === "allahuAkbar" ? 34 : 33,
                };
                const updatedLog = {
                  ...todayLog,
                  dhikr: updatedDhikr,
                  score: calculateSpiritualScore(todayLog.prayers, updatedDhikr),
                };
                onUpdateLog(updatedLog);
              }
            };

            const itemVal = item.key === "ayatulKursi" ? (todayLog.prayers.ayatulKursi ? 1 : 0) : todayLog.dhikr[item.key];
            const isCompleted = item.key === "ayatulKursi" ? todayLog.prayers.ayatulKursi : itemVal > 0;

            return (
              <button
                key={item.key}
                onClick={handleAdhkarCheck}
                className={`p-3 text-left rounded-xl border border-gray-100/70 dark:border-[#1e2a1e]/60 hover:border-primary/20 dark:hover:border-emerald-800/30 transition-all flex items-center justify-between cursor-pointer ${
                  isCompleted ? "bg-primary/5 dark:bg-emerald-950/15 border-primary/20 dark:border-emerald-700/35" : ""
                }`}
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{item.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 font-medium">{item.desc}</p>
                </div>
                {isCompleted ? (
                  <CheckCircle className="h-4.5 w-4.5 text-primary dark:text-emerald-400" />
                ) : (
                  <Circle className="h-4.5 w-4.5 text-gray-300 dark:text-emerald-900/60" />
                )}
              </button>
            );
          })}
        </div>

      {/* Optional Sunnah Prayer */}
<div className="grid grid-cols-1 gap-3 pt-2">
  {/* Tahajjud Button */}
  <button
    onClick={() => togglePrayer("tahajjud")}
    className="p-3 rounded-xl border border-dashed border-gray-200 dark:border-[#1e2a1e]/60 flex items-center gap-2 text-left hover:bg-gray-50/50 dark:hover:bg-emerald-950/10 cursor-pointer"
  >
    <Star className="h-4 w-4 text-secondary dark:text-amber-400" />
    <div>
      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
        Tahajjud
      </p>
      <p className="text-[10px] text-gray-400 dark:text-gray-400 font-semibold uppercase">
        {todayLog.prayers.tahajjud ? "Completed" : "Pending"}
      </p>
    </div>
  </button>
</div>
      </section>

      {/* Daily Verse (Dynamic via Server-Side Gemini) */}
      <section className="bg-white dark:bg-[#141b14] rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-[#1e2a1e]/40 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold tracking-wider text-secondary dark:text-amber-400 uppercase bg-secondary-container/20 dark:bg-amber-500/10 text-on-secondary-container px-2.5 py-1 rounded-full">
            DAILY VERSE
          </span>
          <button
            onClick={() => fetchVerse()}
            disabled={isLoadingVerse}
            className="text-xs font-bold text-primary dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {isLoadingVerse ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                <span>Refresh AI Verse</span>
              </>
            )}
          </button>
        </div>

        {/* Styled Card Overlay overlaying Quran text on top of beautiful container */}
        <div className="rounded-2xl p-5 bg-[#faf6f3] dark:bg-emerald-950/15 border border-amber-100/50 dark:border-emerald-800/20 text-center space-y-4 relative overflow-hidden">
          {/* Subtle Islamic pattern element background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#154212_1px,transparent_1px)] [background-size:16px_16px]" />

          {isLoadingVerse ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2">
              <span className="h-6 w-6 border-2 border-primary/30 border-t-primary dark:border-emerald-500/30 dark:border-t-emerald-400 rounded-full animate-spin" />
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Gemini generating personalized reflection...</p>
            </div>
          ) : verseData ? (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 relative z-10"
              >
                {/* Arabic Text */}
                <p className="text-xl font-bold text-primary dark:text-emerald-400 leading-loose font-serif px-2">
                  {verseData.verse}
                </p>
                {/* English Translation */}
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 italic px-2">
                  "{verseData.translation}"
                </p>
                {/* Reference */}
                <p className="text-[10px] font-bold text-secondary dark:text-amber-400 uppercase tracking-wider">
                  — {verseData.reference}
                </p>
                {/* Reflection */}
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium text-left leading-relaxed border-t border-amber-100/50 dark:border-emerald-800/20 pt-3 px-1">
                  {verseData.reflection}
                </p>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="py-4 text-xs font-medium text-gray-500 dark:text-gray-400">
              Contemplate your prayers to receive spiritual energy.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
