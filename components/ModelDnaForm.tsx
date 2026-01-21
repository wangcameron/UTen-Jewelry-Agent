
import React from 'react';
import { ModelIncubationAnalysis } from '../types';
import { User, Sparkles, Smile, Scissors, Palette } from 'lucide-react';

interface ModelDnaFormProps {
  dna: ModelIncubationAnalysis;
  onDnaChange: (newDna: ModelIncubationAnalysis) => void;
}

const ModelDnaForm: React.FC<ModelDnaFormProps> = ({ dna, onDnaChange }) => {
  
  const handleNestedChange = (
    section: keyof ModelIncubationAnalysis,
    field: string,
    value: string
  ) => {
    // @ts-ignore
    const updatedSection = { ...dna[section], [field]: value };
    onDnaChange({ ...dna, [section]: updatedSection });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 text-base font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
        <User size={18} className="text-red-600"/>
        <span>模特基因编辑 (Digital DNA)</span>
      </div>

      {/* Demographics */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-gray-500 flex items-center gap-1.5">基本信息</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1.5">种族/人种</label>
            <input 
              type="text" 
              value={dna.demographics.race_ethnicity}
              onChange={(e) => handleNestedChange('demographics', 'race_ethnicity', e.target.value)}
              className="w-full text-base font-medium border-b border-gray-200 focus:border-red-500 outline-none py-1.5 bg-transparent hover:bg-gray-50 transition-colors text-gray-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1.5">年龄感</label>
            <input 
              type="text" 
              value={dna.demographics.age_vibe}
              onChange={(e) => handleNestedChange('demographics', 'age_vibe', e.target.value)}
              className="w-full text-base font-medium border-b border-gray-200 focus:border-red-500 outline-none py-1.5 bg-transparent hover:bg-gray-50 transition-colors text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Visual Features */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-gray-500 flex items-center gap-1.5"><Palette size={14}/> 面部特征</h4>
        <div className="grid grid-cols-1 gap-4">
           <div>
            <label className="text-xs font-bold text-gray-400 block mb-1.5">脸型/骨相</label>
            <input 
              type="text" 
              value={dna.visual_features.face_shape}
              onChange={(e) => handleNestedChange('visual_features', 'face_shape', e.target.value)}
              className="w-full text-base font-medium border-b border-gray-200 focus:border-red-500 outline-none py-1.5 bg-transparent hover:bg-gray-50 transition-colors text-gray-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1.5">眼部特征</label>
            <input 
              type="text" 
              value={dna.visual_features.eye_characteristics}
              onChange={(e) => handleNestedChange('visual_features', 'eye_characteristics', e.target.value)}
              className="w-full text-base font-medium border-b border-gray-200 focus:border-red-500 outline-none py-1.5 bg-transparent hover:bg-gray-50 transition-colors text-gray-900"
            />
          </div>
           <div>
            <label className="text-xs font-bold text-gray-400 block mb-1.5">皮肤质感</label>
            <input 
              type="text" 
              value={dna.visual_features.skin_texture}
              onChange={(e) => handleNestedChange('visual_features', 'skin_texture', e.target.value)}
              className="w-full text-base font-medium border-b border-gray-200 focus:border-red-500 outline-none py-1.5 bg-transparent hover:bg-gray-50 transition-colors text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Hair & Style */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-gray-500 flex items-center gap-1.5"><Scissors size={14}/> 发型与风格</h4>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1.5">发型结构 (Cut & Style)</label>
            <input 
              type="text" 
              value={dna.visual_features.hair_style}
              onChange={(e) => handleNestedChange('visual_features', 'hair_style', e.target.value)}
              className="w-full text-base font-medium border-b border-gray-200 focus:border-red-500 outline-none py-1.5 bg-transparent hover:bg-gray-50 transition-colors text-gray-900"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="text-xs font-bold text-gray-400 block mb-1.5">气质标签</label>
            <input 
              type="text" 
              value={dna.vibe_and_style.personality_tag}
              onChange={(e) => handleNestedChange('vibe_and_style', 'personality_tag', e.target.value)}
              className="w-full text-base font-medium border-b border-gray-200 focus:border-red-500 outline-none py-1.5 bg-transparent hover:bg-gray-50 transition-colors text-gray-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1.5">发型质感 (Hair Vibe)</label>
            <input 
              type="text" 
              value={dna.vibe_and_style.hair_vibe_keywords || ''}
              onChange={(e) => handleNestedChange('vibe_and_style', 'hair_vibe_keywords', e.target.value)}
              className="w-full text-base font-medium border-b border-gray-200 focus:border-red-500 outline-none py-1.5 bg-transparent hover:bg-gray-50 transition-colors text-gray-900"
              placeholder="例如: 蓬松, 湿发"
            />
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-red-50 text-red-800 text-sm font-medium rounded-lg border border-red-100 flex items-center gap-2">
         <Smile size={16} />
         <span>提示：您可以直接修改上述文字来控制生成结果。</span>
      </div>

    </div>
  );
};

export default ModelDnaForm;
