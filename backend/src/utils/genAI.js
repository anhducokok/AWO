import { GoogleGenAI } from "@google/genai";

// Lazy initialization so dotenv.config() runs before the API key is read
let _ai = null;
function getAIClient() {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
}

export async function triageWithGemini(rawText) {
  const result = await getAIClient().models.generateContent({
    model: "gemini-2.0-flash",
    contents: buildPrompt(rawText),
  });
  const text = result.text;

  return JSON.parse(text);
}
