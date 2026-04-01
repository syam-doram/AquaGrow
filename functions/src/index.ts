import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { VertexAI, SchemaType } from "@google-cloud/vertexai";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

const PROJECT_ID = "aquagrow-37a3e";
const LOCATION = "us-central1";

// --- VERIFIED DISEASE DATABASE (HYBRID APPROACH) ---
const DISEASE_DATABASE: Record<string, { disease: string, action: string, symptoms: string[] }> = {
  "WSSV": {
    disease: "White Spot Syndrome Virus (WSSV)",
    action: "ID: PROTOCOL-WSSV. Immediate BIOS-Restriction. Stop water exchange. Increase aeration. Emergency harvest if size is >10g.",
    symptoms: ["white spots", "red appendages", "empty gut"]
  },
  "EHP": {
    disease: "EHP Infection (Enterocytozoon hepatopenaei)",
    action: "ID: PROTOCOL-EHP. Focus on Soil Treatment. Apply high-dose Gut Probiotics. Monitor growth lag. Check mineral balance (Ca:K).",
    symptoms: ["shrunken HP", "pale hepatopancreas", "stunted growth"]
  },
  "WFD": {
    disease: "White Feces Disease (WFD)",
    action: "ID: PROTOCOL-WFD. Reduce feed by 30% immediately. Apply Gut-Probiotics every feed. Siphon bottom waste. Maintain high DO >5ppm.",
    symptoms: ["white fecal strings", "intermittent gut", "floating feces"]
  },
  "VIBRIO": {
    disease: "Vibriosis / Septicemia",
    action: "ID: PROTOCOL-VIBRIO. Use Pond-Sanitizers. Apply Liver Tonic. Increase oxygen to 100% capacity. Check water vibrio count.",
    symptoms: ["red appendages", "opaque muscle", "lethargy"]
  },
  "HEALTHY": {
    disease: "Healthy Specimen",
    action: "Maintain standard SOP. Continue routine water quality monitoring (pH, DO, Salinity). No corrective action needed.",
    symptoms: ["full gut", "dark hepatopancreas", "active movement"]
  }
};

const RATE_LIMIT_PER_DAY = 10;

async function checkRateLimit(uid: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const usageRef = db.collection('usage').doc(uid).collection('diagnostics').doc(today);
  return db.runTransaction(async (transaction: admin.firestore.Transaction) => {
    const doc = await transaction.get(usageRef);
    const count = doc.exists ? (doc.data()?.count || 0) : 0;
    if (count >= RATE_LIMIT_PER_DAY) return false;
    transaction.set(usageRef, { count: count + 1, lastUsed: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return true;
  });
}

/**
 * Enhanced AI Detection: Hybrid Approach
 * 1. AI analyzes visual markers.
 * 2. Cross-references results with Verified Disease Database.
 */
export const analyzeShrimpHealth = onCall({ 
  timeoutSeconds: 60,
  region: "us-central1"
}, async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Secure AI services require login.");
  }

  const { base64Image, language = "English" } = request.data;
  if (!base64Image) {
    throw new HttpsError("invalid-argument", "Missing image.");
  }

  const isAllowed = await checkRateLimit(request.auth.uid);
  if (!isAllowed) throw new HttpsError("resource-exhausted", "Daily AI limit reached.");

  try {
    const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
    const generativeModel = vertex_ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
             detectedKey: { type: SchemaType.STRING, description: "One of: WSSV, EHP, WFD, VIBRIO, HEALTHY" },
             confidence: { type: SchemaType.NUMBER },
             reasoning: { type: SchemaType.STRING },
             markerDetails: { type: SchemaType.STRING }
          },
          required: ["detectedKey", "confidence", "reasoning", "markerDetails"],
        },
      },
    });

    const mimeType = base64Image.split(';')[0].split(':')[1] || "image/png";
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const result = await generativeModel.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: `Identify shrimp disease in ${language}. Analyze carapace, HP color, and gut. Return detectedKey: WSSV, EHP, WFD, VIBRIO, or HEALTHY.` },
          { inlineData: { mimeType, data } }
        ]
      }]
    });

    const responseText = result.response.candidates?.[0].content.parts[0].text;
    const aiResult = responseText ? JSON.parse(responseText) : {};
    
    // HYBRID MERGE: Cross-reference with Predefined Database
    const dbMatch = DISEASE_DATABASE[aiResult.detectedKey] || DISEASE_DATABASE["HEALTHY"];
    
    return {
      disease: dbMatch.disease,
      confidence: aiResult.confidence,
      severity: aiResult.detectedKey === "HEALTHY" ? "Safe" : aiResult.detectedKey === "WSSV" || aiResult.detectedKey === "WFD" ? "Critical" : "Warning",
      reasoning: aiResult.reasoning,
      markerAnalysis: aiResult.markerDetails,
      action: dbMatch.action,
      verifiedSchema: true
    };

  } catch (error: any) {
    logger.error("Error:", error);
    throw new HttpsError("internal", "Diagnostics failed.");
  }
});

/**
 * High-performance analysis for live seed activity.
 */
export const analyzeLiveStream = onCall({ 
  timeoutSeconds: 30,
  region: "us-central1"
}, async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required.");
  }

  try {
    const { base64Image } = request.data;
    const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
    const generativeModel = vertex_ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const mimeType = base64Image.split(';')[0].split(':')[1] || "image/jpeg";
    const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const result = await generativeModel.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: "Analyze activity and health." },
          { inlineData: { mimeType, data } }
        ]
      }]
    });

    const responseText = result.response.candidates?.[0].content.parts[0].text;
    return responseText ? JSON.parse(responseText) : {};
  } catch (error: any) {
    logger.error("Error:", error);
    throw new HttpsError("internal", "Analysis failed.");
  }
});
