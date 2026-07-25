/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Home, History, TrendingUp, User, Plus, Clock, Sparkles } from "lucide-react";
import { UserProfile, DailyLog, AppSettings } from "./types";
import {
  generateMockHistory,
  calculateSpiritualScore,
  createEmptyPrayerState,
  createEmptyDhikrState,
  getUpcomingPrayer,
  playSoothingChime,
  triggerSystemNotification,
  getPrayerTimesForCity,
  calculatePrayerTimes,
  fetchPrayerTimesFromAPI,
} from "./utils";
import {
  auth,
  onAuthStateChanged,
  getUserDocument,
  saveUserDocument,
  saveUserCity,
  logOut,
} from "./lib/firebase";

// Screens
import LoginScreen from "./components/LoginScreen";
import CreateAccountScreen from "./components/CreateAccountScreen";
import HomeScreen from "./components/HomeScreen";
import HistoryScreen from "./components/HistoryScreen";
import ProgressScreen from "./components/ProgressScreen";
import SettingsScreen from "./components/SettingsScreen";
import LogDayScreen from "./components/LogDayScreen";
import AIAssistantScreen from "./components/AIAssistantScreen";

export default function App() {
  // Authentication & Navigation States
  const [currentScreen, setCurrentScreen] = useState<"Login" | "Register" | "Main">("Login");
  const [activeTab, setActiveTab] = useState<string>("Home");
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // Core App States
  const [user, setUser] = useState<UserProfile>({
    name: "Muhsin",
    email: "guest@sakinah.com",
    joinedDate: "October 2023",
    level: 12,
    xp: 2400,
    streak: 0,
    dhikrCount: 0,
    isLoggedIn: false,
  });

  const [settings, setSettings] = useState<AppSettings>({
    notifications: {
      adhanAlerts: true,
      prePrayerReminder: false,
      tahajjudAlert: true,
    },
    appearance: "light",
  });

  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [city, setCity] = useState<string>(() => localStorage.getItem("sakinah_city") || "Sialkot");
  const [activeReminder, setActiveReminder] = useState<{ name: string; minutes: number } | null>(null);
  const [lastNotifiedPrayer, setLastNotifiedPrayer] = useState<string | null>(null);

  const [prayerTimes, setPrayerTimes] = useState(() => calculatePrayerTimes(city, new Date()));

  useEffect(() => {
    let isMounted = true;

    // Synchronously compute initial accurate prayer times for city and current date
    const calculated = calculatePrayerTimes(city, new Date());
    setPrayerTimes(calculated);

    // Asynchronously fetch exact city timings from Aladhan API
    fetchPrayerTimesFromAPI(city, new Date()).then((liveTimes) => {
      if (isMounted && liveTimes) {
        setPrayerTimes(liveTimes);
      }
    });

    // Refresh times periodically (every 30 mins) to handle date changes automatically
    const interval = setInterval(() => {
      fetchPrayerTimesFromAPI(city, new Date()).then((liveTimes) => {
        if (isMounted && liveTimes) {
          setPrayerTimes(liveTimes);
        }
      });
    }, 30 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [city]);

  const handleSelectCity = (newCity: string) => {
    setCity(newCity);
    localStorage.setItem("sakinah_city", newCity);
    if (auth.currentUser?.uid) {
      saveUserCity(auth.currentUser.uid, newCity);
    }
  };

  // Apply theme dynamically based on appearance settings
  useEffect(() => {
    const applyTheme = () => {
      const isDark =
        settings.appearance === "dark" ||
        (settings.appearance === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme();

    if (settings.appearance === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme();
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [settings.appearance]);

  // Pre-prayer reminder checker
  useEffect(() => {
    if (!settings.notifications.prePrayerReminder) {
      return;
    }

    const checkReminder = () => {
      const info = getUpcomingPrayer(prayerTimes);
      // If minutes remaining is 10, notify the user
      const todayStr = new Date().toISOString().split("T")[0];
      const notificationKey = `${todayStr}_${info.name}`;

      if (info.minutesRemaining === 10 && lastNotifiedPrayer !== notificationKey) {
        setLastNotifiedPrayer(notificationKey);
        setActiveReminder({ name: info.name, minutes: 10 });
        playSoothingChime();
        triggerSystemNotification(
          `Pre-Prayer Alert`,
          `${info.name} starts in 10 minutes. Prepare your wudu!`
        );
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 20000); // Check every 20 seconds
    return () => clearInterval(interval);
  }, [settings.notifications.prePrayerReminder, lastNotifiedPrayer]);

  // Test Pre-prayer alert
  const triggerTestReminder = () => {
    setActiveReminder({ name: "Dhuhr", minutes: 10 });
    playSoothingChime();
    triggerSystemNotification(
      `Pre-Prayer Alert (Test)`,
      `Dhuhr starts in 10 minutes. Prepare your wudu!`
    );
  };

  // Firebase Auth and Firestore Hydration on Mount
  useEffect(() => {
    // 1. Initial LocalStorage hydration (fallback)
    const savedUser = localStorage.getItem("sakinah_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.isLoggedIn) {
          setCurrentScreen("Main");
        }
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }

    const savedSettings = localStorage.getItem("sakinah_settings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {}
    }

    const savedLogs = localStorage.getItem("sakinah_logs");
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        const hasLegacySeed = parsed.some((l: any) => l.reflection && l.reflection.includes("Contemplated Surah Ash-Sharh"));
        if (hasLegacySeed) {
          const seeded = generateMockHistory();
          setLogs(seeded);
          localStorage.setItem("sakinah_logs", JSON.stringify(seeded));
        } else {
          setLogs(parsed);
        }
      } catch (e) {
        const seeded = generateMockHistory();
        setLogs(seeded);
      }
    } else {
      const seeded = generateMockHistory();
      setLogs(seeded);
      localStorage.setItem("sakinah_logs", JSON.stringify(seeded));
    }

    // 2. Firebase Auth Listener & Firestore Syncing
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        // Fetch existing user data document from Firestore
        const existingData = await getUserDocument(uid);
        if (existingData) {
          setUser(existingData.user);
          setSettings(existingData.settings);
          setLogs(existingData.logs || []);
          const userCity = existingData.city || "Sialkot";
          setCity(userCity);
          localStorage.setItem("sakinah_city", userCity);
          if (!existingData.city) {
            await saveUserCity(uid, userCity);
          }
        } else {
          // Initialize doc if new user in Firestore
          const initialUser: UserProfile = {
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Believer",
            email: firebaseUser.email || "",
            joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            level: 1,
            xp: 100,
            streak: 0,
            dhikrCount: 0,
            isLoggedIn: true,
          };
          const initialSettings: AppSettings = {
            notifications: {
              adhanAlerts: true,
              prePrayerReminder: false,
              tahajjudAlert: true,
            },
            appearance: "light",
          };
          const initialLogs: DailyLog[] = generateMockHistory();
          const initialCity = "Sialkot";

          setUser(initialUser);
          setSettings(initialSettings);
          setLogs(initialLogs);
          setCity(initialCity);
          localStorage.setItem("sakinah_city", initialCity);

          await saveUserDocument(uid, initialUser, initialSettings, initialLogs, initialCity);
        }
        setCurrentScreen("Main");
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync state to local storage & Firestore immediately
  const saveUserToStorage = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem("sakinah_user", JSON.stringify(updatedUser));
    if (auth.currentUser?.uid) {
      saveUserDocument(auth.currentUser.uid, updatedUser, settings, logs, city);
    }
  };

  const saveSettingsToStorage = (updatedSettings: AppSettings) => {
    setSettings(updatedSettings);
    localStorage.setItem("sakinah_settings", JSON.stringify(updatedSettings));
    if (auth.currentUser?.uid) {
      saveUserDocument(auth.currentUser.uid, user, updatedSettings, logs, city);
    }
  };

  const saveLogsToStorage = (updatedLogs: DailyLog[]) => {
    setLogs(updatedLogs);
    localStorage.setItem("sakinah_logs", JSON.stringify(updatedLogs));

    // Calculate streak and total dhikr from newly updated logs
    const todayStr = new Date().toISOString().split("T")[0];
    let totalDhikr = 0;
    let perfectDaysStreak = 0;

    updatedLogs.forEach((log) => {
      totalDhikr +=
        log.dhikr.subhanallahWabihamdihi +
        log.dhikr.allahuAkbar +
        log.dhikr.subhanallah +
        log.dhikr.alhamdulillah;
    });

    // Check streak of perfect prayer completion
    for (let i = updatedLogs.length - 1; i >= 0; i--) {
      const log = updatedLogs[i];
      const isPerfect =
        log.prayers.fajr &&
        log.prayers.dhuhr &&
        log.prayers.asr &&
        log.prayers.maghrib &&
        log.prayers.isha;

      if (isPerfect) {
        perfectDaysStreak++;
      } else if (log.date !== todayStr) {
        break;
      }
    }

    const updatedUser = {
      ...user,
      streak: perfectDaysStreak,
      dhikrCount: totalDhikr,
    };
    setUser(updatedUser);
    localStorage.setItem("sakinah_user", JSON.stringify(updatedUser));

    if (auth.currentUser?.uid) {
      saveUserDocument(auth.currentUser.uid, updatedUser, settings, updatedLogs, city);
    }
  };

  // Get Today's Log or initialize if missing
  const getTodayLog = (): DailyLog => {
    const todayStr = new Date().toISOString().split("T")[0];
    const existing = logs.find((log) => log.date === todayStr);
    if (existing) return existing;

    return {
      date: todayStr,
      prayers: createEmptyPrayerState(),
      dhikr: createEmptyDhikrState(),
      score: 0,
    };
  };

  // Handle Updates to Logs
  const handleUpdateLog = (updatedLog: DailyLog) => {
    const index = logs.findIndex((log) => log.date === updatedLog.date);
    let updatedLogs = [...logs];
    if (index >= 0) {
      updatedLogs[index] = updatedLog;
    } else {
      updatedLogs.push(updatedLog);
    }
    saveLogsToStorage(updatedLogs);
  };

  // Auth Callbacks
  const handleLoginSuccess = async (name: string, email: string, uid?: string) => {
    const targetUid = uid || auth.currentUser?.uid;
    const loggedInUser: UserProfile = {
      ...user,
      name,
      email,
      isLoggedIn: true,
    };

    if (targetUid) {
      const existingData = await getUserDocument(targetUid);
      if (existingData) {
        setUser(existingData.user);
        setSettings(existingData.settings);
        setLogs(existingData.logs || []);
        const userCity = existingData.city || "Sialkot";
        setCity(userCity);
        localStorage.setItem("sakinah_city", userCity);
      } else {
        saveUserToStorage(loggedInUser);
      }
    } else {
      saveUserToStorage(loggedInUser);
    }
    setCurrentScreen("Main");
  };

  const handleRegisterSuccess = async (name: string, email: string, uid?: string) => {
    const targetUid = uid || auth.currentUser?.uid;
    const registeredUser: UserProfile = {
      ...user,
      name,
      email,
      joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      isLoggedIn: true,
    };

    if (targetUid) {
      await saveUserDocument(targetUid, registeredUser, settings, logs, city);
    }
    saveUserToStorage(registeredUser);
    setCurrentScreen("Main");
  };

  const handleContinueAsGuest = () => {
    const guestUser: UserProfile = {
      ...user,
      name: "Guest",
      email: "guest@sakinah.com",
      isLoggedIn: true,
    };
    saveUserToStorage(guestUser);
    setCurrentScreen("Main");
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (e) {
      console.error("Firebase Sign Out error:", e);
    }
    const loggedOutUser: UserProfile = {
      ...user,
      isLoggedIn: false,
    };
    setUser(loggedOutUser);
    localStorage.removeItem("sakinah_user");
    setCurrentScreen("Login");
    setActiveTab("Home");
  };

  // Log Screen Navigation
  const handleSelectDateToLog = (dateStr: string) => {
    setEditingDate(dateStr);
  };

  const getLogForEditing = (): DailyLog => {
    if (!editingDate) return getTodayLog();
    const existing = logs.find((log) => log.date === editingDate);
    if (existing) return existing;

    return {
      date: editingDate,
      prayers: createEmptyPrayerState(),
      dhikr: createEmptyDhikrState(),
      score: 0,
    };
  };

  const handleSaveLogFromScreen = (updatedLog: DailyLog) => {
    handleUpdateLog(updatedLog);
    setEditingDate(null);
  };

  // Master Layout router
  const renderTabContent = () => {
    switch (activeTab) {
      case "Home":
        return (
          <HomeScreen
            user={user}
            todayLog={getTodayLog()}
            city={city}
            prayerTimes={prayerTimes}
            onSelectCity={handleSelectCity}
            onUpdateLog={handleUpdateLog}
            onNavigateToTab={setActiveTab}
          />
        );
      case "Assistant":
        return (
          <AIAssistantScreen
            user={user}
            todayLog={getTodayLog()}
            city={city}
          />
        );
      case "History":
        return (
          <HistoryScreen
            history={logs}
            onSelectDateToLog={handleSelectDateToLog}
          />
        );
      case "Progress":
        return (
          <ProgressScreen
            history={logs}
          />
        );
      case "Profile":
        return (
          <SettingsScreen
            user={user}
            settings={settings}
            city={city}
            onSelectCity={handleSelectCity}
            onUpdateSettings={saveSettingsToStorage}
            onUpdateUser={saveUserToStorage}
            onSignOut={handleSignOut}
            onTriggerTestReminder={triggerTestReminder}
          />
        );
      default:
        return null;
    }
  };

  // Auth Screens Routing
  if (currentScreen === "Login") {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onNavigateToCreateAccount={() => setCurrentScreen("Register")}
        onContinueAsGuest={handleContinueAsGuest}
      />
    );
  }

  if (currentScreen === "Register") {
    return (
      <CreateAccountScreen
        onRegisterSuccess={handleRegisterSuccess}
        onNavigateToLogin={() => setCurrentScreen("Login")}
      />
    );
  }

  // Edit Log Screen Routing
  if (editingDate) {
    return (
      <LogDayScreen
        dateStr={editingDate}
        initialLog={getLogForEditing()}
        onSave={handleSaveLogFromScreen}
        onBack={() => setEditingDate(null)}
        userName={user.name}
      />
    );
  }

  // Main Dashboard View with Bottom Tab Navigator
  return (
    <div className="min-h-screen bg-background pb-20 relative font-sans transition-colors duration-300">
      {/* Visual Pre-prayer Reminder Banner */}
      {activeReminder && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-[#154212] dark:bg-[#2d5a27] text-white p-4 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-on-primary-container animate-pulse" />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-[#9dd090]">Pre-Prayer Alert</h4>
              <p className="text-xs font-bold">{activeReminder.name} starts in {activeReminder.minutes} minutes! Let's prepare wudu.</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveReminder(null)}
            className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
          >
            DISMISS
          </button>
        </div>
      )}

      <main className="container max-w-md mx-auto px-5 pt-4">
        {renderTabContent()}
      </main>

      {/* Floating Action Button to quickly log Today */}
      <div className="fixed bottom-22 right-5 z-40">
        <button
          onClick={() => handleSelectDateToLog(new Date().toISOString().split("T")[0])}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center shadow-lg shadow-primary/20 cursor-pointer active:scale-95 transition-all"
          title="Log Today"
        >
          <Plus className="h-6 w-6 stroke-[3]" />
        </button>
      </div>

      {/* Persistent Bottom Tab Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#141b14] border-t border-gray-100 dark:border-[#1e2a1e] shadow-[0_-4px_24px_rgba(0,0,0,0.02)] rounded-t-3xl max-w-md mx-auto">
        <div className="flex justify-around items-center py-3.5 px-2">
          {/* Home Tab */}
          <button
            onClick={() => setActiveTab("Home")}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "Home" ? "text-primary scale-105" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Home className={`h-5 w-5 ${activeTab === "Home" ? "stroke-[2.5]" : "stroke-[2]"}`} />
            <span className="text-[9px] font-black tracking-widest uppercase">Home</span>
          </button>

          {/* AI Assistant Tab */}
          <button
            onClick={() => setActiveTab("Assistant")}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "Assistant" ? "text-primary scale-105" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Sparkles className={`h-5 w-5 ${activeTab === "Assistant" ? "stroke-[2.5]" : "stroke-[2]"}`} />
            <span className="text-[9px] font-black tracking-widest uppercase">AI Assistant</span>
          </button>

          {/* History Tab */}
          <button
            onClick={() => setActiveTab("History")}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "History" ? "text-primary scale-105" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <History className={`h-5 w-5 ${activeTab === "History" ? "stroke-[2.5]" : "stroke-[2]"}`} />
            <span className="text-[9px] font-black tracking-widest uppercase">History</span>
          </button>

          {/* Progress Tab */}
          <button
            onClick={() => setActiveTab("Progress")}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "Progress" ? "text-primary scale-105" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <TrendingUp className={`h-5 w-5 ${activeTab === "Progress" ? "stroke-[2.5]" : "stroke-[2]"}`} />
            <span className="text-[9px] font-black tracking-widest uppercase">Progress</span>
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => setActiveTab("Profile")}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "Profile" ? "text-primary scale-105" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <User className={`h-5 w-5 ${activeTab === "Profile" ? "stroke-[2.5]" : "stroke-[2]"}`} />
            <span className="text-[9px] font-black tracking-widest uppercase">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
