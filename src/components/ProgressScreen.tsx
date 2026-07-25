/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  TrendingUp,
  Flame,
  Zap,
  Compass,
  Award,
  Sparkles,
  Calendar
} from "lucide-react";
import { DailyLog } from "../types";

interface ProgressScreenProps {
  history: DailyLog[];
}

export default function ProgressScreen({ history }: ProgressScreenProps) {
  // Compute analytics dynamically
  const loggedDays = history.filter((log) => log.score > 0);
  const averageScore = loggedDays.length
    ? Math.round(loggedDays.reduce((sum, log) => sum + log.score, 0) / loggedDays.length)
    : 0;

  // Calculate current Salah streak (consecutive days with all 5 fardh prayers checked)
  let streak = 0;
  const todayStr = new Date().toISOString().split("T")[0];
  for (let i = history.length - 1; i >= 0; i--) {
    const log = history[i];
    const isPerfect =
      log.prayers.fajr &&
      log.prayers.dhuhr &&
      log.prayers.asr &&
      log.prayers.maghrib &&
      log.prayers.isha;
    if (isPerfect) {
      streak++;
    } else if (log.date !== todayStr) {
      // Break streak only if it's in the past
      break;
    }
  }

  // Total Prayers completed
  let totalPrayersCompleted = 0;
  history.forEach((log) => {
    totalPrayersCompleted += [
      log.prayers.fajr,
      log.prayers.dhuhr,
      log.prayers.asr,
      log.prayers.maghrib,
      log.prayers.isha,
    ].filter(Boolean).length;
  });

  // Total Dhikr reps
  let totalDhikrReps = 0;
  history.forEach((log) => {
    totalDhikrReps +=
      log.dhikr.subhanallahWabihamdihi +
      log.dhikr.allahuAkbar +
      log.dhikr.subhanallah +
      log.dhikr.alhamdulillah;
  });

  // Render SVG Chart coordinates based on scores from the past 7 days
  const lastSevenLogs = history.slice(-7);
  const scores = lastSevenLogs.map((log) => log.score);
  const chartHeight = 100;
  const chartWidth = 360;
  
  // Safeguard: Ensure we have coordinates even with empty scores
  const points = scores.length > 1
    ? scores
        .map((score, index) => {
          const x = (index / (scores.length - 1)) * chartWidth;
          const y = chartHeight - (score / 100) * (chartHeight - 15) - 5;
          return `${x},${y}`;
        })
        .join(" ")
    : `0,${chartHeight} ${chartWidth},${chartHeight}`;

  const areaPath = points
    ? `M 0,${chartHeight} L ${points} L ${chartWidth},${chartHeight} Z`
    : "";
  const linePath = points ? `M ${points}` : "";

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-28">
      {/* Top App Bar */}
      <header className="flex justify-between items-center py-2 px-1">
        <h1 className="text-xl font-black text-primary tracking-tight">Progress</h1>
        <div className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-full text-primary shadow-sm">
          <TrendingUp className="h-5 w-5" />
        </div>
      </header>

      {/* Hero Spiritual Score (Weekly Overview) */}
      <section className="rounded-3xl bg-primary-container p-6 text-white relative overflow-hidden shadow-lg shadow-primary-container/10">
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/35 rounded-full blur-2xl" />
        <div className="relative z-10 space-y-3">
          <p className="text-[10px] font-black tracking-wider uppercase opacity-85">
            Weekly Performance
          </p>
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-4xl font-black leading-none">{averageScore}%</h2>
              <p className="text-xs text-white/80 font-medium">
                Average Spiritual Strength
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/5">
              <Award className="h-4 w-4 text-on-primary-container" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                Active Growth
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Spiritual Momentum / Chart Section */}
      <section className="space-y-4">
        <div className="flex items-end justify-between px-1">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase">
              SPIRITUAL MOMENTUM
            </span>
            <h2 className="text-base font-black text-primary">7-Day Trend</h2>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-secondary block">{averageScore}%</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Average
            </span>
          </div>
        </div>

        {/* Dynamic Area Chart using SVG coordinates */}
        <div className="w-full h-44 bg-gray-50/70 border border-gray-100/50 rounded-2xl relative overflow-hidden flex flex-col justify-between p-3">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.02]">
            <div className="h-px w-full bg-primary" />
            <div className="h-px w-full bg-primary" />
            <div className="h-px w-full bg-primary" />
          </div>

          <div className="w-full flex-grow flex items-end pt-4">
            <svg
              className="w-full h-full text-secondary fill-secondary/10"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
            >
              {points && (
                <>
                  <path d={areaPath} />
                  <path d={linePath} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </>
              )}
            </svg>
          </div>

          <div className="w-full flex justify-between font-bold text-[10px] text-gray-400 uppercase px-1 pt-2 border-t border-gray-100/50">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Bento Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Salah Streak card (span both columns) */}
          <div className="col-span-2 bg-white rounded-3xl p-5 border border-gray-100/50 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-secondary-container/20 text-on-secondary-container flex items-center justify-center">
                <Flame className="h-6 w-6 text-secondary fill-secondary" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-gray-800">{streak} Days</h3>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Salah Streak
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-secondary bg-secondary-container/20 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                Keep going!
              </span>
            </div>
          </div>

          {/* Total Prayers */}
          <div className="bg-primary-container text-white rounded-3xl p-5 space-y-2 shadow-sm">
            <Zap className="h-5 w-5 text-on-primary-container" />
            <div>
              <h4 className="text-2xl font-black tracking-tight">{totalPrayersCompleted}</h4>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                Total Prayers
              </p>
            </div>
          </div>

          {/* Dhikr Totals */}
          <div className="bg-gray-100 text-gray-800 rounded-3xl p-5 space-y-2 shadow-sm">
            <Compass className="h-5 w-5 text-secondary" />
            <div>
              <h4 className="text-2xl font-black tracking-tight">{totalDhikrReps}</h4>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Dhikr Totals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Category Breakdown */}
      <section className="space-y-4 bg-white p-6 rounded-3xl border border-gray-100/50 shadow-sm">
        <h3 className="text-sm font-black text-gray-800 px-1 border-l-3 border-primary leading-none">
          Monthly Breakdown
        </h3>
        
        <div className="space-y-4">
          {/* Fardh Salah */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">Fardh Salah Completion</span>
              <span className="font-black text-primary">85%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: "85%" }} />
            </div>
          </div>

          {/* Sunnah Prayers */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">Sunnah & Nawafil</span>
              <span className="font-black text-secondary">40%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all duration-1000" style={{ width: "40%" }} />
            </div>
          </div>

          {/* Qur'an Reflection */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">Qur'an Daily Verses</span>
              <span className="font-black text-primary/60">60%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary/65 rounded-full transition-all duration-1000" style={{ width: "60%" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Journey Growth Card */}
      <section className="bg-[#faf6f3] border border-amber-100/50 rounded-3xl p-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-sm font-bold text-primary">Habit Guidance</h3>
          </div>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Beautiful habits are built one step at a time. Focus on completing your daily post-prayer adhkar. This will raise your spiritual score and build solid consistency over time.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#154212]/5 rounded-full blur-2xl" />
      </section>
    </div>
  );
}
