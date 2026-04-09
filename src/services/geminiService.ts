import { GoogleGenAI, Type } from "@google/genai";

// --- CONSTANTS ---
// We use the requested preview model for accuracy as specified by the user
const GEMINI_MODEL = "gemini-3-flash-preview"; 
const ANALYSIS_TIMEOUT_MS = 45000;

const SHRIMP_HEALTH_PROMPT = (language: string) => `
You are a certified aquaculture pathologist with 20 years of shrimp disease diagnosis experience.
Analyze this shrimp specimen photo carefully. Return a precise diagnosis using ONLY the visual evidence visible in the image.

════════════════════════════════════════════
VISUAL DIAGNOSTIC GUIDE (use this to analyze):
════════════════════════════════════════════

1. 🟢 HEALTHY SHRIMP
   - Full dark-brown/orange gut line visible from head to tail
   - Clear transparent or slightly blue-green body
   - Normal muscle opacity (not white/opaque)
   - Orange/brown hepatopancreas (liver area near head)
   → disease: "Healthy Shrimp", severity: "Safe"

2. 🔴 WHITE SPOT DISEASE (WSSV)
   - White calcified circular spots (0.5–2mm) on shell/carapace — cannot be wiped off
   - Reddish-pink body color overall
   - Loose shell that peels easily
   → disease: "White Spot Disease (WSSV)", severity: "Critical"

3. 🔴 EARLY MORTALITY SYNDROME (EMS/AHPND)
   - Pale, shrunken or white hepatopancreas near the head (should be orange)
   - Nearly empty gut / transparent body
   - Soft and wrinkled carapace at early DOC
   → disease: "Early Mortality Syndrome (EMS/AHPND)", severity: "Critical"

4. 🟡 BLACK GILL DISEASE
   - Gills appear dark brown or black under carapace
   - Pale overall body with dark gill contrast
   - Evidence of debris or detritus on gill surface
   → disease: "Black Gill Disease", severity: "Moderate"

5. 🟡 WHITE GUT DISEASE (WGD)
   - Pale/white gut line instead of dark-brown (visible along body)
   - White thread-like fecal strings trailing from shrimp
   - Gut appears empty or opaque white
   → disease: "White Gut Disease (WGD)", severity: "Medium"

6. 🟠 RUNNING MORTALITY SYNDROME (RMS)
   - Soft, wrinkled carapace — shell collapses on pressing
   - Dull pale body with no specific spots or discoloration
   - Multiple dead shrimp with no obvious external marks
   → disease: "Running Mortality Syndrome (RMS)", severity: "High"

7. 🟠 EHP (Enterocytozoon hepatopenaei)
   - Unusually small body for expected culture age
   - Slightly pale hepatopancreas
   - Soft carapace with undersized development
   - No obvious external lesions but stunted appearance
   → disease: "EHP (Slow Growth Parasite)", severity: "High"

8. 🟠 VIBRIOSIS
   - Reddish or blackish necrotic coloration on tail fins, legs, uropods
   - Black spots at appendage joints
   - Cloudy or opaque body tissue
   - Glowing/luminescent in dim light
   → disease: "Vibriosis", severity: "High"

9. 🟡 IHHNV (Deformity Virus)
   - Visibly bent or kinked rostrum (forward horn of shrimp head)
   - Deformed curved body — not the normal straight shrimp shape
   - Rough or pitted carapace texture
   → disease: "IHHNV (Deformity Virus)", severity: "Moderate"

10. 🟢 SHELL DISEASE (Shell Rot)
    - Black or brown irregular lesions/spots on carapace surface
    - Pitted, rough, eroded shell texture
    - Erosion at shell edges or rostrum tip
    → disease: "Shell Disease (Shell Rot)", severity: "Low"

11. 🟢 FOULING (External Parasites)
    - Fuzzy, dirty grayish growth on shell or gill area
    - Dusty/film-like coating visible on body surface
    - Gills clogged with visible organic debris
    → disease: "Fouling (External Parasites)", severity: "Low"

════════════════════════════════════════════
IMPORTANT RULES:
● Base your diagnosis ONLY on what is VISUALLY VISIBLE in this specific photo
● FIRST check: is there an actual shrimp body clearly visible in this image?
  - If NO shrimp body is visible (e.g. just water, pond, feed, equipment, hands, blurry photo) →
    set shrimpObserved: false, notObservedReason describing what you actually see, disease: "No Shrimp Observed"
  - If YES a shrimp body is visible → set shrimpObserved: true, then diagnose
● If the image is blurry or too dark to diagnose → set disease: "Clear Photo Required", confidence: 0
● If multiple conditions are present, report the PRIMARY (most severe) condition
● Be very specific about what you see — farmers need to understand your observation
● confidence = 0 for unclear/no shrimp images; 65–95 for images with clear visible disease markers

Return this EXACT JSON structure:
{
  "shrimpObserved": true or false,
  "notObservedReason": "what is actually visible in the photo if no shrimp is found (empty string if shrimp found)",
  "disease": "disease name as listed above or 'Healthy Shrimp' or 'No Shrimp Observed'",
  "confidence": number (0–100),
  "severity": "Safe | Low | Medium | Moderate | High | Critical | N/A",
  "affectedPart": "e.g. 'Gut', 'Shell', 'Hepatopancreas', 'Gills', 'Appendages', 'Whole Body', 'Rostrum', 'Body Shape', 'N/A'",
  "reasoning": "2–3 sentence scientific observation based only on what you see in the photo",
  "action": "3 immediate actions the farmer must take today (or 'Take a clear photo of a shrimp body' if not observed)"
}

Translate all text field values to: ${language}
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

  // ── Retry helper: exponential backoff for 503 / overload errors ──
  const MAX_RETRIES  = 3;
  const RETRY_DELAY  = (attempt: number) => 2000 * Math.pow(2, attempt); // 2s, 4s, 8s

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('Gemini API Key is missing. Please configure it in Settings.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';
      const data     = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

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
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              shrimpObserved:    { type: Type.BOOLEAN },
              notObservedReason: { type: Type.STRING  },
              disease:           { type: Type.STRING  },
              confidence:        { type: Type.NUMBER  },
              severity:          { type: Type.STRING  },
              affectedPart:      { type: Type.STRING  },
              reasoning:         { type: Type.STRING  },
              action:            { type: Type.STRING  },
            },
            required: ['shrimpObserved', 'notObservedReason', 'disease', 'confidence', 'severity', 'affectedPart', 'reasoning', 'action'],
          },
        },
      });

      clearTimeout(timeoutId);

      const resultText = response.text;
      if (!resultText) throw new Error('No response received from AI analysis.');

      let jsonStr = resultText.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
      }

      return JSON.parse(jsonStr);

    } catch (error: any) {
      clearTimeout(timeoutId);

      // AbortError = user timeout — no retry
      if (error.name === 'AbortError') throw new Error('Analysis timed out. Please try again.');

      // 503 / UNAVAILABLE / overload — retry with backoff
      const is503 = error?.message?.includes('503') ||
                    error?.message?.includes('UNAVAILABLE') ||
                    error?.message?.includes('high demand') ||
                    error?.status === 503;

      if (is503 && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY(attempt);
        console.warn(`Gemini 503 — retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})…`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // retry
      }

      // Final failure — throw descriptive error
      const userMessage = is503
        ? 'AI server is temporarily overloaded. Please wait a moment and try again.'
        : (error?.message || 'AI analysis failed. Please try again.');

      console.error('AI Analysis Error (final):', error);
      throw new Error(userMessage);
    }
  }

  // Should never reach here, but TypeScript requires it
  throw new Error('AI analysis failed after maximum retries.');
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

// ─── WATER TEST SCANNER ────────────────────────────────────────────────────────

const WATER_TEST_PROMPT = `
You are an expert aquaculture water quality analyst with 20+ years diagnosing shrimp pond problems using BOTH water color observation AND parameter measurements.

