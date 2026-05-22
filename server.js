import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Mungon GEMINI_API_KEY ne .env" });
    }

    const { message, profile, recentLogs, chatHistory } = req.body;

    const prompt = `
Ti je nje AI personal trainer shqiptar.
Foli user-it si shok/trajner: natyral, i shkurter, motivues.

Kupto:
- biseda normale
- ushqim
- stervitje
- plan/progres

Nese ka ushqim: llogarit afersisht kcal/protein/carbs/fat.
Nese ka stervitje: llogarit burnKcal dhe volume = sets * reps * kg.
Nese eshte vetem bisede: foods dhe workouts bosh.
Kthe VETEM JSON valid, pa markdown.

Profili:
${JSON.stringify(profile || {})}

Historiku:
${JSON.stringify(recentLogs || [])}

Chat history:
${JSON.stringify((chatHistory || []).slice(-10))}

Formati:
{
  "reply": "pergjigje natyrale ne shqip",
  "intent": "chat|food|workout|mixed",
  "foods": [
    { "name": "emri", "quantity": "sasia", "kcal": 0, "protein": 0, "carbs": 0, "fat": 0 }
  ],
  "workouts": [
    { "name": "ushtrimi", "sets": 0, "reps": 0, "kg": 0, "minutes": 0, "volume": 0, "burnKcal": 0 }
  ]
}

Mesazhi user:
${message}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    let data;
    try {
      data = JSON.parse(response.text);
    } catch {
      data = { reply: response.text, intent: "chat", foods: [], workouts: [] };
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Gabim nga Gemini" });
  }
});

app.listen(PORT, () => {
  console.log(`Fitness AI Gemini running at http://localhost:${PORT}`);
});
