import { GoogleGenAI } from "@google/genai";

const CURATED_VERSES = [
  {
    verse: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    translation: "And say: 'My Lord, increase me in knowledge.'",
    reference: "Surah Ta-Ha 20:114",
    reflection:
      "Seeking knowledge and spiritual growth is a lifelong journey. Every prayer logged, every dhikr counted, and every verse contemplated is a step toward becoming better.",
  },
  {
    verse: "فَٱذْكُرُونِيٓ أَذْكُرْكُمْ",
    translation: "So remember Me; I will remember you.",
    reference: "Surah Al-Baqarah 2:152",
    reflection:
      "Remembering Allah brings the heart back to what truly matters. Let this verse encourage you to keep your daily worship consistent.",
  },
  {
    verse: "أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ",
    translation: "Surely in the remembrance of Allah do hearts find comfort.",
    reference: "Surah Ar-Ra'd 13:28",
    reflection:
      "When life feels busy or overwhelming, dhikr can help bring your heart back to peace. Take a quiet moment today to remember Allah.",
  },
];

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const topic =
      typeof req.query?.topic === "string"
        ? req.query.topic
        : "peace, gratitude, mindfulness";

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini is unavailable, still return a real Quran verse.
    if (!apiKey) {
      const index = Math.floor(Math.random() * CURATED_VERSES.length);
      return res.status(200).json(CURATED_VERSES[index]);
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
Generate a Daily Quran Verse for a Muslim worship and reflection application.

Theme: ${topic}

Return ONLY a valid JSON object with these four fields:
{
  "verse": "original Arabic Quran verse",
  "translation": "clear English translation",
  "reference": "Surah name and verse number",
  "reflection": "a warm 2-3 sentence reflection connecting the verse to daily worship and life"
}

Important:
- Use an authentic Quran verse.
- Do not invent or alter Quranic Arabic.
- Keep the reflection gentle and encouraging.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text?.trim();

    if (!resultText) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsedData = JSON.parse(resultText);

    if (
      !parsedData.verse ||
      !parsedData.translation ||
      !parsedData.reference ||
      !parsedData.reflection
    ) {
      throw new Error("Invalid verse response.");
    }

    return res.status(200).json(parsedData);
  } catch (error) {
    console.error("[Daily Verse] Gemini failed, using curated verse:", error);

    const index = Math.floor(Math.random() * CURATED_VERSES.length);

    return res.status(200).json(CURATED_VERSES[index]);
  }
}