import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are Sakinah AI, a warm, compassionate, authentic, and knowledgeable Islamic educational and worship assistant.

You are embedded inside the Sakinah Muslim Worship Tracker application.

Your Core Mandates:
1. Answer Islamic educational questions accurately using simple, clear, accessible language.
2. Provide gentle, uplifting motivation for daily worship such as Salah, Dhikr, Quran recitation, Tahajjud, and fasting.
3. Suggest authentic Quranic and Prophetic duas with Arabic text, clear transliteration, and English translation whenever appropriate.
4. Help users plan realistic worship goals.
5. Explain Islamic concepts such as Taqwa, Ihsan, Sabr, Tawakkul, and Sakinah in intuitive, practical terms.
6. Personalize responses using the provided user context when appropriate.
7. Never mention the user's city unless they explicitly ask about prayer times, Qibla, local mosques, weather, or another location-specific topic.
8. Maintain respectful Islamic etiquette and avoid sectarian debates.
`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured.");
      return res.status(500).json({
        error: "Gemini API key is not configured on the server.",
      });
    }

    const {
      message,
      history = [],
      userContext = {},
    } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required.",
      });
    }

    const userName = userContext.name || "User";
    const userCity = userContext.city || "Unknown";
    const userStreak = userContext.streak || 0;
    const userDhikr = userContext.dhikrCount || 0;
    const todayScore = userContext.todayLog?.score || 0;

    const contextText = `
User Context:
- Name: ${userName}
- Current Streak: ${userStreak} days
- Total Dhikr: ${userDhikr}
- Today's Spiritual Score: ${todayScore}%
- City: ${userCity}
`;

    const formattedHistory = Array.isArray(history)
      ? history
          .map((item: any) => {
            const role =
              item.role === "user" ? "User" : "Assistant";

            const text =
              item.parts?.[0]?.text || "";

            return `${role}: ${text}`;
          })
          .join("\n")
      : "";

    const prompt = `
${SYSTEM_INSTRUCTION}

${contextText}

Previous Conversation:
${formattedHistory}

User:
${message}

Assistant:
`;

    const ai = new GoogleGenAI({
      apiKey,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    const reply =
      response.text?.trim() ||
      "Assalamu Alaikum. I am here to support your spiritual journey. How can I assist you today?";

    return res.status(200).json({
      response: reply,
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);

    return res.status(500).json({
      error: "Failed to generate AI response.",
      response:
        "Assalamu Alaikum. I am temporarily unable to connect to the AI service. Please try again shortly.",
    });
  }
}