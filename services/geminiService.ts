import { GoogleGenAI } from "@google/genai";
import { BrainOutput, ImageSize, AspectRatio, AppMode, TryOnBrainOutput, RemixBrainOutput, ModelIncubationAnalysis, StudioBrainOutput, StudioConcept } from "../types";
import { REMIX_SYSTEM_PROMPT, TRYON_SYSTEM_PROMPT, MODEL_INCUBATION_SYSTEM_PROMPT, STUDIO_SYSTEM_PROMPT } from "../constants";
import { cleanJsonString } from "../utils/fileUtils";

// Function to handle API key selection for Pro models
export const checkAndSelectApiKey = async (): Promise<void> => {
  // @ts-ignore - aistudio is added to window in specific environments
  if (window.aistudio) {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  }
};

const getAIClient = () => {
  // Always create a new client to pick up potentially newly selected keys
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Helper for Progress Tracking ---
async function runWithProgress<T>(
  tasks: Promise<T>[], 
  onProgress: (progress: number) => void
): Promise<T[]> {
  let completed = 0;
  const total = tasks.length;
  
  if (total === 0) return [];
  onProgress(0);

  // Wrap each promise to track completion
  const wrappedTasks = tasks.map(async (p) => {
    try {
      const res = await p;
      completed++;
      onProgress(Math.round((completed / total) * 100));
      return res;
    } catch (e) {
      completed++; // Even on error we count it as processed for progress bar logic
      onProgress(Math.round((completed / total) * 100));
      throw e;
    }
  });

  return Promise.all(wrappedTasks);
}

export const analyzeImages = async (
  refImageBase64: string,
  prodImageBase64s: string[],
  userInstruction: string,
  freedomLevel: number,
  mode: AppMode
): Promise<BrainOutput> => {
  // Ensure key is selected before analysis (Gemini 3 Pro requires it)
  await checkAndSelectApiKey();
  const ai = getAIClient();
  
  let systemPrompt = "";
  switch (mode) {
    case 'tryon': systemPrompt = TRYON_SYSTEM_PROMPT; break;
    case 'custom_model': systemPrompt = MODEL_INCUBATION_SYSTEM_PROMPT; break;
    case 'studio': systemPrompt = STUDIO_SYSTEM_PROMPT; break;
    default: systemPrompt = REMIX_SYSTEM_PROMPT;
  }
  
  const contents = {
    parts: [
      { text: mode === 'tryon' ? "Model Reference Image:" : (mode === 'studio' ? "Product Image to Analyze:" : "Reference Image:") },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: refImageBase64,
        },
      }
    ] as any[]
  };

  if (mode !== 'custom_model' && mode !== 'studio') {
     contents.parts.push({ text: mode === 'tryon' ? "Product Images (Jewelry to wear):" : "Product Images (Object to insert):" });
     prodImageBase64s.forEach(base64 => {
        contents.parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64,
          }
        });
      });
      contents.parts.push({ text: `User Instruction: ${userInstruction}` });
      contents.parts.push({ text: `User Freedom Level (0-10): ${freedomLevel}.` });
  } else if (mode === 'custom_model') {
    contents.parts.push({ text: "Task: Extract Model DNA as per system instructions." });
  } else if (mode === 'studio') {
    contents.parts.push({ text: `User Requirements / Special Requests: "${userInstruction}"` });
    contents.parts.push({ text: "Task: Identify jewelry material and design 3 specific studio concepts based on User Requirements." });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const cleanedText = cleanJsonString(text);
    const json = JSON.parse(cleanedText);
    
    if (mode === 'tryon') return json as TryOnBrainOutput;
    else if (mode === 'custom_model') return json as ModelIncubationAnalysis;
    else if (mode === 'studio') return json as StudioBrainOutput;
    else return json as RemixBrainOutput;
    
  } catch (e: any) {
    console.error("Analysis failed:", e);
    if (e.message?.includes("403") || e.status === 403) {
       throw new Error("Permission denied (403). Please select a valid API key with access to Gemini 3 Pro.");
    }
    throw new Error(e.message || "The AI Creative Director returned an invalid plan. Please try again.");
  }
};

