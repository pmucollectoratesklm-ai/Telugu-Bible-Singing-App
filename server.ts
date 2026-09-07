import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Configure body limits for PDF uploads (base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Some AI features will use client synthesis fallbacks.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API endpoint to parse uploaded Telugu Bible PDF or text
app.post("/api/bible/parse-pdf", async (req, res) => {
  try {
    const { pdfBase64, mimeType = "application/pdf", filename = "Telugu_Bible.pdf", rawText } = req.body;

    if (!pdfBase64 && !rawText) {
      return res.status(400).json({ error: "No PDF data or text provided" });
    }

    const ai = getGeminiClient();

    const prompt = `You are an expert Telugu Bible scholar and linguist.
Extract the scripture chapters and verses from this Telugu Bible document (${filename}).
Please extract the book name in Telugu and English, chapter number, and each verse with its verse number, Telugu script text, Telugu phonetic transliteration in English letters, and English meaning.

Return STRICT JSON only matching this format:
{
  "bookNameTelugu": "కీర్తనలు",
  "bookNameEnglish": "Psalms",
  "chapterNumber": 23,
  "title": "యెహోవా నా కాపరి",
  "theme": "ఆరాధన మరియు విశ్వాస గీతం",
  "verses": [
    {
      "verseNumber": 1,
      "teluguText": "యెహోవా నా కాపరి, నాకు లేమి కలుగదు.",
      "transliteration": "Yehovaa naa kaapari, naaku lemi kalugadu.",
      "meaning": "The LORD is my shepherd; I shall not want."
    }
  ]
}

If the document contains multiple chapters or verses, extract as many verses as are clearly visible (up to 30 verses). Keep the Telugu script authentic and accurate.`;

    let contents: any;
    if (pdfBase64) {
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "application/pdf",
              data: pdfBase64.replace(/^data:application\/pdf;base64,/, "").trim(),
            },
          },
          { text: prompt },
        ],
      };
    } else {
      contents = `${prompt}\n\nHere is the raw text from the Telugu Bible document:\n${rawText}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "{}";
    try {
      const parsed = JSON.parse(jsonText);
      return res.json({ success: true, data: parsed });
    } catch {
      // Clean possible code fences
      const clean = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);
      return res.json({ success: true, data: parsed });
    }
  } catch (error: any) {
    console.error("Error parsing Telugu Bible PDF:", error);
    return res.status(500).json({
      error: "Failed to parse Telugu Bible PDF",
      details: error?.message || String(error),
    });
  }
});

// API endpoint to compose a singing musical arrangement for Telugu scripture
app.post("/api/bible/compose-song", async (req, res) => {
  try {
    const {
      teluguText,
      bookName = "కీర్తనలు",
      chapter = 1,
      verse = "1",
      ragaName = "కల్యాణి",
      voiceStyle = "Devotional",
    } = req.body;

    if (!teluguText) {
      return res.status(400).json({ error: "Missing teluguText" });
    }

    const ai = getGeminiClient();

    const prompt = `You are an acclaimed Telugu Christian devotional music composer, poet, and Carnatic/Gospel maestro.
Transform the following sacred Telugu Bible scripture passage into a melodic singing song composition:

Book: ${bookName}
Chapter: ${chapter}, Verse: ${verse}
Scripture Text: "${teluguText}"
Preferred Raga / Musical Mood: ${ragaName}
Vocal Style: ${voiceStyle}

Provide a musical singing composition plan in STRICT JSON format:
{
  "songTitle": "కీర్తన - ${bookName} ${chapter}:${verse}",
  "raga": "${ragaName}",
  "ragaDescription": "A serene, divine morning raga evoking deep reverence and peace",
  "tempoBpm": 72,
  "tala": "ఆది తాళం (8 beats)",
  "mood": "భక్తి రసం (Devotion & Serenity)",
  "swaras": "స రి గ మ ప ద ని స' | ప మ గ రి స",
  "stanzas": [
    {
      "type": "పల్లవి (Chorus)",
      "telugu": "యెహోవా నా కాపరి...",
      "transliteration": "Yehovaa naa kaapari...",
      "swaraLine": "స . గ . ప . ద . స' . . .",
      "chords": ["C", "Em", "F", "G"],
      "durationSeconds": 6
    }
  ],
  "singingTips": "Sing with a warm, steady vibrato on the long vowels, pausing slightly before the cadence.",
  "recommendedInstrument": "Tanpura & Venu (Bamboo Flute)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "{}";
    try {
      const parsed = JSON.parse(jsonText);
      return res.json({ success: true, composition: parsed });
    } catch {
      const clean = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);
      return res.json({ success: true, composition: parsed });
    }
  } catch (error: any) {
    console.error("Error composing song:", error);
    return res.status(500).json({
      error: "Failed to compose song",
      details: error?.message || String(error),
    });
  }
});

// Helper function to encode raw PCM bytes into standard 44-byte RIFF WAV audio
function pcmToWav(
  pcmData: Buffer,
  sampleRate: number = 24000,
  numChannels: number = 1,
  bitDepth: number = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  // RIFF chunk descriptor
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);

  // "fmt " sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
  header.writeUInt16LE(1, 20); // audio format (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);

  // "data" sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

// API endpoint to generate high quality singing audio via Gemini TTS
app.post("/api/bible/generate-audio", async (req, res) => {
  try {
    const {
      text,
      transliteration,
      voiceName = "Kore",
      voiceStyle = "Devotional",
      ragaName = "మోహన రాగం",
    } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text for audio generation" });
    }

    const ai = getGeminiClient();

    // Map user voice choices to valid Gemini TTS prebuilt voices
    // Valid voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const voiceMapping: Record<string, string> = {
      priya_melodic: "Kore",
      david_devotional: "Fenrir",
      anand_classical: "Puck",
      shanthi_peaceful: "Zephyr",
      choir_ensemble: "Charon",
      Kore: "Kore",
      Fenrir: "Fenrir",
      Puck: "Puck",
      Charon: "Charon",
      Zephyr: "Zephyr",
    };

    const chosenVoice = voiceMapping[voiceName] || "Kore";

    // Optimized musical singing prompt for Telugu Christian hymns and keerthanas
    const promptText = `You are an acclaimed Telugu Christian worship vocalist and Carnatic singer performing in ${ragaName}.
Sing this sacred scripture passage melodiously, slowly, and reverently with rich vocal bhava, gentle vibrato, and emotional spiritual warmth:
"${text}"
${transliteration ? `Phonetic cadence: ${transliteration}` : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      // Convert raw 24kHz PCM to broadcast-ready WAV audio
      const pcmBuffer = Buffer.from(base64Audio, "base64");
      const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
      const wavBase64 = wavBuffer.toString("base64");

      return res.json({
        success: true,
        audioBase64: wavBase64,
        mimeType: "audio/wav",
        sampleRate: 24000,
        voiceName: chosenVoice,
      });
    } else {
      return res.status(500).json({ error: "No audio generated from TTS model" });
    }
  } catch (error: any) {
    console.warn("TTS generation error:", error?.message || error);
    return res.status(500).json({
      error: "Failed to generate TTS audio",
      details: error?.message || String(error),
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Telugu Singing Bible server running on port ${PORT}`);
  });
}

startServer();
