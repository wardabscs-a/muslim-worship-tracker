import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  BookOpen,
  Heart,
  Compass,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { UserProfile, DailyLog } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  auth,
  onAuthStateChanged,
  subscribeToUserChatHistory,
  saveUserChatHistory,
} from "../lib/firebase";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface AIAssistantScreenProps {
  user: UserProfile;
  todayLog: DailyLog;
  city: string;
}

const SUGGESTED_PROMPTS = [
  {
    icon: Compass,
    title: "Fajr Habit Plan",
    prompt: "How can I build a habit of waking up for Fajr prayer on time consistently?",
  },
  {
    icon: Heart,
    title: "Duas for Peace",
    prompt: "Suggest authentic Quranic and Sunnah duas for peace of mind and relief from anxiety.",
  },
  {
    icon: BookOpen,
    title: "Explain Taqwa",
    prompt: "Explain the Islamic concept of Taqwa in simple, practical terms for daily life.",
  },
  {
    icon: Lightbulb,
    title: "Quran Recitation Goal",
    prompt: "Help me set a realistic daily Quran reading goal and plan based on my schedule.",
  },
  {
    icon: Sparkles,
    title: "Virtues of Tahajjud",
    prompt: "What are the spiritual virtues of Tahajjud prayer and how can I start praying it?",
  },
];

const getInitialWelcomeMessage = (): Message => ({
  id: "welcome-init",
  sender: "assistant",
  text: "Assalamu Alaikum! How can I help you today?",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
});

