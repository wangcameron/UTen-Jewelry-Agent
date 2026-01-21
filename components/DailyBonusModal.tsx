import React from 'react';
import { CalendarCheck } from 'lucide-react';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DailyBonusModal: React.FC<DailyBonusModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-300 text-center border border-white/20">
        {/* Decorative Header */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-md mb-3 relative z-10 shadow-lg border border-white/30">
                <CalendarCheck size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white relative z-10 tracking-tight drop-shadow-sm">每日登录奖励</h2>
        </div>

        <div className="p-8 bg-white">
            <div className="flex items-center justify-center gap-2 text-5xl font-black text-gray-900 mb-2 tracking-tighter">
                <span className="text-yellow-500 text-4xl mt-2">+</span>
                <span>100</span>
                <span className="text-xl text-gray-400 font-bold self-end mb-2">BP</span>
            </div>
            
            <p className="text-gray-500 text-sm mb-6 leading-relaxed font-medium">
                欢迎回来！这是您的每日赠送积分。<br/>
                <span className="text-xs text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-full mt-3 inline-block border border-orange-100">
                   ⚡️ 当天有效 · 次日重置
                </span>
            </p>

            <button 
                onClick={onClose}
                className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-base hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center justify-center gap-2"
            >
                开心收下
            </button>
        </div>
      </div>
    </div>
  );
};

export default DailyBonusModal;