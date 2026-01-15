export type AppMode = 'remix' | 'tryon' | 'custom_model' | 'studio';

// --- Remix Types ---
export interface NanoBananaInstructions {
  visual_prompt: string;
  negative_prompt: string;
  structure_lock: number;
  creativity_level: number;
  lighting_guide: string;
}

export interface RemixBrainOutput {
  remix_rationale: string;
  nano_banana_instructions: NanoBananaInstructions;
}

// --- Try-On Types ---
export interface ModelDnaAnalysis {
  demographics: string;
  fashion_style: string;
  lighting_vibe: string;
}

export interface TryOnExecution {
  mode: string;
  visual_prompt: string;
  negative_prompt: string;
  masking_instructions: {
    areas_to_mask: string[];
    clean_up_existing: boolean;
  };
  parameters: {
    identity_strength: number;
    clothing_variation: number;
    background_variation: number;
  };
}

export interface TryOnBrainOutput {
  model_dna_analysis: ModelDnaAnalysis;
  nano_banana_execution: TryOnExecution;
}

// --- Custom Model Incubation Types ---
export interface ModelIncubationAnalysis {
  demographics: {
    race_ethnicity: string;
    gender: string;
    age_vibe: string;
  };
  visual_features: {
    face_shape: string;
    eye_characteristics: string;
    skin_texture: string;
    hair_style: string;
  };
  vibe_and_style: {
    personality_tag: string;
    // clothing_style removed
    hair_vibe_keywords: string; // Added to emphasize hair analysis as requested
  };
  user_editable_suggestions: string[];
}

// --- Virtual Studio Types ---
export interface StudioConcept {
  id: string; // Added for selection tracking
  style_name: string;
  design_rationale: string; 
  suggested_props: string[]; 
  lighting_setup: string;
  props_and_scene: string;
  camera_angle: string;
  full_prompt_for_nano_banana: string;
}

export interface StudioBrainOutput {
  product_material_analysis: string; 
  user_requirement_analysis: string; 
  concepts: StudioConcept[]; // Changed from fixed object to dynamic array
}

// Union type for the service return
export type BrainOutput = RemixBrainOutput | TryOnBrainOutput | ModelIncubationAnalysis | StudioBrainOutput;

export type ImageSize = '1K' | '2K' | '4K';

export type AspectRatio = '3:4' | '1:1' | '9:16';

export type AppStatus = 'idle' | 'analyzing' | 'reviewing_studio_plan' | 'generating' | 'success' | 'error';

export interface GeneratedImage {
  url: string;
  mimeType: string;
}

// --- Gallery Types ---
export interface GalleryItem {
  id: string;
  url: string;
  category: AppMode;
  label: string;
  timestamp: number;
}