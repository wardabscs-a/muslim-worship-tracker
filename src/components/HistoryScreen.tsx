/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Calendar,
  History,
  PlusCircle,
  Award,
  ChevronRight
} from "lucide-react";
import { DailyLog } from "../types";

interface HistoryScreenProps {
  history: DailyLog[];
  onSelectDateToLog: (dateStr: string) => void;
}

export default function HistoryScreen({
  history,
  onSelectDateToLog,
}: HistoryScreenProps) {
  // Compute basic history overview stats
  const loggedDays = history.filter((log) => log.score > 0);
  const averageScore = loggedDays.length
    ? Math.round(loggedDays.reduce((sum, log) => sum + log.score, 0) / loggedDays.length)
    : 0;

  // Helper to render date label
  const formatDateLabel = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    const day = dateObj.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const num = dateObj.getDate();
    return { day, num };
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-28">
      {/* Top App Bar */}
      <header className="flex justify-between items-center py-2 px-1">
        <h1 className="text-xl font-black text-primary tracking-tight">History</h1>
        <div className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-full text-primary shadow-sm">
          <Calendar className="h-5 w-5" />
        </div>
      </header>

      {/* History Summary Card */}
      <section className="rounded-3xl bg-primary-container p-6 text-white relative overflow-hidden shadow-lg shadow-primary-container/10">
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/35 rounded-full blur-2xl" />
        <div className="relative z-10 space-y-3">
          <p className="text-[10px] font-black tracking-wider uppercase opacity-85">
            Spiritual Log Book
          </p>
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-4xl font-black leading-none">{loggedDays.length} Days</h2>
              <p className="text-xs text-white/80 font-medium">
                Total devotions tracked
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/5">
              <Award className="h-4 w-4 text-on-primary-container" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                Avg {averageScore}% Strength
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Journal History */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-black text-gray-800 tracking-tight">
            Your Devotion Logs
          </h3>
          <span className="text-xs font-semibold text-gray-400">
            {history.length} records
          </span>
        </div>

        <div className="space-y-3">
          {history.slice().reverse().map((log, index) => {
            const { day, num } = formatDateLabel(log.date);
            const isToday = log.date === new Date().toISOString().split("T")[0];
            const hasRecord = log.score > 0;
            
            return (
              <div
                key={log.date}
                className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                  hasRecord
                    ? "bg-white border border-gray-100/50 shadow-sm border-l-4 border-l-primary"
                    : "bg-gray-50/50 border-2 border-dashed border-gray-200/70 opacity-75"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Calendar Badge */}
                  <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl shadow-sm ${
                    hasRecord ? "bg-white border border-gray-100" : "bg-transparent border border-gray-200"
                  }`}>
                    <span className={`text-[9px] font-black tracking-wide ${hasRecord ? "text-primary" : "text-gray-400"}`}>
                      {day}
                    </span>
                    <span className={`text-base font-black leading-none ${hasRecord ? "text-gray-800" : "text-gray-400"}`}>
                      {num}
                    </span>
                  </div>

                  <div>
                    <h4 className={`text-sm font-bold ${hasRecord ? "text-gray-800" : "text-gray-400"}`}>
                      {isToday ? "Today" : new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </h4>
                    <p className={`text-xs ${hasRecord ? "text-gray-500 font-semibold" : "text-gray-400 font-medium"}`}>
                      {hasRecord 
                        ? `${[log.prayers.fajr, log.prayers.dhuhr, log.prayers.asr, log.prayers.maghrib, log.prayers.isha].filter(Boolean).length}/5 Prayers • ${log.score}% Score` 
                        : "Empty log entry"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onSelectDateToLog(log.date)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all cursor-pointer ${
                    hasRecord
                      ? "bg-primary text-white"
                      : "bg-transparent text-primary hover:bg-primary/5 font-extrabold"
                  }`}
                >
                  {hasRecord ? "LOG" : "ADD"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Action Footer */}
      <div className="pt-4 pb-4">
        <button
          onClick={() => onSelectDateToLog(new Date().toISOString().split("T")[0])}
          className="w-full bg-primary hover:bg-primary/95 text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg cursor-pointer shadow-primary/15 font-bold text-sm active:scale-[0.98] transition-all"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Add Previous Dates</span>
        </button>
        <p className="text-center text-xs text-gray-400 mt-4 italic font-medium">
          “Be steadfast in prayer and regular in charity.” — Quran 2:110
        </p>
      </div>
    </div>
  );
}
