import { GoogleGenAI, Type } from "@google/genai";

const PRODUCTION_KEY = "AIzaSyCThD7OqfoODpoXtM304lH0q6dioiU0UvM";

export async function analyzeShrimpHealth(base64Image: string, language: string = 'English') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const ai = new GoogleGenAI({ apiKey: PRODUCTION_KEY });

    const mimeType = base64Image.split(';')[0].split(':')[1] || "image/png";
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data,
                mimeType,
              },
            },
            {
              text: `You are an expert aquaculture bio-scientist. Analyze this shrimp specimen for diseases (like WSSV, EHP, Vibrio, IMNV, White Feces, etc.). 
              
              Primary targets:
              - WSSV: White spots on carapace.
              - EHP: Pale/shrunken HP.
              - IMNV: Opaque/milky tail muscle.
              - Vibrio: Reddish appendages.
              
              Provide:
              1. disease: The specific disease name or 'Healthy'.
              2. confidence: Percentage (0-100).
              3. severity: 'Safe', 'Warning', or 'Critical'.
              4. action: Technical SOP corrective steps.
              
              Return ONLY a JSON object. 
              IMPORTANT: Translate all text values into ${language}.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            disease: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            severity: { type: Type.STRING },
            action: { type: Type.STRING },
          },
          required: ["disease", "confidence", "severity", "action"],
        },
      },
    });

    clearTimeout(timeoutId);

    if (!response.text) {
      throw new Error("No response received from AI analysis.");
    }

    // Clean up response text in case it's wrapped in markdown
    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
    }

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", jsonStr);
      throw new Error("Invalid response format from AI.");
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Analysis timed out. Please try again.");
    }
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

export async function analyzeLiveStream(base64Image: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    const mimeType = base64Image.split(';')[0].split(':')[1] || "image/jpeg";
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data,
                mimeType,
              },
            },
            {
              text: `You are an expert aquaculture vision system. Analyze this live feed of Shrimp Seeds (Post-Larvae). 
              Provide a precise estimation for:
              1. activity: Shrimp Seed Activity Level (0-100%) based on swimming patterns and movement speed.
              2. health: Shrimp Seed Health Index (0-100%) based on body transparency, gut fullness, and lack of deformities.
              3. count: The exact number of individual shrimp seeds visible in the frame. Count them one by one carefully.
              
              Return ONLY a JSON object: { "activity": number, "health": number, "count": number }`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            activity: { type: Type.NUMBER },
            health: { type: Type.NUMBER },
            count: { type: Type.NUMBER },
          },
          required: ["activity", "health", "count"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Live Analysis Error:", error);
    return null;
  }
}