This image may show ONE OR MORE of:
A) Pond water photo (look at the colour of the water)
B) Test kit vials / colorimetric strips / refractometer / digital pH/DO/TDS meters
C) Combination of both

════════════════════════════════════════════════════════
STEP 1: WATER COLOUR IDENTIFICATION
════════════════════════════════════════════════════════

Identify the dominant water colour from the image and map to one of these categories:

LIGHT_GREEN → Light / pale green water
  Meaning: Balanced phytoplankton bloom
  → Status: HEALTHY
  → pH expected: 7.5–8.5, DO: >5 mg/L

DARK_GREEN → Dark green, thick green water  
  Meaning: Excess algae over-bloom
  → Problems: Night DO crash, sudden pH swings
  → pH expected: >8.5, DO: high day / crash night
  → Disease risk: White Gut, Vibriosis

BROWN → Brown / tea-coloured water
  Meaning: Diatoms (good early) OR organic overload
  → Check: stable = ok, thick dirty = waste buildup
  → Ammonia slightly elevated, DO medium
  → Disease risk: Black Gill, Slow Growth

BLACK → Black or very dark brown water
  Meaning: Heavy organic waste, pond bottom decay, H₂S
  → NH₃ likely >0.5 mg/L, DO likely <3 mg/L
  → Disease risk: RMS, Vibriosis, Mortality (URGENT)

