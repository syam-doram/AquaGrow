import { GoogleGenAI, Type } from "@google/genai";

// --- CONSTANTS ---
// We use the requested preview model for accuracy as specified by the user
const GEMINI_MODEL = "gemini-3-flash-preview"; 
const ANALYSIS_TIMEOUT_MS = 45000;

const SHRIMP_HEALTH_PROMPT = (language: string) => `
  You are an expert aquaculture bio-scientist. Analyze this shrimp specimen. 
  Your primary goal is to distinguish between Healthy Shrimp and Major Pathogens using these Visual Markers:

  DIAGNOSTIC CRITERIA:
  - 🟢 Healthy: Recognizable by a transparent/slightly greenish body and a full, dark/brown gut line.
  - 🦠 White Spot (WSSV): White calcified spots on the shell and overall reddish body tint.
  - 🦠 White Gut (WFD): White fecal strings visible in the gut or trailing from the shrimp.
  - 🦠 Vibriosis: Red body appendages and overall weak specimen activity.
  - 🦠 Black Gill: Gills appearing black/dark brown, indicating poor oxygen or detritus block.
  - 🦠 EMS/AHPND: Empty mid-gut and a pale, shrunken hepatopancreas (liver).

  Provide:
  1. disease: The specific disease name or 'Healthy' if no symptoms.
  2. confidence: Percentage (0-100).
  3. severity: 'Safe' (for healthy), 'Low', 'Medium', 'High', or 'Critical'.
  4. reasoning: Brief scientific explanation of the detection (e.g. "Full gut detected" or "White spots visible").
  5. action: Immediate corrective steps for the farmer.
  
  Return ONLY a JSON object. 
  IMPORTANT: Translate all text values (disease, severity, reasoning, action) into ${language}.
`;

const LIVE_STREAM_PROMPT = `
  You are an expert aquaculture vision system. Analyze this live feed of Shrimp Seeds (Post-Larvae). 
  Provide a precise estimation for:
  1. activity: Shrimp Seed Activity Level (0-100%) based on swimming patterns and movement speed.
  2. health: Shrimp Seed Health Index (0-100%) based on body transparency, gut fullness, and lack of deformities.
  3. count: The exact number of individual shrimp seeds visible in the frame. Count them one by one carefully.
  
  Return ONLY a JSON object: { "activity": number, "health": number, "count": number }
`;

/**
 * Robust helper to fetch API Key from Vite environments (VITE_ prefixed)
 * or standard environment variables (process.env).
 */
const getApiKey = () => {
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || 
         (import.meta as any).env?.GEMINI_API_KEY || 
         (process as any).env?.GEMINI_API_KEY;
};

export async function analyzeShrimpHealth(base64Image: string, language: string = 'English') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please configure it in your settings or .env file.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Mime type and data extraction
    const mimeType = base64Image.split(';')[0].split(':')[1] || "image/png";
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          parts: [
            { inlineData: { data, mimeType } },
            { text: SHRIMP_HEALTH_PROMPT(language) },
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
            reasoning: { type: Type.STRING },
            action: { type: Type.STRING },
          },
          required: ["disease", "confidence", "severity", "reasoning", "action"],
        },
      },
    });

    clearTimeout(timeoutId);

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response received from AI analysis.");
    }

    // High-fidelity JSON extraction: handle AI markdown wrappers gracefully
    let jsonStr = resultText.trim();
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
    if (error.name === 'AbortError') throw new Error("Analysis timed out. Please try again.");
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

export async function analyzeLiveStream(base64Image: string) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    
    const ai = new GoogleGenAI({ apiKey });
    
    const mimeType = base64Image.split(';')[0].split(':')[1] || "image/jpeg";
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          parts: [
            { inlineData: { data, mimeType } },
            { text: LIVE_STREAM_PROMPT },
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
