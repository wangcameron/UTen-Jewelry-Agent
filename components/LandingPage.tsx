
import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-red-600 selection:text-white font-sans overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
             <div className="bg-black p-2 rounded-xl text-white shadow-lg shadow-gray-200 group-hover:scale-105 transition-transform">
                <Sparkles size={18} fill="currentColor" />
             </div>
             <span className="text-xl font-bold tracking-tight ml-1">UTen<span className="text-red-600">幼狮</span></span>
          </div>
          
          <button 
            onClick={onStart}
            className="bg-black text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-all hover:shadow-xl hover:-translate-y-0.5"
          >
            登录 / 注册
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-10 overflow-hidden">
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-red-50/60 blur-[120px] rounded-full mix-blend-multiply animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gray-50/50 blur-[100px] rounded-full mix-blend-multiply"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            
            {/* Main Title - Single Line */}
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-none select-none text-black animate-in fade-in zoom-in-95 duration-700 delay-100">
              UTEN 幼狮
            </h1>
            
            <h2 className="text-xl md:text-3xl font-light text-gray-400 tracking-[0.2em] mb-12 uppercase animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              Your Jewelry Design Agent
            </h2>
            
            <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg mb-16 font-normal leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              您的专属珠宝设计智能体。从<span className="text-black font-semibold">风格同款</span>、<span className="text-black font-semibold">虚拟佩戴</span>到<span className="text-black font-semibold">定制模特</span>、<span className="text-black font-semibold">商业棚拍</span>，
              <br className="hidden md:block"/>
              一站式 AI 智能解决方案，让您的品牌营销更简单。
            </p>

            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
              <button 
                onClick={onStart}
                className="group relative inline-flex items-center gap-3 px-12 py-5 bg-red-600 text-white rounded-full text-lg font-bold shadow-2xl shadow-red-200 hover:shadow-red-400 hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">立即开始设计</span>
                <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={20}/>
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