BLUE_GREEN → Blue-green tint (cyanobacteria bloom)
  Meaning: Harmful algal bloom, toxin release
  → pH likely >9, DO fluctuating
  → Disease risk: EMS, White Gut, Feed reduction

CLEAR → Very clear / transparent water
  Meaning: No plankton — biologically empty
  → DO unstable, temperature fluctuating
  → Risk: Weak shrimp, low natural food, disease entry

MURKY_YELLOW → Yellow or murky yellowish water
  Meaning: Turbidity / suspended soil particles
  → Turbidity high, stress on gills
  → Risk: Black Gill, reduced immunity

REDDISH → Red or reddish water
  Meaning: Iron contamination or flagellate bloom
  → Check source water, metallic toxicity
  → Disease risk: Shell disease, oxidative stress

UNKNOWN → Cannot determine water colour from image

════════════════════════════════════════════════════════
STEP 2: PARAMETER READINGS (from test equipment if visible)
════════════════════════════════════════════════════════

Shrimp-safe ranges (L. vannamei):
pH          → Safe: 7.5–8.5  │ Optimal: 7.8–8.3  │ Critical: <7.0 or >9.0
DO (mg/L)   → Safe: >5       │ Optimal: 6–8      │ Critical: <3
NH₃ (mg/L)  → Safe: <0.1     │ Optimal: <0.05    │ Critical: >0.5
Salinity(pt)→ Safe: 10–25    │ Optimal: 15–20    │ Critical: <5 or >35
Temp (°C)   → Safe: 23–31    │ Optimal: 27–30    │ Critical: <18 or >35

If a parameter is not visible in the image: set raw to "Not visible", status to "unknown".

════════════════════════════════════════════════════════  
STEP 3: SMART COMBINATION DIAGNOSIS
════════════════════════════════════════════════════════

Cross-reference colour + parameters using this logic:

Case 1: DARK_GREEN + pH >9  → Algae bloom + pH toxicity stress → White Gut, stress
Case 2: BLACK + NH₃>0.5 + DO<3 → TOXIC POND — immediate emergency action
Case 3: BLUE_GREEN + pH high → Cyanobacteria bloom — drain risk
Case 4: CLEAR + Temp high → No plankton + heat stress → weak shrimp
Case 5: BROWN + NH₃ elevated → Organic overload → Black Gill, slow growth
Case 6: DARK_GREEN + DO low night → Night crash risk → reduce feed 30%, aerators 24h

Generate:
- problems[]: list of specific problems identified (be specific, include root cause)
- diseaseRisks[]: list of shrimp diseases at risk based on colour+params combination  
- urgentAction: single most urgent thing farmer must do RIGHT NOW (if critical)
- recommendations[]: 3–5 numbered SOP steps for farmer to take
- overallStatus: "excellent" | "good" | "warning" | "critical"
- summary: 2-sentence expert assessment combining colour + parameter findings

════════════════════════════════════════════════════════
VALIDATION FIRST:
Before doing any analysis, check: does this image actually show pond water OR water test equipment?
- Pond water (coloured water) → imageValid: true, can analyse colour
- Test strip / vial / meter / refractometer → imageValid: true, can read parameters
- Random photo (food, person, landscape, unclear) → imageValid: false, set notDetectedReason
- Blank/black/white image → imageValid: false

