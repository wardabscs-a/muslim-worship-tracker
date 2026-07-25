import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini AI client successfully initialized server-side.");
  } catch (error) {
    console.error("Failed to initialize Gemini AI client:", error);
  }
} else {
  console.log("No GEMINI_API_KEY found in environment. Using curated fallbacks.");
}

// Robust fallback runner to handle transient 503 "Service Unavailable" errors
async function callGeminiWithFallback(params: {
  contents: string;
  config?: any;
}) {
  if (!ai) {
    throw new Error("Gemini AI client not initialized");
  }

  // We try our premium model, then standard models in a resilient fallback chain
  const modelsToTry = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini] Attempting generation with model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.status || err?.statusCode || (err?.error && err.error.code) || "unknown";
      console.log(`[Gemini] Model ${modelName} returned status ${statusCode}. Trying next available fallback...`);
    }
  }

  throw lastError || new Error("All fallback Gemini models failed");
}

// Curated beautiful Islamic verses & sayings for robust fallbacks
const CURATED_VERSES = [
  {
    verse: "أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ",
    translation: "Verily, in the remembrance of Allah do hearts find rest.",
    reference: "Surah Ar-Ra'd 13:28",
    reflection: "Remembering Allah is not just a tongue-based utterance, but a deep sanctuary for the soul. In a busy world filled with noise and distraction, taking even a single minute to recite 'SubhanAllah' or 'Alhamdulillah' returns your heart to its natural state of peace and Sakinah."
  },
  {
    verse: "وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ",
    translation: "And seek help through patience and prayer.",
    reference: "Surah Al-Baqarah 2:45",
    reflection: "Salah and Sabr are our dual anchors in life. When life feels overwhelming, look to your next prayer as a conversation with the Creator of all things. Each prostration is an invitation to release your burdens and stand stronger."
  },
  {
    verse: "إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    translation: "Indeed, with hardship [will be] ease.",
    reference: "Surah Ash-Sharh 94:6",
    reflection: "Allah reminds us that ease is not something that only comes after hardship—it is woven directly alongside it. No matter what trial you are facing today, know that Allah has already prepared the relief, the growth, and the peaceful resolution for you."
  },
  {
    verse: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    translation: "And say: 'My Lord, increase me in knowledge.'",
    reference: "Surah Ta-Ha 20:114",
    reflection: "Seeking knowledge and spiritual growth is a life-long journey. Every prayer logged, every dhikr counted, and every verse contemplated is an active step towards rising in levels. Remain humble and eager to grow today."
  },
  {
    verse: "فَٱذْكُرُونِيٓ أَذْكُرْكُمْ",
    translation: "So remember Me; I will remember you.",
    reference: "Surah Al-Baqarah 2:152",
    reflection: "Consider the magnitude of this promise: when you, a creation, think of and remember your Lord, the King of Kings remembers you in return. Let this promise fill your heart with awe and joy as you complete your daily devotion."
  }
];

// Curated motivational quotes for reflections
const REFLECTION_FALLBACKS = [
  "MashaAllah, you are making beautiful spiritual progress today! Stand steadfast in your prayers.",
  "Your efforts towards mindfulness and devotion do not go unnoticed. Keep going, one step at a time.",
  "A perfect streak is not the goal—consistency in turning back to Allah is. You did wonderful today.",
  "May your heart be filled with tranquility (Sakinah) and strength as you complete your daily tracker."
];

// Endpoint: Generate or fetch a Daily Verse with optional topic
app.get("/api/verse", async (req, res) => {
  const topic = req.query.topic as string || "peace, gratitude, mindfulness";
  
  if (!ai) {
    // Pick a curated verse based on random rotation or keyword
    const index = Math.floor(Math.random() * CURATED_VERSES.length);
    return res.json(CURATED_VERSES[index]);
  }

  try {
    const prompt = `Generate a beautiful daily inspirational verse from the Quran that brings peace, tranquility (Sakinah), and mindfulness.
    Return a JSON object containing:
    1. 'verse' (the original Arabic text, with accurate harakat/vowels).
    2. 'translation' (a clear and beautiful English translation).
    3. 'reference' (the Surah name and verse number e.g. "Surah Al-Baqarah 2:152").
    4. 'reflection' (a warm, encouraging, 2-3 sentence contemporary spiritual reflection that connects the verse to daily life, mindfulness, and consistency).
    
    Choose a verse related to the theme: "${topic}". Ensure the JSON formatting is perfect.`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT" as any,
          properties: {
            verse: { type: "STRING" as any, description: "The original Arabic verse text" },
            translation: { type: "STRING" as any, description: "The English translation of the verse" },
            reference: { type: "STRING" as any, description: "The citation / reference" },
            reflection: { type: "STRING" as any, description: "A heartwarming spiritual reflection tailored for the user" }
          },
          required: ["verse", "translation", "reference", "reflection"]
        }
      }
    });

    const resultText = response.text || "";
    const parsedData = JSON.parse(resultText.trim());
    return res.json(parsedData);
  } catch (error) {
    console.log("[Gemini] Active model chain returned an error, using fallback Quran verse.");
    const index = Math.floor(Math.random() * CURATED_VERSES.length);
    return res.json(CURATED_VERSES[index]);
  }
});

