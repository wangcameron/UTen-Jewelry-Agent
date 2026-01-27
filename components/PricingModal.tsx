
import React, { useState } from 'react';
import { X, Check, Zap, Crown, Coins, Image, UserRound } from 'lucide-react';
import { SUBSCRIPTION_PLANS, ANNUAL_SUBSCRIPTION_PLANS, TOP_UP_PACKS, IMAGE_COSTS, INCUBATION_LIMITS } from '../constants';
import { PricingPlan } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecharge: (points: number) => void;
  onUpgrade: (plan: PricingPlan) => void;
  currentPoints: number;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onRecharge, onUpgrade, currentPoints }) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'annual' | 'topup'>('monthly');

  if (!isOpen) return null;

  const handlePlanPurchase = (plan: PricingPlan) => {
    // Simulate purchase delay
    setTimeout(() => {
        onUpgrade(plan);
        onClose();
    }, 500);
  };

  const handleTopUpPurchase = (points: number) => {
    setTimeout(() => {
        onRecharge(points);
        onClose();
    }, 500);
  }

  const currentPlans = activeTab === 'annual' ? ANNUAL_SUBSCRIPTION_PLANS : SUBSCRIPTION_PLANS;
  const costPer1K = IMAGE_COSTS['1K']; // 95

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-[1400px] overflow-hidden max-h-[95vh] flex flex-col relative border border-gray-200">
        
        {/* Header - Minimalist Black */}
        <div className="bg-black text-white px-12 py-8 flex justify-between items-center shrink-0 border-b border-gray-800">
          <div className="flex items-center gap-6">
             <div className="bg-white/10 p-3 rounded-2xl text-white backdrop-blur-sm">
               <Crown size={32} fill="currentColor" />
             </div>
             <div>
               <h2 className="text-3xl font-bold tracking-wide">UTen 会员中心</h2>
               <div className="flex items-center gap-3 text-base text-gray-400 mt-2 font-medium">
                 <Coins size={18} className="text-gray-400"/>
                 当前余额: <span className="text-white font-bold text-xl">{currentPoints.toLocaleString()} BP</span>
               </div>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/20 rounded-full transition-colors text-gray-400 hover:text-white">
            <X size={32} />
          </button>
        </div>

        {/* Tabs - Centered & Spacious */}
        <div className="flex justify-center gap-8 py-10 border-b border-gray-100 shrink-0 bg-white">
          <button 
            onClick={() => setActiveTab('monthly')}
            className={`px-10 py-4 rounded-full font-bold text-lg transition-all border-2 ${activeTab === 'monthly' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black'}`}
          >
            月度会员 (Monthly)
          </button>
          <button 
            onClick={() => setActiveTab('annual')}
            className={`px-10 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-3 border-2 ${activeTab === 'annual' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black'}`}
          >
            年度会员 (Annual) <span className="bg-red-600 text-white text-xs px-2.5 py-1 rounded font-bold tracking-wide uppercase">Save 17%</span>
          </button>
           <button 
            onClick={() => setActiveTab('topup')}
            className={`px-10 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-3 border-2 ${activeTab === 'topup' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black'}`}
          >
            加油包 (Top-up)
          </button>
        </div>

        {/* Content */}
        <div className="p-16 overflow-y-auto custom-scrollbar bg-[#FAFAFA] flex-1">
          
          {(activeTab === 'monthly' || activeTab === 'annual') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {currentPlans.map((plan) => {
                 const isAnnual = activeTab === 'annual';
                 const discountPercent = plan.originalPrice 
                    ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
                    : 0;
                 
                 // Dynamic Calculations
                 const imageCount1K = Math.floor(plan.points / costPer1K);
                 const avgCost = (plan.price / imageCount1K).toFixed(2);
                 const incubation = INCUBATION_LIMITS[plan.id] || { gen: 2, sign: 1 };

                 return (
                  <div key={plan.id} className={`relative bg-white rounded-[2rem] p-8 border-2 transition-all duration-300 flex flex-col hover:-translate-y-2 ${plan.recommended ? 'border-red-600 shadow-2xl z-10 scale-105' : 'border-gray-100 hover:border-gray-300 hover:shadow-xl'}`}>
                    {plan.recommended && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm font-black px-6 py-2 rounded-full shadow-lg tracking-widest uppercase">
                        Most Popular
                      </div>
                    )}
                    
                    <div className="mb-6 text-center">
                      <h3 className="font-black text-2xl text-black mb-2">{plan.name}</h3>
                      <p className="text-gray-400 text-sm font-medium">{plan.description}</p>
                    </div>
                    
                    <div className="mb-6 pb-6 border-b border-gray-100 text-center">
                        {/* 1. Original Price & Discount Tag */}
                        {plan.originalPrice && (
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <span className="text-base text-gray-400 line-through decoration-gray-400 font-medium">
                                    ¥{plan.originalPrice.toLocaleString()}
                                </span>
                                <div className="bg-red-50 px-3 py-1 rounded text-xs font-bold text-red-600 border border-red-100">
                                    {isAnnual ? '立省' : '限时'} {discountPercent}%
                                </div>
                            </div>
                        )}

                        {/* 2. Current Price */}
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-6xl font-black text-black tracking-tight">
                            ¥{plan.price.toLocaleString()}
                            </span>
                            <span className="text-gray-400 text-lg font-medium">
                            /{isAnnual ? '年' : '月'}
                            </span>
                        </div>
                        
                        {/* 3. Points Display - Minimal Gray */}
                        <div className="mt-6 flex items-center justify-center">
                            <div className="inline-flex items-center gap-2.5 bg-gray-50 text-gray-900 px-6 py-3 rounded-2xl text-lg font-bold border border-gray-200">
                                <Coins size={20} className="text-gray-400" />
                                <span>{plan.points.toLocaleString()} BP</span>
                            </div>
                        </div>

                         {/* 4. Usage Metrics - Clean Layout */}
                         <div className="mt-6 space-y-4">
                             <div className="flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
                                <Image size={16} className="text-gray-300"/>
                                <span>约 <span className="font-bold text-black">{imageCount1K.toLocaleString()}</span> 张 1K标清图</span>
                             </div>
                             
                             <div className="flex justify-center">
                               <p className="text-xs text-gray-400 font-medium text-center border border-dashed border-gray-200 bg-white px-4 py-2 rounded-lg">
                                 折合 ¥{avgCost} / 张
                               </p>
                             </div>
                         </div>
                    </div>

                    {/* NEW SECTION: Model Studio Privileges */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 relative overflow-hidden group/rights">
                        <div className="absolute top-0 right-0 bg-black text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg opacity-80">
                            需付 980BP/次 解锁
                        </div>
                        <div className="flex items-center gap-2 mb-3 text-black font-bold text-sm">
                            <UserRound size={16} />
                            <span>模特孵化特权</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">单次生成候选人</span>
                                <span className="font-bold text-black bg-white px-2 py-0.5 rounded border border-gray-200">{incubation.gen} 位</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">单次可签约人数</span>
                                <span className="font-bold text-red-600 bg-white px-2 py-0.5 rounded border border-red-100">{incubation.sign} 位</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-center scale-90 origin-bottom">
                            *孵化功能需额外消耗 980BP
                        </p>
                    </div>

                    <div className="flex-1"></div>

                    <button 
                      onClick={() => handlePlanPurchase(plan)}
                      className={`w-full py-5 rounded-2xl font-bold transition-all text-lg tracking-wide ${plan.recommended ? 'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-200/50' : 'bg-black hover:bg-gray-800 text-white'}`}
                    >
                      立即订阅
                    </button>
                  </div>
                 );
              })}
            </div>
          )}

          {activeTab === 'topup' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto pt-10">
               {TOP_UP_PACKS.map((pack) => (
                  <div key={pack.id} className="bg-white rounded-[2.5rem] p-12 border-2 border-gray-100 shadow-lg hover:border-black transition-all flex flex-col items-center text-center group cursor-pointer hover:-translate-y-2 hover:shadow-2xl">
                    <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-8 group-hover:bg-black transition-colors duration-500">
                      <Zap size={40} className="text-gray-900 group-hover:text-white" fill="currentColor"/>
                    </div>
                    <h3 className="font-black text-3xl text-black mb-2">{pack.name}</h3>
                    <div className="text-5xl font-black text-black mb-4">¥{pack.price}</div>
                    <div className="bg-gray-900 text-white px-6 py-2 rounded-full text-base font-bold mb-10 shadow-lg">
                      +{pack.points.toLocaleString()} BP
                    </div>
                    <p className="text-gray-400 text-base mb-12 font-medium">{pack.desc || '永久有效，不随月度清零'}</p>
                    <button 
                      onClick={() => handleTopUpPurchase(pack.points)}
                      className="w-full py-5 border-2 border-black rounded-2xl font-bold text-black text-xl hover:bg-black hover:text-white transition-all duration-300"
                    >
                      购买积分
                    </button>
                  </div>
               ))}
             </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-8 bg-white text-center text-sm text-gray-400 border-t border-gray-100 font-medium">
           如需企业对公转账或定制私有化部署方案，请联系 sales@uten.ai
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