export const generateRemixImage = async (
  prompt: string,
  productImageBase64s: string[],
  imageSize: ImageSize,
  aspectRatio: AspectRatio,
  count: number,
  onProgress: (progress: number) => void,
  refImageBase64?: string,
  isStrict: boolean = false,
  mode: AppMode = 'remix'
): Promise<string[]> => {
  await checkAndSelectApiKey();
  const ai = getAIClient();

  const generateSingle = async (index: number): Promise<string> => {
    const parts: any[] = [];
    
    // Inject Variance for multiple images
    let varianceInstruction = "";
    if (count > 1) {
       varianceInstruction = `\n\n [Generation ${index + 1} of ${count}]: Create a distinct variation. Change the camera angle, lighting nuance, or composition slightly so it is NOT identical to other versions.`;
    }

    if (isStrict && refImageBase64) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: refImageBase64 } });
      if (mode === 'tryon') {
        parts.push({ text: "Background/Model Reference:" });
        parts.push({ text: "Jewelry Objects to Wear:" });
        productImageBase64s.forEach(base64 => {
          parts.push({ inlineData: { mimeType: "image/jpeg", data: base64 } });
        });
        parts.push({ text: `Task: Remove any existing jewelry on the model. Wear ALL provided jewelry objects on the model. ${prompt} ${varianceInstruction}` });
      } else {
        parts.push({ text: "Background/Reference:" });
        productImageBase64s.forEach(base64 => {
          parts.push({ inlineData: { mimeType: "image/jpeg", data: base64 } });
        });
        parts.push({ text: "Object to Insert:" });
        parts.push({ text: `${prompt} ${varianceInstruction}` });
      }
    } else {
      productImageBase64s.forEach(base64 => {
        parts.push({ inlineData: { mimeType: "image/jpeg", data: base64 } });
      });
      parts.push({ text: `${prompt} ${varianceInstruction}` });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: { parts: parts },
      config: { imageConfig: { imageSize: imageSize, aspectRatio: aspectRatio } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image generated.");
  };

  try {
    const tasks = Array.from({ length: count }, (_, i) => generateSingle(i));
    return await runWithProgress(tasks, onProgress);
  } catch (e: any) {
    console.error("Image generation failed:", e);
    if (e.message?.includes("403") || e.status === 403) {
        throw new Error("Permission denied (403). Please select a valid API key with access to Gemini 3 Pro Image.");
    }
    throw e;
  }
};

export const generateStudioPhotos = async (
  concepts: StudioConcept[],
  productBase64: string,
  imageSize: ImageSize,
  aspectRatio: AspectRatio,
  countPerConcept: number,
  onProgress: (progress: number) => void
): Promise<string[]> => {
  await checkAndSelectApiKey();
  const ai = getAIClient();

  // Create a flattened list of tasks. 
  // If 2 concepts selected and count is 3, we have 6 tasks total.
  const tasks: Promise<string>[] = [];

  for (const concept of concepts) {
      for (let i = 0; i < countPerConcept; i++) {
          tasks.push((async () => {
              const varianceInstruction = countPerConcept > 1 
                ? `\n\n Variation ${i+1}: Ensure this shot is slightly different in angle or composition from other shots of the same style.` 
                : "";

              const parts = [
                { inlineData: { mimeType: "image/jpeg", data: productBase64 } },
                { text: `${concept.full_prompt_for_nano_banana} ${varianceInstruction} \n\n Lighting: ${concept.lighting_setup}. \n Negative Prompt: blurry, low quality, distorted, bad geometry, watermark, text.` }
              ];

              const response = await ai.models.generateContent({
                model: "gemini-3-pro-image-preview",
                contents: { parts: parts },
                config: { imageConfig: { imageSize: imageSize, aspectRatio: aspectRatio } }
              });

              for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
              }
              throw new Error("Failed to generate studio shot.");
          })());
      }
  }

  try {
    return await runWithProgress(tasks, onProgress);
  } catch (e: any) {
    console.error("Studio generation failed:", e);
     if (e.message?.includes("403") || e.status === 403) {
        throw new Error("Permission denied. Check API Key.");
    }
    throw e;
  }
};

