
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
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

/**
 * Retry utility for 503 Overloaded and 500 Internal errors
 * Retries up to 10 times with exponential backoff + jitter
 */
const retryWithBackoff = async <T>(
  operation: () => Promise<T>, 
  retries: number = 10, 
  initialDelay: number = 3000
): Promise<T> => {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      const errorString = JSON.stringify(error);
      const isOverloaded = 
        error?.status === 503 || 
        error?.code === 503 ||
        error?.message?.includes('503') || 
        error?.message?.toLowerCase().includes('overloaded') ||
        error?.message?.includes('UNAVAILABLE') ||
        errorString.includes('503') ||
        errorString.includes('UNAVAILABLE');

      const isInternalError = 
        error?.status === 500 || 
        error?.code === 500 ||
        error?.message?.includes('500') ||
        error?.message?.toLowerCase().includes('internal error') ||
        error?.message?.includes('INTERNAL') ||
        errorString.includes('500');

      if ((!isOverloaded && !isInternalError) || attempt >= retries) {
        throw error;
      }

      attempt++;
      // Exponential backoff: 3s, 6s, 12s, 24s... with cap at 30s
      const backoff = initialDelay * Math.pow(2, attempt - 1);
      const delay = Math.min(backoff, 30000) + (Math.random() * 1000);
      
      const errorType = isOverloaded ? 'Overloaded (503)' : 'Internal Error (500)';
      console.warn(`[Gemini Service] ${errorType}. Retrying in ${Math.round(delay/1000)}s... (Attempt ${attempt}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Concurrency Scheduler
 * Limits the number of concurrent executions of async tasks.
 */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
  onProgress: (val: number) => void
): Promise<T[]> {
  const results: T[] = [];
  let i = 0;
  let completed = 0;
  const total = tasks.length;
  
  if (total === 0) return [];
  onProgress(0);

  const next = async (): Promise<void> => {
    if (i >= total) return;
    const taskIndex = i++;
    const currentTask = tasks[taskIndex];
    try {
      const res = await currentTask();
      // Store result at correct index to maintain order if needed, 
      // though push order might vary. Array length pre-allocation would be better 
      // but simplistic push is usually fine if order doesn't matter for independent images.
      // For strict ordering, we would use an array of size total.
      results[taskIndex] = res; 
    } catch (error) {
      console.error(`Task ${taskIndex} failed`, error);
      throw error; // Propagate error to fail the batch
    } finally {
      completed++;
      onProgress(Math.round((completed / total) * 100));
      // Recursively trigger next task
      if (i < total) {
        await next();
      }
    }
  };

  // Initialize executors up to the limit
  const executors = [];
  const maxParallel = Math.min(limit, total);
  for (let k = 0; k < maxParallel; k++) {
    executors.push(next());
  }

  await Promise.all(executors);
  return results;
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

  // Add products only if not in custom_model mode (extraction phase ignores jewelry) and not in studio mode (input IS product)
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
      
      // Inject specific Try-On Modes for Nano Banana Core
      if (mode === 'tryon') {
        const subMode = freedomLevel === 0 
           ? "MODE B - Sub-Mode 1: KEEP_LOOK (Preserve Facial Identity)" 
           : "MODE B - Sub-Mode 2: DIGITAL_REMIX (Generate Copyright-Free Lookalike/Vibe Twin)";
        contents.parts.push({ text: `Try-On Mode Selection: ${subMode}` });
        contents.parts.push({ text: `Constraint: ${freedomLevel === 0 ? "Strictly preserve model's FACE identity. Design styling/outfit/pose to suit jewelry." : "Generate a new person with similar vibe."}` });
      } else {
        contents.parts.push({ text: `User Freedom Level (0-10): ${freedomLevel}.` });
      }

  } else if (mode === 'custom_model') {
    // Custom Model instructions for phase 1
    contents.parts.push({ text: "Task: Extract Model DNA as per system instructions." });
  } else if (mode === 'studio') {
    // Studio mode - Pass user requirements
    contents.parts.push({ text: `User Requirements / Special Requests: "${userInstruction}"` });
    contents.parts.push({ text: "Task: Identify jewelry material and design 3 specific studio concepts based on User Requirements." });
  }

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    }));

    const text = response.text || "{}";
    const cleanedText = cleanJsonString(text);
    const json = JSON.parse(cleanedText);
    
    // Type assertion based on mode
    if (mode === 'tryon') {
      return json as TryOnBrainOutput;
    } else if (mode === 'custom_model') {
      return json as ModelIncubationAnalysis;
    } else if (mode === 'studio') {
      return json as StudioBrainOutput;
    } else {
      return json as RemixBrainOutput;
    }
    
  } catch (e: any) {
    console.error("Analysis failed:", e);
    if (e.message?.includes("403") || e.status === 403) {
       throw new Error("Permission denied (403). Please select a valid API key with access to Gemini 3 Pro.");
    }
    throw new Error(e.message || "The AI Creative Director returned an invalid plan. Please try again.");
  }
};

export const generateRemixImage = async (
  prompt: string | string[],
  productImageBase64s: string[],
  imageSize: ImageSize,
  aspectRatio: AspectRatio,
  count: number,
  onProgress: (progress: number) => void,
  refImageBase64?: string,
  isStrict: boolean = false,
  mode: AppMode = 'remix'
): Promise<string[]> => {
  // Ensure key is selected before high-quality generation
  await checkAndSelectApiKey();
  const ai = getAIClient();

  // Create Task Definitions (Functions returning Promises)
  const taskDefinitions = Array.from({ length: count }, (_, i) => async () => {
    const parts: any[] = [];
    
    // Select specific prompt if array is passed (for Try-On variations), else use single prompt
    const currentPrompt = Array.isArray(prompt) ? prompt[i % prompt.length] : prompt;

    // Inject Variance for multiple images if prompts are identical (fallback)
    let varianceInstruction = "";
    if (count > 1 && !Array.isArray(prompt)) {
       varianceInstruction = `\n\n [Generation ${i + 1} of ${count}]: Create a distinct variation. Change the camera angle, lighting nuance, or composition slightly so it is NOT identical to other versions.`;
    }

    // --- LOGIC FOR STRICT / EDITING ---
    if (isStrict && refImageBase64) {
      
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: refImageBase64
        }
      });
      
      if (mode === 'tryon') {
        parts.push({ text: "Background/Model Reference:" });
        parts.push({ text: "Jewelry Objects to Wear:" });
        
        productImageBase64s.forEach(base64 => {
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: base64
            }
          });
        });

        // Updated Prompt for High Fidelity Try-On (Level 0) with SMART POSE and REALISTIC SIZING logic
        parts.push({ text: `
TASK: Intelligent High-Fidelity Virtual Try-On.

1. ANALYZE JEWELRY TYPE:
   - Identify what kind of jewelry is provided in the "Jewelry Objects" (Ring? Necklace? Earrings? Bracelet?).
   
2. REALISTIC SIZING & SCALE (CRITICAL):
   - **DEFAULT BEHAVIOR**: Assume jewelry is **delicate, small, and realistic** in size (especially ear studs, small rings, thin chains) unless the User Prompt explicitly says "oversized", "huge", "large statement piece", or "avant-garde volume".
   - **Input Handling**: The input product image might be a macro close-up. **DO NOT** make the item giant on the model. Scale it down to match human anatomy perfectly.
   - **Earrings**: If they look like studs, they must be small on the earlobe. Do not expand them.
   - **Rings**: Must look like normal finger rings, not giant brass knuckles, unless specified.

3. SMART POSE ADAPTATION (CRITICAL):
   - You MUST adapt the model's pose to elegantly showcase ALL provided items.
   - If there is a RING: The model MUST move a hand near the face or body so the ring is clearly visible and focal.
   - If there are EARRINGS: Ensure hair is tucked or head is tilted so ears are visible.
   - If there is a NECKLACE: Ensure neck area is unobstructed.
   - If multiple items: Combine them naturally (e.g., hand near face showing ring, while head tilt shows earrings).

4. STRICT CONSTRAINTS (LOCK):
   - BACKGROUND: 100% IDENTICAL to Reference. (Use inpainting logic to fill gaps from pose changes, but keep scene/lighting style identical).
   - FACE ID: 100% IDENTICAL Identity. Do not change the person.
   - PRODUCT: 100% IDENTICAL Material/Color to uploaded jewelry images.

5. EXECUTION:
   - Wear ALL provided jewelry objects on the model.
   - Remove any *old* jewelry from the reference image.
   
${currentPrompt} ${varianceInstruction}
        ` });
      } else {
        // Strict Remix
        parts.push({ text: "Background/Reference:" });
        
        // For remix, we usually expect 1, but if multiple passed, we send them.
        productImageBase64s.forEach(base64 => {
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: base64
            }
          });
        });

        parts.push({ text: "Object to Insert:" });
        parts.push({ text: `${currentPrompt} ${varianceInstruction}` });
      }

    } else {
      // --- LOGIC FOR CREATIVE GENERATION ---
      
      // Inject all products
      productImageBase64s.forEach(base64 => {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64
          }
        });
      });

      parts.push({
        text: `${currentPrompt} ${varianceInstruction}`
      });
    }

    // Wrap the individual generation call with retry logic
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          imageSize: imageSize,
          aspectRatio: aspectRatio,
        }
      }
    }));

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated by Nano Banana Pro.");
  });

  try {
    // Use concurrency limit of 1 for remix generation to avoid overload
    return await runWithConcurrency(taskDefinitions, 1, onProgress);
  } catch (e: any) {
    console.error("Image generation failed:", e);
    if (e.message?.includes("403") || e.status === 403) {
        throw new Error("Permission denied (403). Please select a valid API key with access to Gemini 3 Pro Image.");
    }
    throw e;
  }
};

// Phase 2 Generation for Virtual Studio
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

  const taskDefinitions: (() => Promise<string>)[] = [];

  for (const concept of concepts) {
      for (let i = 0; i < countPerConcept; i++) {
          taskDefinitions.push(async () => {
              const varianceInstruction = countPerConcept > 1 
                ? `\n\n Variation ${i+1}: Ensure this shot is slightly different in angle or composition from other shots of the same style.` 
                : "";

              const parts = [
                {
                    inlineData: {
                    mimeType: "image/jpeg",
                    data: productBase64
                    }
                },
                {
                    text: `${concept.full_prompt_for_nano_banana} ${varianceInstruction} \n\n Lighting: ${concept.lighting_setup}. \n Negative Prompt: blurry, low quality, distorted, bad geometry, watermark, text.`
                }
              ];

              // Wrap generation with retry logic
              const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
                model: "gemini-3-pro-image-preview",
                contents: { parts: parts },
                config: {
                    imageConfig: {
                    imageSize: imageSize,
                    aspectRatio: aspectRatio,
                    }
                }
              }));

              for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
              }
              throw new Error("Failed to generate studio shot.");
          });
      }
  }

  try {
    // Use concurrency limit of 1 for studio generation
    return await runWithConcurrency(taskDefinitions, 1, onProgress);
  } catch (e: any) {
    console.error("Studio generation failed:", e);
     if (e.message?.includes("403") || e.status === 403) {
        throw new Error("Permission denied. Check API Key.");
    }
    throw e;
  }
};

// Phase 2 Generation for Custom Model
export const generateVirtualModel = async (
    dna: ModelIncubationAnalysis,
    refImageBase64: string,
    freedomLevel: number,
    imageSize: ImageSize,
    aspectRatio: AspectRatio,
    count: number,
    onProgress: (progress: number) => void
  ): Promise<string[]> => {
  await checkAndSelectApiKey();
  const ai = getAIClient();

  // 1. Construct Base Prompt from DNA
  const d = dna.demographics;
  const f = dna.visual_features;
  const v = dna.vibe_and_style;

  const basePrompt = `
    Subject DNA: ${d.race_ethnicity} ${d.gender}, ${d.age_vibe}.
    Facial Features: ${f.face_shape}, ${f.eye_characteristics}, ${f.skin_texture}.
    Hair: ${f.hair_style}, ${v.hair_vibe_keywords || ''}.
    Vibe & Expression: ${v.personality_tag}.
    
    **Uniform (Strict Requirement)**: Wearing a tight black sleeveless sports tank top and black fitted shorts. **Barefoot** (no shoes/socks).
    
    Background: Pure white studio background (#FFFFFF), clean isolated look.
    Lighting: Soft, even studio casting lighting.
    Quality: 8k, hyperrealistic, raw photography style, highly detailed.
  `;
  
  // 2. Helper to get fidelity instruction based on freedom
  const getFidelityInstruction = (level: number) => {
    // For Frontal View:
    if (level === 0) {
      // Strict Clone
      return "CRITICAL: STRICTLY preserve the exact identity, facial structure, and pixel details of the reference image. Do not change the person.";
    } else if (level === 5) { // Updated to Level 5 "Vibe/Cousin"
      // Stronger deviation than before
      return "Create a 'Vibe Twin' or 'Cousin'. The model must have the SAME demographic and general style (hair, age, skin tone) as the reference, but MUST have DISTINCTLY DIFFERENT facial features (eyes, nose, mouth). It should look like a different person who could be related. Do NOT just copy the face.";
    } else {
      // New Model
      return "Ignore the reference image person entirely. Create a new model based ONLY on the text DNA.";
    }
  };

  // 3. Define Views (Now handling count)
  const taskDefinitions = Array.from({ length: count }, (_, i) => async () => {
    const parts: any[] = [];
    
    if (freedomLevel <= 8) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: refImageBase64
        }
      });
    }

    const varianceInstruction = count > 1 
        ? `\n\n [Candidate ${i + 1}]: Create a distinct variation. Change the pose slightly, or the facial expression nuance, to provide variety for casting.`
        : "";

    const fullNegativePrompt = `shoes, socks, jewelry, earrings, necklace, accessories, heavy makeup, fancy dress, complex background, distorted face, low quality, bad anatomy, blur, merged bodies, missing limbs, side view, looking away, profile, asymmetric`;

    parts.push({ text: `
      **VIEW: FULL BODY FRONT** (0 degrees). The model is facing the camera directly. Symmetrical pose. Eyes looking at camera.
      ${getFidelityInstruction(freedomLevel)}
      
      ${basePrompt}
      ${varianceInstruction}
      
      Negative Prompt: ${fullNegativePrompt}
    `});

    // Wrap generation with retry logic
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: { parts: parts },
      config: {
        imageConfig: {
          imageSize: imageSize,
          aspectRatio: aspectRatio, 
        }
      }
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Generation failed");
  });

  try {
    // Use concurrency limit of 1 to be safe against overload
    return await runWithConcurrency(taskDefinitions, 1, onProgress);
  } catch (e: any) {
      console.error("Model generation failed:", e);
      if (e.message?.includes("403") || e.status === 403) {
          throw new Error("Permission denied. Check API Key.");
      }
      throw e;
  }
};
