/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ArrowLeft,
  MoreVertical,
  Minus,
  Plus,
  BookOpen,
  Sparkles,
  Check,
  Circle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { DailyLog, PrayerState, DhikrState } from "../types";
import { calculateSpiritualScore } from "../utils";

interface LogDayScreenProps {
  dateStr: string;
  initialLog: DailyLog;
  onSave: (updatedLog: DailyLog) => void;
  onBack: () => void;
  userName: string;
}

export default function LogDayScreen({
  dateStr,
  initialLog,
  onSave,
  onBack,
  userName,
}: LogDayScreenProps) {
  const [prayers, setPrayers] = useState<PrayerState>({ ...initialLog.prayers });
  const [dhikr, setDhikr] = useState<DhikrState>({ ...initialLog.dhikr });
  const [reflectionText, setReflectionText] = useState(initialLog.reflection || "");
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);

  // Format Date for Header e.g. "Friday, Oct 27"
  const getFormattedHeaderDate = () => {
    const dateObj = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric" };
    return dateObj.toLocaleDateString("en-US", options);
  };

  // Toggle Prayers
  const togglePrayer = (key: keyof PrayerState) => {
    setPrayers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Counter Helpers
  const adjustDhikr = (key: keyof DhikrState, delta: number) => {
    setDhikr((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  const handleSave = () => {
    const finalScore = calculateSpiritualScore(prayers, dhikr);
    const updatedLog: DailyLog = {
      date: dateStr,
      prayers,
      dhikr,
      score: finalScore,
      reflection: reflectionText,
    };
    onSave(updatedLog);
  };

  // Generate dynamic personal reflection via server-side Gemini
  const generateAIReflection = async () => {
    setIsGeneratingReflection(true);
    try {
      const score = calculateSpiritualScore(prayers, dhikr);
      const res = await fetch("/api/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          prayers,
          dhikr,
          score,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReflectionText(data.reflection);
      }
    } catch (e) {
      console.error("Failed to generate AI reflection:", e);
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-28 px-1">
      {/* Header Top Bar */}
      <header className="flex justify-between items-center py-4">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-full text-primary shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-extrabold text-primary tracking-tight">
          {getFormattedHeaderDate()}
        </h1>
        <button className="w-10 h-10 flex items-center justify-center text-gray-400">
          <MoreVertical className="h-5 w-5" />
        </button>
      </header>

      {/* Section 1: Prayer Completion */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-base font-black text-gray-800 tracking-tight">
            Prayer Completion
          </h2>
          <span className="text-[10px] font-black tracking-wider text-primary uppercase">
            DAILY OBLIGATION
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3.5">
          {([
            { key: "fajr" as const, name: "Fajr", time: "05:12 AM" },
            { key: "dhuhr" as const, name: "Dhuhr", time: "12:45 PM" },
            { key: "asr" as const, name: "Asr", time: "04:18 PM" },
            { key: "maghrib" as const, name: "Maghrib", time: "06:34 PM" },
            { key: "isha" as const, name: "Isha", time: "08:00 PM" },
            { key: "ayatulKursi" as const, name: "Ayat-ul-Kursi", time: "Recited after prayer" },
          ]).map((prayer) => {
            const checked = prayers[prayer.key];
            return (
              <button
                key={prayer.key}
                onClick={() => togglePrayer(prayer.key)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:border-primary/10 transition-colors text-left cursor-pointer ${
                  checked ? "bg-primary/5 border-primary/15" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    checked ? "bg-primary text-white" : "bg-gray-50 text-gray-400"
                  }`}>
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-800 block leading-tight">
                      {prayer.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{prayer.time}</span>
                  </div>
                </div>
                {checked ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 2: Daily Dhikr */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-base font-black text-gray-800 tracking-tight">
            Daily Dhikr
          </h2>
          <span className="text-[10px] font-black tracking-wider text-secondary uppercase">
            SUNNAH PRACTICE
          </span>
        </div>

        {/* SubhanAllahi wa bihamdihi counter */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-gray-800">
              SubhanAllahi wa bihamdihi
            </h3>
            <span className="text-[9px] font-bold text-on-secondary-container bg-secondary-container/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              100 REPS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustDhikr("subhanallahWabihamdihi", -1)}
              className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 cursor-pointer active:scale-95"
            >
              <Minus className="h-4 w-4 text-gray-500" />
            </button>
            <div className="flex-grow h-10 bg-gray-50/70 border border-gray-100/50 rounded-xl flex items-center justify-center text-base font-black text-gray-800">
              {dhikr.subhanallahWabihamdihi}
            </div>
            <button
              onClick={() => adjustDhikr("subhanallahWabihamdihi", 1)}
              className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Post-Prayer Sequence Counters */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-base font-black text-gray-800 tracking-tight">
            Post-Prayer Sequence
          </h2>
          <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase">
            POST-PRAYER SEQUENCE
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
          {/* Allahu Akbar (34 reps) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">Allahu Akbar</span>
              <span className="text-[9px] font-bold text-on-secondary-container bg-secondary-container/20 px-2 py-0.5 rounded-full">
                34 REPS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustDhikr("allahuAkbar", -1)}
                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
              >
                <Minus className="h-4 w-4 text-gray-500" />
              </button>
              <div className="flex-grow h-10 bg-gray-50/70 border border-gray-100/50 rounded-xl flex items-center justify-center text-sm font-black text-gray-800">
                {dhikr.allahuAkbar}
              </div>
              <button
                onClick={() => adjustDhikr("allahuAkbar", 1)}
                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* SubhanAllah (33 reps) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">SubhanAllah</span>
              <span className="text-[9px] font-bold text-on-secondary-container bg-secondary-container/20 px-2 py-0.5 rounded-full">
                33 REPS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustDhikr("subhanallah", -1)}
                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
              >
                <Minus className="h-4 w-4 text-gray-500" />
              </button>
              <div className="flex-grow h-10 bg-gray-50/70 border border-gray-100/50 rounded-xl flex items-center justify-center text-sm font-black text-gray-800">
                {dhikr.subhanallah}
              </div>
              <button
                onClick={() => adjustDhikr("subhanallah", 1)}
                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Alhamdulillah (33 reps) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">Alhamdulillah</span>
              <span className="text-[9px] font-bold text-on-secondary-container bg-secondary-container/20 px-2 py-0.5 rounded-full">
                33 REPS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustDhikr("alhamdulillah", -1)}
                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
              >
                <Minus className="h-4 w-4 text-gray-500" />
              </button>
              <div className="flex-grow h-10 bg-gray-50/70 border border-gray-100/50 rounded-xl flex items-center justify-center text-sm font-black text-gray-800">
                {dhikr.alhamdulillah}
              </div>
              <button
                onClick={() => adjustDhikr("alhamdulillah", 1)}
                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
              >
                <Plus className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Spiritual Reflection Card */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-black text-gray-800">Daily Reflection</h3>
          <button
            onClick={generateAIReflection}
            disabled={isGeneratingReflection}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingReflection ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Reflect</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            className="w-full h-24 p-3 bg-gray-50/70 border-0 rounded-2xl focus:ring-1 focus:ring-primary/25 focus:bg-white text-xs text-gray-600 font-medium leading-relaxed resize-none"
            placeholder="Type your notes or tap 'AI Reflect' to receive customized spiritual guidance based on today's logged practices..."
          />
        </div>
      </section>

      {/* Save Button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="w-full bg-primary hover:bg-primary/95 text-white py-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-primary/10 cursor-pointer font-bold text-sm active:scale-[0.98] transition-all"
        >
          <Check className="h-5 w-5" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}
