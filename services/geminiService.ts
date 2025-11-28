import { GoogleGenAI } from "@google/genai";
import { WeeklyLog, HABITS } from "../types";

export const getWeeklyInsights = async (
  currentWeekStart: Date,
  data: WeeklyLog
): Promise<string> => {
  
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure your environment to use AI features.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Format data for the prompt
  const weekDataSummary = Object.keys(data)
    .filter(dateKey => {
      // Simple filter to only include dates relevant to the context if needed, 
      // but passing the whole object is fine for the prompt context usually.
      return true;
    })
    .map(dateKey => {
      const dayData = data[dateKey];
      return `Date: ${dateKey}, Activities: ${JSON.stringify(dayData)}`;
    }).join('\n');

  const habitsList = HABITS.map(h => `${h.label} (${h.type})`).join(', ');

  const prompt = `
    You are a kind, wise, and encouraging Islamic spiritual coach.
    Here is my worship (Ibadah) and habit log for the recent days:
    
    Habits tracked: ${habitsList}
    
    My Logs:
    ${weekDataSummary}
    
    Please provide a short, warm reflection on my progress. 
    1. Acknowledge what I did well.
    2. Gently encourage me on areas where I might have missed (zeros or false).
    3. Give me 1 specific actionable spiritual tip for next week.
    
    Keep the tone motivating, strictly Islamic but universal and inclusive, and concise (under 150 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // No deep thinking needed for simple encouragement
      }
    });

    return response.text || "Could not generate insights at this time.";
  } catch (error) {
    console.error("Error fetching Gemini insights:", error);
    return "An error occurred while connecting to the spiritual guide. Please try again later.";
  }
};