
import { GoogleGenAI } from "@google/genai";

export const getFlightAnalysis = async (history: number[]) => {
  try {
    // Always use direct process.env.API_KEY per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an AI Analyst for the game VectorX (a crash multiplier game). 
      The last few crash multipliers were: ${history.slice(-5).join(', ')}.
      Give a very short, punchy tip (max 10 words) for the next round. 
      Use a technical 'flight radar' tone. Do not give actual financial advice, just game flavor text.`,
    });
    // response.text is a property access (not a method call), which is correct.
    return response.text || "Analysis unavailable. Proceed with caution.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Analysis unavailable. Proceed with caution.";
  }
};