export default function AIAssistantScreen({
  user,
  todayLog,
  city,
}: AIAssistantScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear legacy shared key to prevent developer or cross-user leak
    localStorage.removeItem("sakinah_assistant_chat");

    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      const uid = firebaseUser?.uid;
      if (uid) {
        // Authenticated user -> load strictly from Firestore for this UID
        unsubscribeFirestore = subscribeToUserChatHistory(uid, (firestoreMessages) => {
          if (firestoreMessages && firestoreMessages.length > 0) {
            setMessages(firestoreMessages);
          } else {
            // Brand-new user or empty chat -> clean welcome message
            setMessages([getInitialWelcomeMessage()]);
          }
        });
      } else {
        // Guest mode -> use guest-isolated localStorage key
        const savedGuest = localStorage.getItem("sakinah_guest_chat_history");
        if (savedGuest) {
          try {
            const parsed = JSON.parse(savedGuest);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed);
              return;
            }
          } catch (e) {
            // Fallback
          }
        }
        setMessages([getInitialWelcomeMessage()]);
      }
    });

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputMessage).trim();
    if (!messageText || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInputMessage("");
    setIsLoading(true);

    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      saveUserChatHistory(currentUid, updatedMessages);
    } else {
      localStorage.setItem("sakinah_guest_chat_history", JSON.stringify(updatedMessages));
    }

    try {
      // Build conversation history for API
      const historyPayload = updatedMessages.slice(-6).map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.text }],
      }));

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: historyPayload,
          userContext: {
            name: user.name,
            isLoggedIn: user.isLoggedIn,
            city,
            streak: user.streak,
            dhikrCount: user.dhikrCount,
            todayLog: {
              score: todayLog.score,
              prayers: todayLog.prayers,
              dhikr: todayLog.dhikr,
            },
          },
        }),
      });

      const data = await res.json();
      const replyText = data.response || "May Allah grant you ease and tranquility in all your endeavors.";

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const updatedWithAssistant = [...updatedMessages, assistantMsg];
      setMessages(updatedWithAssistant);

      if (currentUid) {
        saveUserChatHistory(currentUid, updatedWithAssistant);
      } else {
        localStorage.setItem("sakinah_guest_chat_history", JSON.stringify(updatedWithAssistant));
      }
    } catch (error) {
      console.error("AI Assistant Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: "Assalamu Alaikum. I experienced a momentary connection pause. Please try asking your question again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const updatedWithError = [...updatedMessages, errorMsg];
      setMessages(updatedWithError);

      if (currentUid) {
        saveUserChatHistory(currentUid, updatedWithError);
      } else {
        localStorage.setItem("sakinah_guest_chat_history", JSON.stringify(updatedWithError));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const welcomeMsg = getInitialWelcomeMessage();
    setMessages([welcomeMsg]);

    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      saveUserChatHistory(currentUid, [welcomeMsg]);
    } else {
      localStorage.removeItem("sakinah_guest_chat_history");
    }
    localStorage.removeItem("sakinah_assistant_chat");
  };

  // Simple text renderer with support for bold, italic, and paragraphs
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (!line.trim()) return <div key={idx} className="h-2" />;

      // Check if line is bullet
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ") || /^\d+\.\s/.test(line.trim());

      // Simple inline bold replacement
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      const lineContent = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx} className="font-extrabold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={pIdx} className="italic text-emerald-950/90 dark:text-emerald-200">{part.slice(1, -1)}</em>;
        }
        return part;
      });

      return (
        <p key={idx} className={`leading-relaxed ${isBullet ? "pl-2 font-medium" : ""}`}>
          {lineContent}
        </p>
      );
    });
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[#154212] via-[#245220] to-[#2d5a27] dark:from-[#112a0f] dark:to-[#1c3c1a] text-white rounded-3xl p-5 shadow-sm border border-emerald-950/20 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[#bbf3b0] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Sakinah AI
              </span>
              {user.isLoggedIn && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Personalized
                </span>
              )}
            </div>
            <h1 className="text-xl font-black tracking-tight">AI Islamic Assistant</h1>
            <p className="text-xs text-white/80 font-medium">
              Authentic guidance, worship goal planning & duas.
            </p>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer"
            title="Clear Conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Suggested Quick Prompts (Only show if few messages or user wants inspiration) */}
      {messages.length <= 2 && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <Lightbulb className="h-3.5 w-3.5 text-primary dark:text-emerald-400" />
            <h3 className="text-xs font-black text-gray-500 dark:text-emerald-400 uppercase tracking-wider">
              Suggested Topics & Prompts
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {SUGGESTED_PROMPTS.map((item, index) => {
              const IconComp = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSendMessage(item.prompt)}
                  disabled={isLoading}
                  className="bg-white dark:bg-[#141b14] p-3.5 rounded-2xl border border-gray-100 dark:border-[#1e2a1e]/50 hover:border-primary/40 dark:hover:border-emerald-500/40 text-left transition-all shadow-xs flex items-center gap-3 group cursor-pointer active:scale-98"
                >
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-primary dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-extrabold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {item.prompt}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Chat Messages Container */}
      <section className="bg-white dark:bg-[#141b14] rounded-3xl p-4 border border-gray-100 dark:border-[#1e2a1e]/40 shadow-xs space-y-4 min-h-[320px] max-h-[480px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="h-8 w-8 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-3xl p-4 text-xs shadow-xs space-y-1.5 ${
                    isUser
                      ? "bg-primary text-white rounded-tr-xs"
                      : "bg-gray-50 dark:bg-[#1a241a] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-[#243324] rounded-tl-xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-1 mb-1">
                    <span className="text-[10px] font-black tracking-wider uppercase opacity-80">
                      {isUser ? user.name : "Sakinah AI Assistant"}
                    </span>
                    <span className="text-[9px] opacity-60 font-mono">{msg.timestamp}</span>
                  </div>

                  <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                </div>

                {isUser && (
                  <div className="h-8 w-8 rounded-2xl bg-gray-200 dark:bg-emerald-950 text-gray-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center animate-pulse">
            <div className="h-8 w-8 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-gray-50 dark:bg-[#1a241a] border border-gray-100 dark:border-[#243324] text-gray-600 dark:text-gray-300 rounded-3xl rounded-tl-xs px-4 py-3 text-xs flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary dark:text-emerald-400" />
              <span className="font-semibold text-[11px]">Sakinah AI is reflecting on your prompt...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </section>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-white dark:bg-[#141b14] rounded-2xl p-2.5 border border-gray-200 dark:border-[#1e2a1e]/60 shadow-md flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask Sakinah AI about prayers, duas, habits..."
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/95 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
