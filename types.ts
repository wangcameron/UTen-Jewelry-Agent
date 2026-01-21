
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

// --- Try-On Types (Updated for Nano Banana Core) ---
export interface BillingOption {
  tier: string;
  label: string;
  points: number;
  desc: string;
}

export interface TryOnBrainOutput {
  status: string;
  billing_options: {
    recommended_tier: string;
    options: BillingOption[];
  };
  creative_analysis: {
    product_material: string;
    lighting_strategy: string;
    anti_plagiarism_note: string;
  };
  imagen_instructions: {
    engine: string;
    prompts: Array<{
      id: string;
      ui_title: string;
      ui_description: string;
      master_prompt: string;
    }>;
  };
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

export interface SignedModel {
  id: string;
  name: string;
  coverImage: string;
  dnaDescription: string;
  createdAt: number;
  quality?: string; // New field to indicate 4K upgrade status
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

// --- Pricing Types ---
export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  points: number;
  maxConcurrency?: number;
  description?: string;
  features: string[];
  recommended?: boolean;
  monthlyIncubationQuota?: number; // Added: Monthly incubation quota limit
}

export interface TopUpPack {
  id: string;
  price: number;
  points: number;
  name: string;
  desc?: string;
}

// --- User Center Types ---
export interface UsageRecord {
  id: string;
  description: string;
  status: string;
  date: string;
  pointsChange: number;
}

export interface BillingRecord {
  id: string;
  date: string;
  category: string;
  amount: string;
  status: string;
}

// --- Auth Types ---
export interface User {
  phone: string;
  inviteCode: string;
  isLoggedIn: boolean;
}
