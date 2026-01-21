import React from 'react';
import { AppMode } from '../types';
import { Sparkles, ArrowRight, Wand2, Layers, Aperture } from 'lucide-react';

interface InspirationPanelProps {
  mode: AppMode;
  onUseSample: () => void;
}

const InspirationPanel: React.FC<InspirationPanelProps> = ({ mode, onUseSample }) => {
  
  const getContent = () => {
    switch(mode) {
      case 'studio':
        return {
          title: "虚拟棚拍灵感 (Virtual Studio)",
          subtitle: "无需搭建实景，AI 一键生成顶级商业摄影",
          beforeUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=300", // White BG ring
          afterUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=300", // Luxury Gold
          prompt: "放置在黑曜石纹理上，侧面打暖色聚光灯，营造神秘奢华感...",
          tag: "光影置景"
        };
      case 'tryon':
        return {
          title: "一键上身灵感 (Virtual Try-on)",
          subtitle: "无实物拍摄，AI 自动生成真人佩戴效果",
          beforeUrl: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&q=80&w=300", // Product
          afterUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300", // Model wearing
          prompt: "一位穿着黑色丝绒晚礼服的模特佩戴该项链，优雅，晚宴氛围...",
          tag: "人像合成"
        };
      case 'custom_model':
        return {
          title: "专属模特孵化 (Model DNA)",
          subtitle: "定制品牌专属面孔，告别肖像权纠纷",
          beforeUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300", // Ref face
          afterUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=300", // AI Model
          prompt: "基于参考图提取面部 DNA，生成一位 25 岁东亚女性，高冷气质...",
          tag: "数字分身"
        };
      case 'remix':
      default:
        return {
          title: "风格复刻灵感 (Style Remix)",
          subtitle: "上传参考图，完美复刻大牌视觉氛围",
          beforeUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=300", // Ref Vibe
          afterUrl: "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?auto=format&fit=crop&q=80&w=300", // Result
          prompt: "复刻左图的构图与光影，将主体替换为我的产品...",
          tag: "以图生图"
        };
    }
  };

  const content = getContent();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden rounded-2xl group">
      
      {/* Abstract Bg */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full text-center">
        
        <div className="mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-gray-300 mb-2">
                <Sparkles size={12} className="text-yellow-500" />
                {content.tag}
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">{content.title}</h2>
            <p className="text-gray-400 font-light tracking-wide">{content.subtitle}</p>
        </div>

        {/* Magazine Card */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm mb-8 hover:bg-white/10 transition-colors duration-500">
           
           {/* Before */}
           <div className="relative w-full md:w-1/2 aspect-[4/3] rounded-lg overflow-hidden border border-white/10 group/img">
              <img src={content.beforeUrl} alt="Before" className="w-full h-full object-cover opacity-80 group-hover/img:scale-105 transition-transform duration-700" />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold tracking-wider text-gray-300">
                INPUT
              </div>
           </div>

           <div className="flex flex-col items-center justify-center text-gray-500">
              <ArrowRight size={24} className="md:hidden rotate-90" />
              <ArrowRight size={24} className="hidden md:block" />
           </div>

           {/* After */}
           <div className="relative w-full md:w-1/2 aspect-[4/3] rounded-lg overflow-hidden border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] group/img">
              <img src={content.afterUrl} alt="After" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" />
              <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-[10px] font-bold tracking-wider">
                RESULT
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 opacity-0 group-hover/img:opacity-100 transition-opacity">
                <p className="text-xs text-white line-clamp-2 italic font-serif">"{content.prompt}"</p>
              </div>
           </div>
        </div>

        <button 
          onClick={onUseSample}
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden"
        >
          <Wand2 size={16} className="group-hover:rotate-12 transition-transform duration-300" />
          <span>试一试同款 (Try This)</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </button>

      </div>
    </div>
  );
};

export default InspirationPanel;