// Endpoint: Generate custom personal reflection based on user's logged activity
app.post("/api/reflect", async (req, res) => {
  const { prayers, dhikr, score, name } = req.body;
  const userName = name || "User";

  const prayerNames = Object.entries(prayers || {})
    .filter(([_, completed]) => completed)
    .map(([name]) => name.toUpperCase())
    .join(", ");

  const dhikrSummary = Object.entries(dhikr || {})
    .filter(([_, count]) => (count as number) > 0)
    .map(([key, count]) => `${key}: ${count} reps`)
    .join(", ");

  if (!ai) {
    let msg = REFLECTION_FALLBACKS[Math.floor(Math.random() * REFLECTION_FALLBACKS.length)];
    if (score && score > 70) {
      msg = `Excellent work today, ${userName}! You achieved an outstanding spiritual score of ${score}%. May Allah reward your diligence.`;
    } else if (score && score > 0) {
      msg = `MashaAllah on your progress today, ${userName}. You logged several beautiful prayers (${prayerNames || "some"}). May Allah increase you in steadfastness.`;
    }
    return res.json({ reflection: msg });
  }

  try {
    const prompt = `You are a gentle, supportive, and spiritually grounding AI mentor for a Muslim worship tracker application.
    The user, ${userName}, has just completed their daily reflection and logged their worship statistics:
    - Spiritual Score: ${score}%
    - Completed Prayers: ${prayerNames || "None logged yet"}
    - Dhikr Completed: ${dhikrSummary || "None logged yet"}

    Provide a highly personalized, warm, and loving spiritual message (2-3 sentences max).
    Focus on encouraging consistency, self-compassion, and tranquility. Speak directly to ${userName} using an objective, tranquil tone. Do not use overly flowery language or self-praise. Do not use emojis.`;

    const response = await callGeminiWithFallback({
      contents: prompt,
    });

    return res.json({ reflection: response.text?.trim() });
  } catch (error) {
    console.log("[Gemini] Active model chain returned an error, using fallback reflection.");
    return res.json({ reflection: "May your heart be filled with peace and tranquility as you complete your daily devotion." });
  }
});

