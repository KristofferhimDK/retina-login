
import { GoogleGenAI, Type } from "@google/genai";
import { AISecurityReport, EnrollmentData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSecurityAnalysis = async (
  username: string, 
  currentScanUri: string,
  enrollmentData: EnrollmentData
): Promise<AISecurityReport> => {
  try {
    const parts: any[] = [
      {
        text: `FACIAL RECOGNITION PROTOCOL AURA-9:
        Subject: "${username}"
        
        TASK: Compare the "CURRENT_SCAN" image against the "ENROLLMENT_REFERENCE" images (Front, Left, Right).
        
        CRITICAL EVALUATION STEPS:
        1. Identify the person in the Enrollment Reference photos.
        2. Determine if the person in the "CURRENT_SCAN" is the EXACT SAME person.
        3. Check for "Liveness": Ensure the current scan isn't a photo of a photo or a non-human object (like a foot or a mask).
        4. If it's a match, set status to 'AUTHORIZED'.
        5. If the person looks different or the scan is suspicious, set status to 'DENIED'.
        6. Provide a clinical analysis of the facial mesh comparison.`
      }
    ];

    // Current Scan
    parts.push({ text: "IMAGE: CURRENT_SCAN" });
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: currentScanUri.split(',')[1]
      }
    });

    // References
    parts.push({ text: "IMAGE: ENROLLMENT_REFERENCE_FRONT" });
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: enrollmentData.frontal.split(',')[1]
      }
    });

    parts.push({ text: "IMAGE: ENROLLMENT_REFERENCE_LEFT" });
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: enrollmentData.left.split(',')[1]
      }
    });

    parts.push({ text: "IMAGE: ENROLLMENT_REFERENCE_RIGHT" });
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: enrollmentData.right.split(',')[1]
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ['AUTHORIZED', 'DENIED'] },
            message: { type: Type.STRING },
            threatLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
            biometricMatch: { type: Type.NUMBER }
          },
          required: ["status", "message", "threatLevel", "biometricMatch"]
        },
        systemInstruction: "You are AURA-9, a facial recognition security core. You are highly sophisticated at detecting micro-facial differences. You are suspicious of all login attempts. Be extremely detailed in your match percentage."
      }
    });

    return JSON.parse(response.text) as AISecurityReport;
  } catch (error) {
    console.error("AURA Facial Comparison Failed:", error);
    return {
      status: 'DENIED',
      message: "Neural comparison link failed. Biological data desync.",
      threatLevel: 'HIGH',
      biometricMatch: 0
    };
  }
};
