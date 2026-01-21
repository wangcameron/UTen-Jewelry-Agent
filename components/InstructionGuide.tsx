
import React from 'react';
import { AppMode } from '../types';
import { Sparkles, Camera, Shirt, UserRound, Boxes } from 'lucide-react';

interface InstructionGuideProps {
  mode: AppMode;
}

const InstructionGuide: React.FC<InstructionGuideProps> = ({ mode }) => {
  
  const getContent = () => {
    switch(mode) {
      case 'studio':
        return {
          icon: <Camera size={32} className="text-purple-600" />,
          title: "虚拟棚拍 (Virtual Studio)",
          description: "无需搭建实景，AI 一键生成顶级商业摄影。我们将根据您的产品材质，智能匹配光影与置景方案。",
          steps: [
            { title: "上传产品", desc: "上传一张清晰的产品白底图或透底图" },
            { title: "描述需求", desc: "填写品牌色、想要营造的氛围或具体场景元素" },
            { title: "选择方案", desc: "AI 创意总监将提供 3 套拍摄方案，勾选后执行" }
          ],
          color: "bg-purple-50 text-purple-900 border-purple-100"
        };
      case 'tryon':
        return {
          icon: <Shirt size={32} className="text-blue-600" />,
          title: "虚拟佩戴 (Virtual Try-on)",
          description: "无实物拍摄，AI 自动生成真人佩戴效果。完美贴合颈部、手部或耳部线条。",
          steps: [
            { title: "上传模特", desc: "上传一张模特底图 (支持半身/全身/特写)" },
            { title: "上传产品", desc: "上传您的珠宝首饰产品图" },
            { title: "智能生成", desc: "选择【保持原貌】或【数字替身】模式并生成" }
          ],
          color: "bg-blue-50 text-blue-900 border-blue-100"
        };
      case 'custom_model':
        return {
          icon: <UserRound size={32} className="text-rose-600" />,
          title: "定制模特 (Model Incubation)",
          description: "定制品牌专属面孔，告别肖像权纠纷。提取参考图的面部 DNA，孵化您的御用 AI 模特。",
          steps: [
            { title: "提取 DNA", desc: "上传一张模特原型图，AI 分析面部特征" },
            { title: "调整基因", desc: "微调五官、肤质、发型等参数，设定自由度" },
            { title: "生成定妆", desc: "确认后生成专属模特的定妆照" }
          ],
          color: "bg-rose-50 text-rose-900 border-rose-100"
        };
      case 'remix':
      default:
        return {
          icon: <Boxes size={32} className="text-orange-600" />,
          title: "风格同款 (Style Remix)",
          description: "上传一张你喜欢的小红书/朋友圈美图，我们将把您的珠宝完美融合进这个场景中。",
          steps: [
            { title: "上传风格", desc: "上传参考风格图 (你想要模仿的氛围/构图)" },
            { title: "上传产品", desc: "上传您的产品图 (白底或透底效果最佳)" },
            { title: "一键融合", desc: "点击生成，AI 自动进行光影匹配与融合" }
          ],
          color: "bg-orange-50 text-orange-900 border-orange-100"
        };
    }
  };

  const content = getContent();

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`max-w-xl w-full rounded-3xl border p-10 shadow-md ${content.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-40 ')} bg-white`}>
        
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-4 rounded-2xl ${content.color} bg-white border shadow-sm`}>
            {content.icon}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{content.title}</h3>
        </div>

        <p className="text-gray-600 text-lg leading-relaxed mb-10 font-medium">
          {content.description}
        </p>

        <div className="space-y-8 relative">
          {/* Connecting Line */}
          <div className="absolute left-[18px] top-4 bottom-8 w-0.5 bg-gray-200 -z-10"></div>

          {content.steps.map((step, idx) => (
            <div key={idx} className="flex gap-5 items-start group">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-base font-bold border-2 transition-colors shadow-sm
                ${idx === 0 ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200 group-hover:border-gray-400 group-hover:text-gray-600'}
              `}>
                {idx + 1}
              </div>
              <div className="pt-1">
                <h4 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h4>
                <p className="text-base text-gray-500 leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between text-sm text-gray-400 font-medium">
           <div className="flex items-center gap-2">
             <Sparkles size={16} />
             <span>AI Powered</span>
           </div>
           <span>Ready to create</span>
        </div>

      </div>
    </div>
  );
};

export default InstructionGuide;