// Endpoint: AI Assistant Chat using Gemini API with personalization
app.post("/api/assistant/chat", async (req, res) => {
  const { message, history, userContext } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message string is required" });
  }

  const userName = userContext?.name || "Believer";
  const userCity = userContext?.city || "Sialkot";
  const userStreak = userContext?.streak ?? 0;
  const userDhikr = userContext?.dhikrCount ?? 0;
  const todayScore = userContext?.todayLog?.score ?? 0;

  const contextText = userContext?.isLoggedIn
    ? `[User Context: Name: ${userName}, Current Streak: ${userStreak} days, Total Dhikr: ${userDhikr}, Today's Spiritual Score: ${todayScore}%, City: ${userCity}]`
    : `[User Context: Guest user in ${userCity}]`;

  const systemInstruction = `You are Sakinah AI, a warm, compassionate, authentic, and knowledgeable Islamic educational and worship assistant.
You are embedded inside the Sakinah Muslim Worship Tracker application.

Your Core Mandates:
1. Answer Islamic educational questions accurately using simple, clear, accessible language.
2. Provide gentle, uplifting motivation for daily worship (Salah, Dhikr, Quran recitation, Tahajjud, Fasting).
3. Suggest authentic Quranic and Prophetic duas with Arabic text, clear transliteration, and English translation whenever appropriate.
4. Help users plan realistic worship goals (e.g., establishing a Fajr routine, structuring daily Quran reading, building Dhikr habits).
5. Explain Islamic concepts (such as Taqwa, Ihsan, Sabr, Tawakkul, Sakinah) in intuitive, practical terms.
6. Personalize your response warmly using the provided user context (${contextText}) to encourage their spiritual journey.
7. CRITICAL LOCATION RULE: You MUST NEVER mention or reference the user's selected city (such as ${userCity}, Sialkot, Lahore, Karachi, Islamabad, etc.) UNLESS the user explicitly asks a question about prayer times, Qibla direction, local mosques, weather, or another location-specific topic. For all general Islamic questions, duas, motivation, Quran explanations, worship advice, goal planning, or conversations, do NOT mention or reference the city or location at all. Respond naturally and focus strictly on answering the user's question.
8. Always maintain respectful Islamic etiquette (e.g., starting with warm greetings if appropriate, wishing blessings). Keep responses well-formatted with clean spacing and bullet points where helpful. Avoid sectarian debates.`;

  if (!ai) {
    // Intelligent curated fallback assistant if Gemini API key is not present
    const lowerMsg = message.toLowerCase();
    let reply = `Assalamu Alaikum wa Rahmatullahi wa Barakatuh, ${userName}! `;

    if (lowerMsg.includes("fajr")) {
      reply += `Building a consistent Fajr routine is one of the most rewarding spiritual goals! Here are 3 practical steps:\n\n` +
        `1. **Early Sleep & Intention**: Set a clear intention (Niyyah) before sleeping and try to avoid screens 30 minutes before bed.\n` +
        `2. **Strategic Alarm**: Place your alarm across the room so you must physically stand up.\n` +
        `3. **Dua upon Waking**: Recite: *'Alhamdulillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur'* (Praise is to Allah who brought us to life after causing us to die, and unto Him is the resurrection).\n\n` +
        `May Allah make waking up for Fajr easy and beloved for you!`;
    } else if (lowerMsg.includes("dua") || lowerMsg.includes("anxiety") || lowerMsg.includes("peace")) {
      reply += `Here is a powerful authentic Dua from the Sunnah for peace and relief from hardship:\n\n` +
        `**Arabic:** اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ\n` +
        `**Transliteration:** *Allahumma inni a'udhu bika minal-hammi wal-hazan*\n` +
        `**Meaning:** "O Allah, I seek refuge in You from anxiety and grief." (Sahih al-Bukhari)\n\n` +
        `Recite this with conviction whenever your heart feels heavy. Remember Allah is always near.`;
    } else if (lowerMsg.includes("taqwa")) {
      reply += `**Taqwa** in simple terms means **God-consciousness** or **mindful awe of Allah**.\n\n` +
        `Imagine walking down a narrow path filled with thorny bushes—you would naturally tread carefully so your clothes don't snag. Taqwa is navigating daily life with that same careful mindfulness, choosing actions that please Allah and avoiding what harms your soul.`;
    } else if (lowerMsg.includes("quran") || lowerMsg.includes("goal")) {
      reply += `MashaAllah! Setting a Quran goal brings immense barakah to your day. Here is a simple plan based on your current tracking:\n\n` +
        `- **Micro Goal**: Recite 1 page right after Fajr and 1 page right after Maghrib (takes ~5 mins).\n` +
        `- **Consistency**: Doing a little every day is better than large bursts. Prophet Muhammad (ﷺ) said: *"The most beloved deeds to Allah are those that are most consistent, even if small."*\n\n` +
        `You currently have a ${userStreak}-day streak—keep this beautiful momentum going!`;
    } else {
      reply += `Thank you for reaching out! As your Sakinah AI Assistant, I am here to help you with Islamic learning, authentic duas, planning your daily worship goals, and building consistency in your prayers.\n\n` +
        `How can I assist you today, ${userName}? Feel free to ask about prayer habits, duas for peace, or Quran goals!`;
    }

    return res.json({ response: reply });
  }

  try {
    // Construct full prompt or conversation contents
    let contents = "";
    if (history && Array.isArray(history) && history.length > 0) {
      const formattedHistory = history.map((item) => `${item.role === "user" ? "User" : "Assistant"}: ${item.parts[0]?.text || ""}`).join("\n");
      contents = `${systemInstruction}\n\nPrevious Conversation:\n${formattedHistory}\n\nUser: ${message}\nAssistant:`;
    } else {
      contents = `${systemInstruction}\n\nUser Question/Prompt: ${message}\nAssistant:`;
    }

    const response = await callGeminiWithFallback({
      contents,
      config: {
        temperature: 0.7,
      },
    });

    const replyText = response.text?.trim() || "Assalamu Alaikum. I am here to support your spiritual journey. How can I assist you today?";
    return res.json({ response: replyText });
  } catch (error) {
    console.error("[Gemini] AI Assistant endpoint error:", error);
    return res.json({
      response: `Assalamu Alaikum ${userName}. May Allah grant you ease. Currently I am operating in calm offline mode. Please feel free to ask about Fajr routines, authentic duas for tranquility, or setting Quran goals!`,
    });
  }
});

// Start server and handle Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