If imageValid is false: skip all parameter readings, return zeros/unknown for all params.

════════════════════════════════════════════════════════
RESPOND ONLY WITH VALID JSON. No markdown. No extra text.
`;


export async function analyzeWaterTest(base64Image: string): Promise<any> {
  const controller  = new AbortController();
  const timeoutId   = setTimeout(() => controller.abort(), 60000);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = (attempt: number) => 2000 * Math.pow(2, attempt);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error('Gemini API Key is missing. Configure it in Settings.');

      const ai       = new GoogleGenAI({ apiKey });
      const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/jpeg';
      const data     = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{
          parts: [
            { inlineData: { data, mimeType } },
            { text: WATER_TEST_PROMPT },
          ],
        }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedEquipment: { type: Type.STRING },
              confidence:        { type: Type.NUMBER },
              overallStatus:     { type: Type.STRING },
              summary:           { type: Type.STRING },
              urgentAction:      { type: Type.STRING },
              ph: {
                type: Type.OBJECT,
                properties: {
                  value:  { type: Type.NUMBER },
                  raw:    { type: Type.STRING },
                  status: { type: Type.STRING },
                },
                required: ['raw', 'status'],
              },
              do_: {
                type: Type.OBJECT,
                properties: {
                  value:  { type: Type.NUMBER },
                  raw:    { type: Type.STRING },
                  status: { type: Type.STRING },
                },
                required: ['raw', 'status'],
              },
              ammonia: {
                type: Type.OBJECT,
                properties: {
                  value:  { type: Type.NUMBER },
                  raw:    { type: Type.STRING },
                  status: { type: Type.STRING },
                },
                required: ['raw', 'status'],
              },
              salinity: {
                type: Type.OBJECT,
                properties: {
                  value:  { type: Type.NUMBER },
                  raw:    { type: Type.STRING },
                  status: { type: Type.STRING },
                },
                required: ['raw', 'status'],
              },
              temperature: {
                type: Type.OBJECT,
                properties: {
                  value:  { type: Type.NUMBER },
                  raw:    { type: Type.STRING },
                  status: { type: Type.STRING },
                },
                required: ['raw', 'status'],
              },
              waterColor: {
                type: Type.OBJECT,
                properties: {
                  detected: { type: Type.STRING },
                  label:    { type: Type.STRING },
                  hex:      { type: Type.STRING },
                  meaning:  { type: Type.STRING },
                  status:   { type: Type.STRING },
                },
                required: ['detected', 'label', 'hex', 'meaning', 'status'],
              },
              problems:      { type: Type.ARRAY, items: { type: Type.STRING } },
              diseaseRisks:  { type: Type.ARRAY, items: { type: Type.STRING } },
              imageValid:        { type: Type.BOOLEAN },
              notDetectedReason: { type: Type.STRING  },
              recommendations: {
                type:  Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['detectedEquipment', 'confidence', 'overallStatus', 'summary',
                       'urgentAction', 'ph', 'do_', 'ammonia', 'salinity', 'temperature',
                       'waterColor', 'problems', 'diseaseRisks',
                       'imageValid', 'notDetectedReason', 'recommendations'],
          },
        },
      });

      clearTimeout(timeoutId);
      const text = response.text;
      if (!text) throw new Error('No response from AI.');

      let json = text.trim();
      if (json.startsWith('```json')) json = json.replace(/^```json/, '').replace(/```$/, '').trim();
      else if (json.startsWith('```')) json = json.replace(/^```/, '').replace(/```$/, '').trim();

      return JSON.parse(json);

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new Error('Analysis timed out. Please try again.');

      const is503 = error?.message?.includes('503') ||
                    error?.message?.includes('UNAVAILABLE') ||
                    error?.message?.includes('high demand');

      if (is503 && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY(attempt);
        console.warn(`Water Test 503 — retrying in ${delay / 1000}s (${attempt + 1}/${MAX_RETRIES})…`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      throw new Error(is503
        ? 'AI server is temporarily overloaded. Please wait and try again.'
        : (error?.message || 'Water test analysis failed.'));
    }
  }

  throw new Error('Analysis failed after maximum retries.');
}