export const generateVirtualModel = async (
    dna: ModelIncubationAnalysis,
    refImageBase64: string,
    freedomLevel: number,
    imageSize: ImageSize,
    aspectRatio: AspectRatio,
    onProgress: (progress: number) => void
  ): Promise<string[]> => {
    await checkAndSelectApiKey();
    const ai = getAIClient();
  
    // Base prompt construction (Same as before)
    const d = dna.demographics;
    const f = dna.visual_features;
    const v = dna.vibe_and_style;
  
    const basePrompt = `
      Subject DNA: ${d.race_ethnicity} ${d.gender}, ${d.age_vibe}.
      Facial Features: ${f.face_shape}, ${f.eye_characteristics}, ${f.skin_texture}.
      Hair: ${f.hair_style}, ${v.hair_vibe_keywords || ''}.
      Vibe & Expression: ${v.personality_tag}.
      **Uniform**: Tight black sleeveless sports tank top and black fitted shorts. Barefoot.
      Background: Pure white studio background (#FFFFFF).
      Lighting: Soft, even studio casting lighting.
      Quality: 8k, hyperrealistic.
    `;
    
    // Helper to get fidelity instruction based on freedom (Same as before)
    const getFidelityInstruction = (level: number, isProfile: boolean) => {
      if (isProfile) return "CRITICAL: The provided image is the Reference Identity. You MUST generate the EXACT SAME PERSON from a side profile angle. IGNORE the pose of the reference image. ONLY preserve the facial identity, skin tone, and body type.";
      if (level === 0) return "CRITICAL: STRICTLY preserve the exact identity, facial structure, and pixel details. Do not change the person.";
      if (level <= 2) return "Maintain strong resemblance to reference.";
      if (level <= 4) return "Create a 'Cousin' or 'Sister' look. Change specific facial features slightly.";
      if (level <= 7) return "Use reference ONLY for lighting/vibe. Create NEW face based on DNA.";
      return "Ignore reference person entirely. Create new model based ONLY on DNA.";
    };

    const viewConfigs = {
      frontal: { prompt: "**VIEW: FULL BODY FRONT** (0 degrees). Symmetrical pose. Eyes at camera.", negative: "side view, profile, asymmetric" },
      left: { prompt: "**VIEW: SIDE PROFILE FACING LEFT** (←). See Right side of face.", negative: "front view, right profile" },
      right: { prompt: "**VIEW: SIDE PROFILE FACING RIGHT** (→). See Left side of face.", negative: "front view, left profile" }
    };

    const generateView = async (viewConfig: {prompt: string, negative: string}, refB64: string | null, fidelity: string): Promise<string> => {
      const parts: any[] = [];
      if (refB64) parts.push({ inlineData: { mimeType: "image/jpeg", data: refB64 } });
      parts.push({ text: `${viewConfig.prompt}\n${fidelity}\n${basePrompt}\nNegative Prompt: shoes, jewelry, accessories, heavy makeup, ${viewConfig.negative}`});

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: { parts: parts },
        config: { imageConfig: { imageSize: imageSize, aspectRatio: aspectRatio } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("Generation failed");
    };

    try {
      // Manual progress handling for this sequential/dependent flow
      onProgress(10);
      
      const frontalFidelity = getFidelityInstruction(freedomLevel, false);
      const useUploadAsRef = freedomLevel <= 8; 
      
      const frontalResult = await generateView(viewConfigs.frontal, useUploadAsRef ? refImageBase64 : null, frontalFidelity);
      onProgress(40);

      let profileRefB64 = refImageBase64;
      if (freedomLevel > 2) profileRefB64 = frontalResult.split(',')[1];

      const profileFidelity = getFidelityInstruction(0, true);

      // Run profiles in parallel
      const [leftResult, rightResult] = await Promise.all([
        generateView(viewConfigs.left, profileRefB64, profileFidelity),
        generateView(viewConfigs.right, profileRefB64, profileFidelity)
      ]);
      onProgress(100);

      return [frontalResult, leftResult, rightResult];

    } catch (e: any) {
        console.error("Model generation failed:", e);
        if (e.message?.includes("403") || e.status === 403) {
            throw new Error("Permission denied. Check API Key.");
        }
        throw e;
    }
  };