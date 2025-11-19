import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  // Check process.env first, then fallback to localStorage for client-side input support
  const apiKey = process.env.API_KEY || localStorage.getItem('worksync_api_key');
  if (!apiKey) {
    console.warn("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDraftMessage = async (topic: string, tone: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Keyが設定されていません。プロフィール設定からキーを保存してください。";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, professional bulletin board message for a company internal board. 
      Topic: ${topic}
      Tone: ${tone}
      Language: Japanese.
      Keep it under 200 words. Format properly.`,
    });
    return response.text || "Failed to generate text.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error interacting with AI service.";
  }
};

export const summarizeThread = async (content: string, comments: string[]): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Keyが設定されていません。";

  const commentsText = comments.length > 0 ? `\nComments:\n${comments.join('\n')}` : '';
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following discussion thread into 3 bullet points in Japanese.
      
      Main Post: ${content}
      ${commentsText}`,
    });
    return response.text || "Summary unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating summary.";
  }
};