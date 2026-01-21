
import React from 'react';
import { BrainOutput, RemixBrainOutput } from '../types';
import { Brain, Lightbulb, Lock, Palette, Zap } from 'lucide-react';

interface AnalysisCardProps {
  data: BrainOutput;
}

function isRemixOutput(data: BrainOutput): data is RemixBrainOutput {
  return (data as RemixBrainOutput).remix_rationale !== undefined && (data as RemixBrainOutput).nano_banana_instructions !== undefined;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ data }) => {
  if (!isRemixOutput(data)) {
    return null;
  }

  return (
    <div className="bg-slate-900 text-slate-200 rounded-xl overflow-hidden shadow-xl border border-slate-700">
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
        <Brain className="text-purple-300" size={20} />
        <h3 className="font-semibold text-white">UTen 创意总监分析报告</h3>
      </div>
      
      <div className="p-5 space-y-6">
        {/* Rationale */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 text-sm uppercase tracking-wider font-bold">
            <Lightbulb size={16} />
            <span>创意构思 (Creative Rationale)</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            {data.remix_rationale}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase mb-1">
              <Lock size={14} />
              <span>结构锁定 (Structure)</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{data.nano_banana_instructions.structure_lock}</span>
              <div className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${data.nano_banana_instructions.structure_lock * 100}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase mb-1">
              <Palette size={14} />
              <span>创意发散 (Creativity)</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{data.nano_banana_instructions.creativity_level}</span>
              <div className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500" 
                  style={{ width: `${data.nano_banana_instructions.creativity_level * 100}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visual Prompt Preview */}
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-pink-300 text-sm uppercase tracking-wider font-bold">
            <Zap size={16} />
            <span>生成指令 (Generated Prompt)</span>
          </div>
          <div className="max-h-32 overflow-y-auto custom-scrollbar text-xs font-mono text-slate-400 bg-black/30 p-3 rounded-lg border border-slate-700/50 whitespace-pre-wrap">
            {data.nano_banana_instructions.visual_prompt}
            <div className="mt-2 text-slate-500 border-t border-slate-700/50 pt-2">
              <span className="text-red-400">Negative:</span> {data.nano_banana_instructions.negative_prompt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisCard;
