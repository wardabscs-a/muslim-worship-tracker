/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  User,
  Bell,
  Clock,
  Moon,
  Sun,
  Laptop,
  LogOut,
  Calendar,
  Sparkles,
  MapPin,
} from "lucide-react";
import { UserProfile, AppSettings } from "../types";
import { CITIES } from "../utils";

interface SettingsScreenProps {
  user: UserProfile;
  settings: AppSettings;
  city: string;
  onSelectCity: (city: string) => void;
  onUpdateSettings: (updatedSettings: AppSettings) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onSignOut: () => void;
  onTriggerTestReminder?: () => void;
}

export default function SettingsScreen({
  user,
  settings,
  city,
  onSelectCity,
  onUpdateSettings,
  onUpdateUser,
  onSignOut,
  onTriggerTestReminder,
}: SettingsScreenProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.name);

  // Handle setting updates
  const toggleNotification = (key: keyof typeof settings.notifications) => {
    const updated = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    };
    onUpdateSettings(updated);
  };

  const changeTheme = (theme: typeof settings.appearance) => {
    const updated = {
      ...settings,
      appearance: theme,
    };
    onUpdateSettings(updated);
  };

  // Handle Edit Name
  const saveName = () => {
    if (tempName.trim()) {
      onUpdateUser({
        ...user,
        name: tempName.trim(),
      });
      setIsEditingName(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-28">
      {/* Top App Bar */}
      <header className="flex justify-between items-center py-2 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-black text-primary tracking-tight">Settings</h1>
        </div>
        <button className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-full text-primary shadow-sm cursor-pointer">
          <Calendar className="h-5 w-5" />
        </button>
      </header>

      {/* User Info Section (Bento Style) */}
      <section className="bg-primary-container text-white rounded-3xl p-6 shadow-md shadow-primary-container/10 flex flex-col items-center text-center gap-4 relative overflow-hidden">
        <div className="absolute left-0 bottom-0 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
        <div className="absolute right-0 top-0 w-24 h-24 bg-secondary/10 rounded-full blur-xl" />

        {/* User avatar circle */}
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/15 relative group">
          <User className="h-10 w-10 text-white" />
        </div>

        <div className="space-y-1 relative z-10 w-full">
          {isEditingName ? (
            <div className="flex gap-2 justify-center items-center max-w-xs mx-auto">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-white/10 border-0 focus:ring-1 focus:ring-white rounded-xl text-center px-3 py-1 text-base font-bold text-white w-full"
                placeholder="Name"
              />
              <button
                onClick={saveName}
                className="bg-white text-primary text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center gap-0.5">
              <div className="flex justify-center items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">{user.name}</h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-white/60 hover:text-white underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
              {user.email && (
                <p className="text-xs text-white/80 font-medium">{user.email}</p>
              )}
            </div>
          )}
          <p className="text-xs text-white/75 font-semibold">
           <p className="text-xs text-white/75 font-semibold">
  {user.isLoggedIn
    ? `Joined ${user.joinedDate} • Level ${user.level} Muhsin`
    : "Guest Mode • Local Data"}
</p>
          </p>
        </div>

        <div className="flex gap-6 mt-2 relative z-10 w-full justify-center">
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-white leading-tight">{user.streak}</span>
            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
              Days Streak
            </span>
          </div>
          <div className="w-px h-8 bg-white/20 self-center"></div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-white leading-tight">{user.dhikrCount}</span>
            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
              Dhikr Count
            </span>
          </div>
        </div>
      </section>

      {/* City & Location Settings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-gray-400 dark:text-emerald-500/80 uppercase tracking-wider">
            Prayer Location City
          </h3>
          <span className="text-[10px] font-bold text-primary dark:text-emerald-400 tracking-wider uppercase">
            FIRESTORE SYNCED
          </span>
        </div>

        <div className="bg-white dark:bg-[#141b14] rounded-3xl p-4 border border-gray-100 dark:border-[#1e2a1e]/45 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <MapPin className="h-4 w-4 text-primary dark:text-emerald-400" />
            <p className="text-sm font-bold">
              Current City: <span className="text-primary dark:text-emerald-400 font-black">{city}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {CITIES.map((c) => {
              const isSelected = city === c;
              return (
                <button
                  key={c}
                  onClick={() => onSelectCity(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? "bg-primary text-white shadow-sm shadow-primary/20 ring-2 ring-primary/30"
                      : "bg-gray-100 dark:bg-emerald-950/20 hover:bg-gray-200 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Notification Settings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-gray-400 dark:text-emerald-500/80 uppercase tracking-wider">
            Prayer Notifications
          </h3>
          <span className="text-[10px] font-bold text-primary dark:text-emerald-400 tracking-wider uppercase cursor-pointer">
            MANAGE ALL
          </span>
        </div>

        <div className="bg-white dark:bg-[#141b14] rounded-3xl overflow-hidden border border-gray-100 dark:border-[#1e2a1e]/45 shadow-sm">
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-[#1e2a1e]/45">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-emerald-950/10 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-emerald-950/20 flex items-center justify-center text-primary dark:text-emerald-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Adhan Alerts</p>
                  <p className="text-xs text-gray-400 dark:text-gray-400 font-medium">
                    Standard notification for all prayers
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleNotification("adhanAlerts")}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.notifications.adhanAlerts ? "bg-primary" : "bg-gray-200 dark:bg-[#1e2a1e]"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    settings.notifications.adhanAlerts ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex flex-col p-4 hover:bg-gray-50/50 dark:hover:bg-emerald-950/10 transition-colors gap-2.5">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-emerald-950/20 flex items-center justify-center text-primary dark:text-emerald-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Pre-Prayer Reminder</p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 font-medium">
                      10 minutes before each Adhan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotification("prePrayerReminder")}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.notifications.prePrayerReminder ? "bg-primary" : "bg-gray-200 dark:bg-[#1e2a1e]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                      settings.notifications.prePrayerReminder ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
              {settings.notifications.prePrayerReminder && onTriggerTestReminder && (
                <div className="flex justify-end pt-0.5">
                  <button
                    onClick={onTriggerTestReminder}
                    className="text-[10px] font-black bg-primary/10 hover:bg-primary/15 text-primary dark:text-emerald-400 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl cursor-pointer tracking-wider uppercase transition-all active:scale-[0.97]"
                  >
                    🔔 Test Audio & Visual Alert
                  </button>
                </div>
              )}
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-emerald-950/10 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-emerald-950/20 flex items-center justify-center text-primary dark:text-emerald-400">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Tahajjud Alert</p>
                  <p className="text-xs text-gray-400 dark:text-gray-400 font-medium">
                    Dynamic based on local last third of night
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleNotification("tahajjudAlert")}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.notifications.tahajjudAlert ? "bg-primary" : "bg-gray-200 dark:bg-[#1e2a1e]"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    settings.notifications.tahajjudAlert ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Options */}
      <section className="space-y-3">
        <h3 className="text-xs font-black text-gray-400 dark:text-emerald-500/80 uppercase tracking-wider px-1">
          Appearance
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => changeTheme("light")}
            className={`bg-white dark:bg-[#141b14] rounded-2xl p-4 border flex flex-col items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              settings.appearance === "light"
                ? "border-primary bg-primary/5 text-primary dark:border-emerald-400 dark:bg-emerald-950/20 dark:text-emerald-400"
                : "border-gray-100 dark:border-[#1e2a1e]/45 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-emerald-950/10"
            }`}
          >
            <Sun className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Light</span>
          </button>

          <button
            onClick={() => changeTheme("dark")}
            className={`bg-white dark:bg-[#141b14] rounded-2xl p-4 border flex flex-col items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              settings.appearance === "dark"
                ? "border-primary bg-primary/5 text-primary dark:border-emerald-400 dark:bg-emerald-950/20 dark:text-emerald-400"
                : "border-gray-100 dark:border-[#1e2a1e]/45 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-emerald-950/10"
            }`}
          >
            <Moon className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Dark</span>
          </button>

          <button
            onClick={() => changeTheme("system")}
            className={`bg-white dark:bg-[#141b14] rounded-2xl p-4 border flex flex-col items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              settings.appearance === "system"
                ? "border-primary bg-primary/5 text-primary dark:border-emerald-400 dark:bg-emerald-950/20 dark:text-emerald-400"
                : "border-gray-100 dark:border-[#1e2a1e]/45 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-emerald-950/10"
            }`}
          >
            <Laptop className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">System</span>
          </button>
        </div>
      </section>

{/* Account & Security */}
<section className="space-y-3">
  <h3 className="text-xs font-black text-gray-400 dark:text-emerald-500/80 uppercase tracking-wider px-1">
    Account & Security
  </h3>

  <div className="bg-white dark:bg-[#141b14] rounded-3xl overflow-hidden border border-gray-100 dark:border-[#1e2a1e]/45 shadow-sm">
    <div className="flex flex-col">
      <button
        onClick={onSignOut}
        className="flex items-center justify-between p-4 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors text-left w-full cursor-pointer text-red-600 dark:text-red-400"
      >
        <div className="flex items-center gap-3">
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-bold">Sign Out</span>
        </div>
      </button>
    </div>
  </div>
</section>
      {/* Spiritual Momentum Bento / Journey Growth */}
      <section className="mb-4">
        <div className="bg-[#faf6f3] dark:bg-emerald-950/15 border border-amber-100/50 dark:border-emerald-800/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 text-primary dark:text-emerald-400">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-sm font-bold text-primary dark:text-emerald-400">Your Journey Growth</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              MashaAllah! You've logged multiple consistent sessions this month. Each step brings you closer to your spiritual goals. Maintain your daily streaks to rise in Level and unlock deeper custom reflection prompts.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#154212]/5 rounded-full blur-2xl" />
        </div>
      </section>
    </div>
  );
}
