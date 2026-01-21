
import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Sparkles, Loader2, AlertCircle, Download, Layout, Sliders, X, ZoomIn, Shirt, Boxes, UserRound, Grid, Palette, RotateCcw, Camera, Check, Tag, Square, CheckSquare, Layers, Coins, Plus, UserCheck, ScanFace, Bell, LogOut, ChevronDown, Crown, Lock, Calendar, RefreshCcw, PlusCircle, User as UserIcon, Home, Folder, Info, FileText, Shield } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ModelDnaForm from './components/ModelDnaForm';
import Gallery from './components/Gallery';
import PricingModal from './components/PricingModal';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import UserCenter from './components/UserCenter';
import DailyBonusModal from './components/DailyBonusModal';
import InstructionGuide from './components/InstructionGuide';
import { BrainOutput, ImageSize, AppStatus, AspectRatio, AppMode, TryOnBrainOutput, RemixBrainOutput, ModelIncubationAnalysis, GalleryItem, StudioBrainOutput, User, SignedModel, PricingPlan } from './types';
import { analyzeImages, generateRemixImage, generateVirtualModel, generateStudioPhotos } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { IMAGE_COSTS, MODEL_STUDIO_LICENSE_FEE, EXTRA_QUOTA_PRICE, STUDIO_LOCKED_FEATURES, SUBSCRIPTION_PLANS } from './constants';

const RESOLUTION_LABELS: Record<ImageSize, string> = {
  '1K': '1K 标清版',
  '2K': '2K 高清版',
  '4K': '4K 超清版'
};

function App() {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'support'>('login');

  // --- App State ---
  const [activeTab, setActiveTab] = useState<'studio' | 'gallery' | 'user_center'>('studio');
  const [mode, setMode] = useState<AppMode>('remix'); // 'remix' | 'tryon' | 'custom_model' | 'studio'
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const infoButtonRef = useRef<HTMLButtonElement>(null);

  // Close info menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoButtonRef.current && !infoButtonRef.current.contains(event.target as Node)) {
        setShowInfoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // User & Points & Membership
  const [userPoints, setUserPoints] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uten_user_points');
      return saved ? parseInt(saved, 10) : 200; // Default 200 for new users
    }
    return 200;
  });

  useEffect(() => {
    localStorage.setItem('uten_user_points', userPoints.toString());
  }, [userPoints]);

  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<PricingPlan>(SUBSCRIPTION_PLANS[0]); // Default to Starter

  // --- Model Studio Access & Quota State ---
  const monthlyQuota = currentPlan.monthlyIncubationQuota || 10;
  
  const [isModelStudioUnlocked, setIsModelStudioUnlocked] = useState(false);
  const [incubatedThisMonth, setIncubatedThisMonth] = useState(10); // Mock usage (full for testing)
  const [extraQuota, setExtraQuota] = useState(0); 
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Calculate remaining quota
  const remainingQuota = (monthlyQuota + extraQuota) - incubatedThisMonth;

  // File states
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [prodFiles, setProdFiles] = useState<File[]>([]);
  
  const [instruction, setInstruction] = useState<string>('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  const [freedomLevel, setFreedomLevel] = useState<number>(5);
  const [imageCount, setImageCount] = useState<number>(1); // Number of images to generate
  
  const [status, setStatus] = useState<AppStatus>('idle');
  const [progress, setProgress] = useState<number>(0); // 0-100
  
  // State for different output types
  const [brainOutput, setBrainOutput] = useState<BrainOutput | null>(null);
  // Specifically for editing model DNA
  const [modelDna, setModelDna] = useState<ModelIncubationAnalysis | null>(null);
  // Specifically for selecting studio concepts
  const [selectedConceptIds, setSelectedConceptIds] = useState<string[]>([]);

  const [finalImage, setFinalImage] = useState<string | null>(null); 
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  // Gallery State
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomImageSrc, setZoomImageSrc] = useState<string | null>(null);

  // --- Daily Login Bonus Logic ---
  useEffect(() => {
    if (user?.isLoggedIn) {
      const today = new Date().toDateString();
      const lastClaim = localStorage.getItem('uten_last_bonus_date');

      if (lastClaim !== today) {
        const timer = setTimeout(() => {
          setShowDailyBonus(true);
          setUserPoints(prev => prev + 100);
          localStorage.setItem('uten_last_bonus_date', today);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.isLoggedIn]);

  // --- Handlers ---

  const handleLogin = (phone: string, inviteCode: string) => {
    setUser({
      phone,
      inviteCode,
      isLoggedIn: true
    });
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    handleReset();
    setActiveTab('studio');
  };

  // Helper to add to gallery
  const addToGallery = (url: string, category: AppMode, label: string) => {
    const newItem: GalleryItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      url,
      category,
      label,
      timestamp: Date.now()
    };
    setGalleryItems(prev => [newItem, ...prev]);
  };

  // Cost Calculation
  const calculateTotalCost = () => {
    const baseCost = IMAGE_COSTS[imageSize];
    if (mode === 'studio') {
        return baseCost * imageCount * selectedConceptIds.length;
    } else if (mode === 'custom_model') {
        return baseCost;
    } else {
        return baseCost * imageCount;
    }
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setStatus('idle');
    setProgress(0);
    setFinalImage(null);
    setGeneratedImages([]);
    setErrorMsg(null);
    setBrainOutput(null);
    setModelDna(null);
    setSelectedConceptIds([]);
    setRefFiles([]);
    setProdFiles([]);
    setInstruction('');
    setAspectRatio('3:4');
    setImageCount(1);
    
    if (newMode === 'tryon') setFreedomLevel(0);
    else if (newMode === 'custom_model') setFreedomLevel(10);
    else setFreedomLevel(5);
  };

  const handleReset = () => {
    setStatus('idle');
    setProgress(0);
    setFinalImage(null);
    setGeneratedImages([]);
    setErrorMsg(null);
    setBrainOutput(null);
    setModelDna(null);
    setSelectedConceptIds([]);
    setRefFiles([]);
    setProdFiles([]);
    setInstruction('');
  };

  const handleUnlockStudio = () => {
    if (userPoints < MODEL_STUDIO_LICENSE_FEE) {
      alert("余额不足，请充值。");
      setShowPricingModal(true);
      return;
    }
    
    setUserPoints(prev => prev - MODEL_STUDIO_LICENSE_FEE);
    setIsModelStudioUnlocked(true);
    setIncubatedThisMonth(0); 
    
    alert(
      `🎉 解锁成功！(账号终身有效)\n\n` +
      `您当前的 [${currentPlan.name}] 包含每月 ${monthlyQuota} 个免费孵化名额。\n` +
      `💡 名额将在每月 1 日自动重置。\n` +
      `您本月剩余可用名额: ${monthlyQuota} 个`
    );
  };

  const handleBuyExtraQuota = () => {
    if (userPoints < EXTRA_QUOTA_PRICE) {
      alert("余额不足，请充值。");
      setShowPricingModal(true);
      return;
    }

    setUserPoints(prev => prev - EXTRA_QUOTA_PRICE);
    setExtraQuota(prev => prev + 1);
    setShowLimitModal(false);
    
    alert(`✅ 补充成功！\n本月额度 +1，您现在可以继续生成了。`);
  };

  const handleAnalysis = async () => {
     if (refFiles.length === 0) {
      setErrorMsg("请上传参考图片。");
      return;
    }
    
    setStatus('analyzing');
    setProgress(0);
    setErrorMsg(null);
    setBrainOutput(null);
    setModelDna(null);
    setSelectedConceptIds([]);

    try {
      const refB64 = await fileToBase64(refFiles[0]);
      const prodB64s = (mode !== 'custom_model' && mode !== 'studio') ? await Promise.all(prodFiles.map(file => fileToBase64(file))) : [];
      
      const analysis = await analyzeImages(refB64, prodB64s, instruction, freedomLevel, mode);
      
      setBrainOutput(analysis);
      
      if (mode === 'custom_model') {
        setModelDna(analysis as ModelIncubationAnalysis);
        setStatus('idle');
      } else if (mode === 'studio') {
        const studioOutput = analysis as StudioBrainOutput;
        setSelectedConceptIds(studioOutput.concepts.map(c => c.id));
        setStatus('reviewing_studio_plan');
      } else {
         setStatus('idle');
      }
      
    } catch (e: any) {
       console.error(e);
       setStatus('error');
       setErrorMsg(e.message);
    }
  };

  const toggleConceptSelection = (id: string) => {
    setSelectedConceptIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    const cost = calculateTotalCost();
    
    if (mode === 'custom_model') {
       if (!isModelStudioUnlocked) return;
       if (remainingQuota <= 0) {
         setShowLimitModal(true);
         return;
       }
    }

    if (userPoints < cost) {
       setShowPricingModal(true);
       return;
    }

    if (mode === 'studio') {
        if (refFiles.length === 0) {
            setErrorMsg("请上传产品白底图。");
            return;
        }
    } else if (mode !== 'custom_model' && (refFiles.length === 0 || prodFiles.length === 0)) {
       setErrorMsg("请上传所需图片。");
       return;
    }
    
    if (mode === 'custom_model' && !modelDna) {
       await handleAnalysis();
       return; 
    }

    setUserPoints(prev => prev - cost);

    if (mode === 'studio') {
        if (!brainOutput) {
            await handleAnalysis();
            return;
        }

        if (status === 'reviewing_studio_plan' && brainOutput) {
             if (selectedConceptIds.length === 0) {
                 setErrorMsg("请至少选择一个拍摄方案");
                 return;
             }

             setStatus('generating');
             setProgress(0);
             setGeneratedImages([]);
             setErrorMsg(null);

             try {
                const refB64 = await fileToBase64(refFiles[0]);
                const studioData = brainOutput as StudioBrainOutput;
                const conceptsToExecute = studioData.concepts.filter(c => selectedConceptIds.includes(c.id));
                
                const imgs = await generateStudioPhotos(conceptsToExecute, refB64, imageSize, aspectRatio, imageCount, setProgress);
                
                setGeneratedImages(imgs);
                
                let imgIdx = 0;
                conceptsToExecute.forEach(concept => {
                    for(let i=0; i<imageCount; i++) {
                         if(imgs[imgIdx]) {
                             const label = imageCount > 1 
                                ? `${concept.style_name} (Var ${i+1})`
                                : concept.style_name;
                             addToGallery(imgs[imgIdx], 'studio', label);
                             imgIdx++;
                         }
                    }
                });

                setStatus('success');
             } catch (e: any) {
                console.error(e);
                setStatus('error');
                setErrorMsg(e.message);
                setUserPoints(prev => prev + cost);
             }
        }
        return;
    }

    if (mode === 'custom_model' && modelDna) {
        setStatus('generating');
        setProgress(0);
        setErrorMsg(null);
        setGeneratedImages([]);
        try {
            const refB64 = await fileToBase64(refFiles[0]);
            const imgs = await generateVirtualModel(modelDna, refB64, freedomLevel, imageSize, aspectRatio, setProgress);
            setGeneratedImages(imgs);
            imgs.forEach((img) => {
               addToGallery(img, 'custom_model', "定妆照 (Master)");
            });
            setStatus('success');
            setIncubatedThisMonth(prev => prev + 1);
        } catch(e: any) {
            console.error(e);
            setStatus('error');
            setErrorMsg(e.message);
            setUserPoints(prev => prev + cost);
        }
        return;
    }

    setStatus('analyzing'); 
    setProgress(0);
    setErrorMsg(null);
    setFinalImage(null);
    setGeneratedImages([]);

    try {
      const refB64 = await fileToBase64(refFiles[0]);
      const prodB64s = await Promise.all(prodFiles.map(file => fileToBase64(file)));
      const userInstr = instruction.trim() || (mode === 'tryon' ? "High fashion, elegant." : "保持专业感，并与参考图风格一致。");

      if (freedomLevel === 0 && mode === 'remix') {
        setStatus('generating');
        const strictPrompt = "Replace the main object in the first image with the product from the second image. Keep the background and lighting of the first image exactly the same.";
        
        const imgs = await generateRemixImage(strictPrompt, prodB64s, imageSize, aspectRatio, imageCount, setProgress, refB64, true, mode);
        
        setFinalImage(imgs[0]); 
        setGeneratedImages(imgs);
        imgs.forEach((img, i) => addToGallery(img, mode, `Strict ${imageCount > 1 ? '#' + (i+1) : ''}`));
        
        setStatus('success');
        return;
      }

      const analysis = await analyzeImages(refB64, prodB64s, userInstr, freedomLevel, mode);
      setBrainOutput(analysis);
      
      setStatus('generating');
      let promptPayload: string | string[] = "";

      if (mode === 'tryon') {
        const tryOnData = analysis as TryOnBrainOutput;
        const availablePrompts = tryOnData.imagen_instructions.prompts;
        const promptsToUse = [];
        
        for (let i = 0; i < imageCount; i++) {
           const concept = availablePrompts[i % availablePrompts.length];
           const strictConstraint = freedomLevel === 0 
              ? " CRITICAL: You must strictly preserve the facial identity of the reference image. Do not generate a new face. Only change the outfit and pose as described. " 
              : "";
           const fullPrompt = `${concept.master_prompt} ${strictConstraint} \n\n Negative prompt: blurred, low quality, bad anatomy, missing limbs, distorted face, extra fingers, text, watermark.`;
           promptsToUse.push(fullPrompt);
        }
        promptPayload = promptsToUse;
      } else {
        const remixData = analysis as RemixBrainOutput;
        promptPayload = `${remixData.nano_banana_instructions.visual_prompt}. Lighting: ${remixData.nano_banana_instructions.lighting_guide}. Negative prompt: ${remixData.nano_banana_instructions.negative_prompt}`;
      }
      
      const isStrictTryOn = mode === 'tryon' && freedomLevel === 0;

      const imgs = await generateRemixImage(
          promptPayload, 
          prodB64s, 
          imageSize, 
          aspectRatio, 
          imageCount, 
          setProgress, 
          isStrictTryOn ? refB64 : undefined, 
          isStrictTryOn, 
          mode
      );

      setFinalImage(imgs[0]);
      setGeneratedImages(imgs);
      imgs.forEach((img, i) => addToGallery(img, mode, `Creative Lv${freedomLevel} ${imageCount > 1 ? '#' + (i+1) : ''}`));
      
      setStatus('success');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setErrorMsg(e.message || "发生未知错误。");
      setUserPoints(prev => prev + cost);
    }
  };

  const handleZoom = (src: string) => {
    setZoomImageSrc(src);
    setIsZoomOpen(true);
  };

  const handleDeleteGalleryItem = (id: string) => {
    setGalleryItems(prev => prev.filter(item => item.id !== id));
  };

  const renderStudioReview = () => {
     if (mode !== 'studio' || status !== 'reviewing_studio_plan' || !brainOutput) return null;
     const studioData = brainOutput as StudioBrainOutput;

     return (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-300">
           <div className="flex items-center gap-2 text-base font-bold text-black border-b border-gray-100 pb-3">
             <Sparkles size={20} className="text-black"/>
             <span>创意总监拍摄方案提案 (Director's Plan)</span>
           </div>

           <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-2">
             <div className="flex gap-2"><span className="font-bold text-gray-900 shrink-0">材质识别:</span> <span className="text-gray-600">{studioData.product_material_analysis}</span></div>
             <div className="flex gap-2"><span className="font-bold text-gray-900 shrink-0">需求解读:</span> <span className="text-gray-600">{studioData.user_requirement_analysis}</span></div>
           </div>

           <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {studioData.concepts.map((concept, idx) => {
                  const isSelected = selectedConceptIds.includes(concept.id);
                  return (
                    <div 
                      key={concept.id} 
                      onClick={() => toggleConceptSelection(concept.id)}
                      className={`
                        border rounded-xl p-4 transition-all cursor-pointer relative
                        ${isSelected ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-400 bg-white'}
                      `}
                    >
                      <div className="absolute top-4 right-4 text-black">
                          {isSelected ? <CheckSquare size={20} fill="currentColor" className="text-black" /> : <Square size={20} className="text-gray-300" />}
                      </div>

                      <div className="flex justify-between items-center mb-2 pr-8">
                          <h4 className={`font-bold text-base ${isSelected ? 'text-black' : 'text-gray-800'}`}>{concept.style_name}</h4>
                          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md">Option {idx + 1}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 italic">"{concept.design_rationale}"</p>
                      <div className="flex flex-wrap gap-2">
                         {concept.suggested_props.map((prop, pIdx) => (
                             <span key={pIdx} className="inline-flex items-center gap-1 bg-white text-black text-xs font-medium px-2 py-1 rounded border border-gray-200">
                                <Tag size={10} /> {prop}
                             </span>
                         ))}
                      </div>
                    </div>
                  );
              })}
           </div>
           
           <div className="flex items-center gap-2 text-sm text-gray-400 justify-center pt-2 font-medium">
             <Check size={14} />
             <span>请勾选您满意的方案，点击下方按钮执行</span>
           </div>
        </div>
     );
  };

  const Sidebar = () => (
    <div className="w-20 bg-white border-r border-gray-100 flex flex-col items-center py-8 h-screen fixed left-0 top-0 z-40 shadow-sm">
        <div className="mb-10">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg">
                <Sparkles size={20} fill="currentColor" />
            </div>
        </div>

        {/* Centered Navigation */}
        <div className="flex-1 flex flex-col items-center justify-center w-full gap-8">
            <nav className="flex flex-col gap-6 w-full px-2">
                <button
                    onClick={() => setActiveTab('studio')}
                    className={`group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 w-full ${activeTab === 'studio' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                    title="珠宝智能体"
                >
                    <Home size={24} strokeWidth={activeTab === 'studio' ? 2.5 : 2} />
                </button>
                
                <button
                    onClick={() => setActiveTab('gallery')}
                    className={`group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 w-full ${activeTab === 'gallery' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                    title="素材库"
                >
                    <Folder size={24} strokeWidth={activeTab === 'gallery' ? 2.5 : 2} />
                </button>

                <button
                    onClick={() => setActiveTab('user_center')}
                    className={`group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 w-full ${activeTab === 'user_center' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                    title="个人中心"
                >
                    <UserIcon size={24} strokeWidth={activeTab === 'user_center' ? 2.5 : 2} />
                </button>

                <div className="relative">
                  <button
                      ref={infoButtonRef}
                      onClick={() => setShowInfoMenu(!showInfoMenu)}
                      className={`group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 w-full ${showInfoMenu ? 'bg-gray-100 text-red-600' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                      title="信息"
                  >
                      <Info size={24} strokeWidth={2} />
                  </button>

                  {/* Info Menu Popover */}
                  {showInfoMenu && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 animate-in fade-in slide-in-from-left-2 duration-200 z-50">
                       <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-black transition-colors text-left text-sm font-bold">
                          <FileText size={18} /> 使用条款
                       </button>
                       <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-black transition-colors text-left text-sm font-bold">
                          <Shield size={18} /> 隐私政策
                       </button>
                       <div className="h-px bg-gray-100 my-2 mx-2" />
                       <div className="flex justify-around p-2">
                          <button className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-red-500 transition-colors" title="小红书">
                             <span className="font-black text-lg">小</span>
                          </button>
                          <button className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-black transition-colors" title="抖音">
                             {/* Music Note SVG for Douyin-like icon */}
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                               <path d="M9 18V5l12-2v13"></path>
                               <circle cx="6" cy="18" r="3"></circle>
                               <circle cx="18" cy="16" r="3"></circle>
                             </svg>
                          </button>
                          <button className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-green-600 transition-colors" title="微信">
                             {/* Chat Bubbles SVG for WeChat-like icon */}
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                               <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                             </svg>
                          </button>
                       </div>
                    </div>
                  )}
                </div>
            </nav>
        </div>

        <div className="mt-auto">
             <button onClick={() => setShowPricingModal(true)} className="p-3 rounded-full bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors" title="升级会员">
                 <Crown size={20} fill="currentColor" />
             </button>
        </div>
    </div>
  );

  // --- RENDER LOGIC ---

  if (!user?.isLoggedIn) {
    return (
      <>
        <LandingPage onStart={() => {
            setAuthView('login');
            setShowAuthModal(true);
        }} />
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          initialView={authView}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-red-100 selection:text-red-900 flex">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-20 p-8 pt-32 max-w-[1920px] mx-auto transition-all duration-500 relative">
        
        {/* Top Left Logo (Ref Request) */}
        <div className="absolute top-10 left-10 flex items-center gap-2 select-none">
            <div className="bg-black text-white p-2 rounded-lg">
                <Sparkles size={20} fill="currentColor" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-black">UTen<span className="text-red-600">幼狮</span></span>
        </div>

        {/* Top Right User Controls (Restored) */}
        <div className="absolute top-8 right-10 flex items-center gap-6 z-20">
             {/* Points Badge */}
             <div 
                onClick={() => setShowPricingModal(true)}
                className="cursor-pointer flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
             >
                <Crown size={16} className="text-yellow-400" fill="currentColor"/>
                <span className="hidden sm:inline">升级会员</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-1 font-mono">{userPoints.toLocaleString()} BP</span>
             </div>

             {/* User Dropdown */}
             <div className="flex items-center gap-3 pl-2 cursor-pointer group relative">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-400 overflow-hidden border-2 border-white shadow-md">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.phone}`} alt="User" />
                 </div>
                 <div className="hidden lg:block text-left">
                     <p className="text-sm font-bold text-gray-900">Designer</p>
                 </div>
                 <ChevronDown size={16} className="text-gray-400 group-hover:text-black transition-colors" />
                 
                 <div className="absolute top-full right-0 mt-4 w-48 bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2 p-1 z-50">
                    <button 
                      onClick={() => setActiveTab('user_center')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left rounded-lg"
                    >
                      <UserIcon size={16} /> 个人中心
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 text-left rounded-lg"
                    >
                      <LogOut size={16} /> 退出登录
                    </button>
                 </div>
             </div>
        </div>

        {/* Header Titles (Ref 4) with Top Spacing */}
        {activeTab === 'studio' && (
            <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-500">
                <h1 className="text-7xl font-black tracking-tight text-gray-900 mb-4">
                  UTen<span className="text-red-600">幼狮</span>珠宝智能体
                </h1>
                <p className="text-3xl text-gray-400 font-light tracking-widest uppercase">让你的品牌更有竞争力</p>
            </div>
        )}

        {/* Modals */}
        <DailyBonusModal isOpen={showDailyBonus} onClose={() => setShowDailyBonus(false)} />
        <PricingModal 
            isOpen={showPricingModal} 
            onClose={() => setShowPricingModal(false)}
            onRecharge={(amount) => setUserPoints(prev => prev + amount)}
            onUpgrade={(plan) => {
                setCurrentPlan(plan);
                setUserPoints(prev => prev + plan.points);
                alert(`🎉 升级成功！\n您已切换至 [${plan.name}]\n本月孵化名额已更新为: ${plan.monthlyIncubationQuota} 个`);
            }}
            currentPoints={userPoints}
        />
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          initialView={authView}
        />

        {/* --- STUDIO VIEW --- */}
        {activeTab === 'studio' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1700px] mx-auto">
            {/* Mode Switcher */}
            <div className="flex justify-center mb-16">
              <div className="bg-white p-1.5 rounded-2xl flex gap-1 shadow-sm border border-gray-100">
                <button
                  onClick={() => handleModeChange('remix')}
                  className={`flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold transition-all ${mode === 'remix' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  <Boxes size={22} />
                  <span className="hidden sm:inline">风格同款</span>
                </button>
                <button
                  onClick={() => handleModeChange('tryon')}
                  className={`flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold transition-all ${mode === 'tryon' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  <Shirt size={22} />
                  <span className="hidden sm:inline">虚拟佩戴</span>
                </button>
                <button
                  onClick={() => handleModeChange('custom_model')}
                  className={`flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold transition-all ${mode === 'custom_model' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  <UserRound size={22} />
                  <span className="hidden sm:inline">定制模特</span>
                </button>
                 <button
                  onClick={() => handleModeChange('studio')}
                  className={`flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold transition-all ${mode === 'studio' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  <Camera size={22} />
                  <span className="hidden sm:inline">虚拟棚拍</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
              
              {/* Left Column: Inputs */}
              <div className="lg:col-span-4 space-y-12 relative">
                {/* ... (Existing Left Column Code) ... */}
                {/* === Custom Model Mode Quota Block & Lock Overlay === */}
                {mode === 'custom_model' && (
                  <>
                     {/* Lock Overlay */}
                     {!isModelStudioUnlocked && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#FAFAFA]/90 backdrop-blur-md rounded-2xl">
                          <div className="bg-white border border-gray-200 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
                            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                              <Lock className="w-8 h-8 text-white" />
                            </div>
                            
                            <h2 className="text-2xl font-black text-black mb-3 tracking-tight">解锁定制模特工作室</h2>
                            <p className="text-gray-500 mb-8 text-base font-medium leading-relaxed">
                              一次性付费，永久拥有您的 AI 模特孵化团队
                            </p>

                            {/* Feature List */}
                            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left border border-gray-100">
                              <ul className="space-y-4">
                                {STUDIO_LOCKED_FEATURES.map((feature, i) => (
                                  <li key={i} className="flex items-start gap-3 text-base text-gray-700 font-medium">
                                    <span className="text-red-600 mt-1 font-bold text-lg">✦</span>
                                    <span>{feature}</span>
                                  </li>
                                ))}
                                <li className="flex items-start gap-3 text-base text-black font-bold">
                                  <span className="text-red-600 mt-1 text-lg">✦</span>
                                  <span>
                                    每月获赠 {monthlyQuota} 个免费孵化名额
                                  </span>
                                </li>
                              </ul>
                            </div>

                            <div className="space-y-4">
                              <div className="text-center">
                                <span className="text-gray-400 text-sm line-through mr-3 font-medium">原价 1990 BP</span>
                                <span className="text-4xl font-black text-black">{MODEL_STUDIO_LICENSE_FEE} BP</span>
                              </div>
                              
                              <button
                                onClick={handleUnlockStudio}
                                className="w-full py-4 bg-red-600 text-white font-bold text-lg rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                              >
                                立即解锁功能
                              </button>
                            </div>
                          </div>
                        </div>
                     )}
                  </>
                )}

                <section>
                  <h2 className="text-2xl font-black text-black mb-6 pl-1 flex items-center gap-2">
                    <span className="w-2 h-8 bg-red-600 rounded-full inline-block"></span>
                    {mode === 'custom_model' ? '模特孵化' : mode === 'tryon' ? '模特与产品' : mode === 'studio' ? '产品拍摄' : '素材上传'}
                  </h2>
                  <div className={`space-y-6 ${mode === 'custom_model' && !isModelStudioUnlocked ? 'opacity-20 pointer-events-none filter blur-sm' : ''}`}>
                    <FileUpload 
                      label={
                          mode === 'custom_model' ? "上传模特原型 (Prototype)" 
                        : mode === 'tryon' ? "模特参考图 (Model Ref)" 
                        : mode === 'studio' ? "产品白底图 (Product White BG)"
                        : "参考风格图 (Style Ref)"
                      }
                      files={refFiles} 
                      onFilesChange={setRefFiles}
                      multiple={false}
                      maxFiles={1}
                    />
                    
                    {/* Product Upload - Hidden for Custom Model Mode AND Studio Mode (since refFiles is product) */}
                    {mode !== 'custom_model' && mode !== 'studio' && (
                      <FileUpload 
                        label={mode === 'tryon' ? "您的珠宝产品 (Multiple Allowed)" : "您的产品图 (Product)"}
                        files={prodFiles} 
                        onFilesChange={setProdFiles}
                        multiple={true}
                        maxFiles={mode === 'tryon' ? 5 : 1}
                      />
                    )}
                  </div>
                </section>

                {/* Smart Control Section */}
                <section>
                  <h2 className="text-2xl font-black text-black mb-6 pl-1 flex items-center gap-2">
                    <span className="w-2 h-8 bg-red-600 rounded-full inline-block"></span>
                    {mode === 'custom_model' ? '基因重组' : mode === 'studio' ? '摄影指导' : '智能控制'}
                  </h2>
                  
                  <div className={`space-y-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-md ${mode === 'custom_model' && !isModelStudioUnlocked ? 'opacity-20 pointer-events-none filter blur-sm' : ''}`}>
                    
                    {/* Quota Bar for Custom Model */}
                    {mode === 'custom_model' && isModelStudioUnlocked && (
                       <div className="flex items-center justify-between bg-black p-4 rounded-xl border border-gray-800 shadow-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${remainingQuota > 0 ? 'bg-white/20 text-white' : 'bg-red-600/20 text-red-600'}`}>
                              <Calendar size={18} />
                            </div>
                            <div className="text-sm text-gray-300 font-medium">
                              本月孵化名额: 
                              <span className={`font-bold ml-2 text-base ${remainingQuota > 0 ? 'text-white' : 'text-red-500'}`}>
                                {incubatedThisMonth} / {monthlyQuota + extraQuota}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                            <RefreshCcw size={12} />
                            下月1日重置
                          </div>
                        </div>
                    )}

                    {/* Phase 1 Button for Custom Model */}
                    {mode === 'custom_model' && !modelDna && (
                      <button
                        onClick={handleAnalysis}
                        disabled={status === 'analyzing' || refFiles.length === 0}
                        className={`
                          w-full py-4 rounded-xl font-bold text-white shadow-lg text-base uppercase tracking-widest
                          flex items-center justify-center gap-3 transition-all
                          ${status === 'analyzing' ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}
                        `}
                      >
                        {status === 'analyzing' ? (
                          <><Loader2 className="animate-spin" size={20} /> 分析中...</>
                        ) : (
                          <><Sparkles className="fill-white" size={20} /> 提取模特 DNA</>
                        )}
                      </button>
                    )}

                    {/* Show DNA Form if Analyzed */}
                    {mode === 'custom_model' && modelDna && (
                      <ModelDnaForm dna={modelDna} onDnaChange={setModelDna} />
                    )}

                    {/* Studio Mode - Review Panel */}
                    {renderStudioReview()}

                    {/* Common Controls (visible for model mode ONLY after extraction) */}
                    { (mode !== 'custom_model' || modelDna) && (
                    <>
                      {/* Freedom Level Logic - Split for TryOn vs Others */}
                      {mode === 'tryon' ? (
                        <div>
                          <label className="block text-base font-bold text-gray-800 mb-4">
                            佩戴模式选择 (Mode Selection)
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => setFreedomLevel(0)}
                              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-full hover:border-gray-900 group shadow-sm ${freedomLevel === 0 ? 'bg-gray-900 text-white border-gray-900 ring-2 ring-gray-900 ring-offset-2' : 'bg-white border-gray-200 text-gray-700'}`}
                            >
                               <div className="flex items-center gap-2 mb-2">
                                  <UserCheck size={20} className={freedomLevel === 0 ? 'text-white' : 'text-gray-500'} />
                                  <span className="font-bold text-base">保持模特原貌</span>
                               </div>
                               <div className={`text-xs leading-relaxed font-medium ${freedomLevel === 0 ? 'text-gray-300' : 'text-gray-400'}`}>
                                  100% 严格复刻原图，仅更换产品。
                               </div>
                            </button>
                            
                            <button
                              onClick={() => setFreedomLevel(2)} // 2 maps to digital remix (>0)
                              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-full hover:border-gray-900 group shadow-sm ${freedomLevel > 0 ? 'bg-gray-900 text-white border-gray-900 ring-2 ring-gray-900 ring-offset-2' : 'bg-white border-gray-200 text-gray-700'}`}
                            >
                               <div className="flex items-center gap-2 mb-2">
                                  <ScanFace size={20} className={freedomLevel > 0 ? 'text-white' : 'text-gray-500'} />
                                  <span className="font-bold text-base">数字替身重绘</span>
                               </div>
                               <div className={`text-xs leading-relaxed font-medium ${freedomLevel > 0 ? 'text-gray-300' : 'text-gray-400'}`}>
                                  80% 神似 + 20% 变化。避免肖像权风险。
                               </div>
                            </button>
                          </div>
                        </div>
                      ) : mode !== 'studio' && (
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <label className="block text-base font-bold text-gray-800">
                              AI 自由度: {freedomLevel}
                            </label>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded border ${freedomLevel === 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-200'}`}>
                              {mode === 'custom_model'
                                ? (freedomLevel === 0 ? "复刻原型" : freedomLevel <= 3 ? "微调神态" : "全新面孔")
                                : (freedomLevel === 0 ? "100% 严格复刻" : "创意重组")
                              }
                            </span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            step="1"
                            value={freedomLevel}
                            onChange={(e) => setFreedomLevel(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black hover:accent-gray-800"
                          />
                          <div className="flex justify-between text-xs uppercase font-bold text-gray-400 mt-2 tracking-wide">
                            <span>{mode === 'custom_model' ? 'Clone (0)' : 'Strict (0)'}</span>
                            <span>{mode === 'custom_model' ? 'New (10)' : 'Creative (10)'}</span>
                          </div>
                        </div>
                      )}

                      {mode !== 'studio' && <div className="h-px bg-gray-100 w-full" />}
                      
                      {/* Image Count Selector - Hidden for Custom Model Mode */}
                      {mode !== 'custom_model' && (
                      <div>
                        <label className="block text-base font-bold text-gray-800 mb-3 flex justify-between">
                            <span>生成数量 (每种方案)</span>
                            <span className="text-gray-400 font-normal text-xs mt-1">{mode === 'studio' ? '针对每个选中的方案生成' : '生成变体数量'}</span>
                        </label>
                        <div className="flex gap-3">
                          {[1, 2, 3, 4, 5].map((count) => (
                            <button
                              key={count}
                              onClick={() => setImageCount(count)}
                              className={`
                                flex-1 py-3 rounded-xl text-base font-bold transition-all border
                                ${imageCount === count 
                                  ? 'bg-black text-white border-black shadow-md' 
                                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}
                              `}
                            >
                              {count}
                            </button>
                          ))}
                        </div>
                      </div>
                      )}

                      {/* Aspect Ratio */}
                      <div>
                        <label className="block text-base font-bold text-gray-800 mb-3">
                          图片比例
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {(['3:4', '1:1', '9:16'] as AspectRatio[]).map((ratio) => (
                            <button
                              key={ratio}
                              onClick={() => setAspectRatio(ratio)}
                              className={`
                                py-3 px-2 rounded-xl text-sm font-bold transition-all border
                                ${aspectRatio === ratio 
                                  ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-200' 
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white'}
                              `}
                            >
                              {ratio}
                            </button>
                          ))}
                        </div>
                      </div>

                      {mode !== 'custom_model' && (
                      <>
                      <div className="h-px bg-gray-100 w-full" />
                      <div>
                        <label className="block text-base font-bold text-gray-800 mb-3">
                          {mode === 'tryon' ? "模特特征/风格指令" : mode === 'studio' ? "拍摄需求 (品牌色/偏好)" : "场景提示词 / 修改指令"}
                          {freedomLevel > 5 && mode !== 'studio' && <span className="text-red-500 ml-1 text-sm">* 必填</span>}
                        </label>
                        <textarea
                          value={instruction}
                          onChange={(e) => setInstruction(e.target.value)}
                          placeholder={
                            mode === 'tryon' 
                            ? (freedomLevel > 0 ? "描述新模特特征：例如‘高冷亚洲超模，黑色丝绒晚礼服’..." : "可选：描述想要强调的氛围...")
                            : mode === 'studio'
                            ? "例如：品牌色是深紫色，希望营造神秘奢华的氛围，不要出现花朵。"
                            : (freedomLevel > 5 ? "详细描述您想要的画面风格、背景元素..." : "例如：把背景换成大理石材质...")
                          }
                          className={`w-full px-5 py-4 rounded-xl border focus:ring-2 outline-none transition-all resize-none h-28 text-base bg-gray-50 leading-relaxed
                            ${freedomLevel > 5 && instruction.trim().length === 0 && mode !== 'studio' ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-gray-100 focus:border-black'}
                          `}
                        />
                      </div>
                      </>
                      )}
                      
                      {/* Resolution */}
                      <div>
                        <label className="block text-base font-bold text-gray-800 mb-3">
                          分辨率
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                            <button
                              key={size}
                              onClick={() => setImageSize(size)}
                              className={`
                                py-3 px-2 rounded-xl text-xs font-bold transition-all truncate
                                ${imageSize === size 
                                  ? 'bg-black text-white border border-black shadow-md' 
                                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}
                              `}
                            >
                              {RESOLUTION_LABELS[size]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleGenerate}
                        disabled={status === 'analyzing' || status === 'generating' || refFiles.length === 0}
                        className={`
                          w-full py-5 rounded-xl font-bold text-white shadow-xl text-base uppercase tracking-widest
                          flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] relative overflow-hidden group border-2 border-transparent hover:border-transparent
                          ${status === 'analyzing' || status === 'generating' 
                            ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                            : 'bg-black hover:bg-gray-900 shadow-gray-200'}
                          ${mode === 'custom_model' && remainingQuota <= 0 && isModelStudioUnlocked ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : ''}
                        `}
                      >
                         {/* Dynamic Border Gradient Animation "AI Flow" */}
                         {status !== 'generating' && status !== 'analyzing' && (
                             <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500 via-purple-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-xy -z-10 blur-sm"></div>
                         )}
                         {/* Button Content Background to sit on top of gradient */}
                         <div className={`absolute inset-[2px] rounded-[10px] z-0 ${status === 'analyzing' || status === 'generating' ? 'bg-gray-400' : 'bg-black'} transition-colors`}></div>

                         <div className="relative z-10 flex items-center gap-2">
                            {status === 'generating' ? (
                              <>
                                <Loader2 className="animate-spin" size={20} /> 
                                {mode === 'tryon' ? "正在虚拟佩戴..." 
                                : mode === 'custom_model' ? "正在生成定妆照..." 
                                : mode === 'studio' ? "正在执行棚拍..." 
                                : "正在生成同款..."}
                              </>
                            ) : status === 'reviewing_studio_plan' ? (
                              <>
                                <Camera className="fill-white" size={20} /> 
                                {selectedConceptIds.length > 0 ? `执行选中的方案` : "请选择方案"}
                              </>
                            ) : (
                              <>
                                {mode === 'custom_model' && remainingQuota <= 0 && isModelStudioUnlocked ? (
                                  <span className="flex items-center justify-center gap-2">
                                    🚫 本月名额已耗尽
                                  </span>
                                ) : (
                                  <>
                                    <Sparkles className="fill-white" size={20} /> 
                                    {mode === 'custom_model' ? `开始孵化 (剩余 ${remainingQuota} 次)`
                                    : mode === 'studio' ? "咨询 DoP & 获取方案" 
                                    : "开始生成"}
                                  </>
                                )}
                              </>
                            )}
                         </div>

                         {/* Price Tag Badge - Visible except when processing */}
                         {status !== 'generating' && status !== 'analyzing' && (mode !== 'custom_model' || remainingQuota > 0) && (
                             <div className="absolute right-5 bg-white/20 text-white px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 font-bold z-10">
                                <Coins size={12} /> -{calculateTotalCost()} BP
                             </div>
                         )}
                      </button>
                      
                      {mode === 'custom_model' && isModelStudioUnlocked && (
                         <div className="text-center mt-3 text-sm text-gray-500 font-medium">
                           消耗 {calculateTotalCost()} BP / 次 · 仅生成需消耗名额
                         </div>
                      )}
                    </>
                    )}

                    {errorMsg && (
                      <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl flex items-start gap-2 border border-red-100">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        {errorMsg}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column: Output */}
              <div className="lg:col-span-8 space-y-6">
                <h2 className="text-2xl font-black text-black mb-6 pl-1 flex items-center gap-2">
                    <span className="w-2 h-8 bg-red-600 rounded-full inline-block"></span>
                    生成结果
                </h2>

                {/* Final Image Container */}
                <div className="bg-white rounded-[2.5rem] shadow-lg border border-gray-100 overflow-hidden min-h-[900px] flex flex-col relative group">
                  <div className="absolute top-8 right-8 z-10 flex gap-4">
                    {status === 'success' && (finalImage || generatedImages.length > 0) && (
                      <>
                        <button
                          onClick={handleReset}
                          className="bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 p-3 rounded-xl shadow-sm transition-colors flex items-center gap-2 text-sm font-bold px-6"
                        >
                          <RotateCcw size={18}/> <span className="hidden sm:inline">开始新创作</span>
                        </button>
                        <a 
                          href={generatedImages[0] || finalImage} 
                          download={`uten-${mode}.png`}
                          className="bg-black text-white hover:bg-gray-800 p-3 rounded-xl shadow-md transition-colors flex items-center gap-2 text-sm font-bold px-6"
                        >
                          <Download size={18}/> {generatedImages.length > 0 ? "全部下载" : "下载"}
                        </a>
                      </>
                    )}
                  </div>
                  
                  <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-12 relative">
                    {status === 'generating' && (
                      <div className="text-center space-y-8 w-full max-w-sm">
                        <div className="relative mx-auto w-32 h-32">
                           <svg className="w-full h-full" viewBox="0 0 100 100">
                              <circle
                                className="text-gray-200 stroke-current"
                                strokeWidth="6"
                                cx="50"
                                cy="50"
                                r="44"
                                fill="transparent"
                              ></circle>
                              <circle
                                className="text-black progress-ring__circle stroke-current"
                                strokeWidth="6"
                                strokeLinecap="round"
                                cx="50"
                                cy="50"
                                r="44"
                                fill="transparent"
                                strokeDasharray="276.46"
                                strokeDashoffset={276.46 - (276.46 * progress) / 100}
                                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                              ></circle>
                           </svg>
                           <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-3xl font-black text-gray-900">{progress}%</span>
                           </div>
                        </div>
                        
                        <div>
                           <p className="text-gray-900 font-bold mb-2 text-lg">
                             {mode === 'tryon' ? "正在虚拟佩戴..." 
                             : mode === 'custom_model' ? "正在试镜拍摄..." 
                             : mode === 'studio' ? "DoP 正在监制拍摄..."
                             : "正在执行生成指令..."}
                           </p>
                           <p className="text-gray-500 text-sm animate-pulse font-medium">
                              {progress < 30 ? "初始化生成环境..." : progress < 80 ? "正在渲染光影细节..." : "正在优化最终画质..."}
                           </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Reviewing Studio Plan State for Result Area - Maybe show a placeholder or "Awaiting Confirmation" */}
                    {status === 'reviewing_studio_plan' && (
                        <div className="text-center space-y-5 animate-pulse">
                            <Sparkles className="text-black mx-auto" size={56} />
                            <p className="text-gray-800 font-bold text-lg">方案已生成，请在左侧确认后执行拍摄</p>
                        </div>
                    )}

                    {status === 'analyzing' && (mode === 'custom_model' || mode === 'studio') && (
                      <div className="text-center space-y-6">
                        <Loader2 className="animate-spin text-gray-400 mx-auto" size={40} />
                        <p className="text-gray-500 font-medium text-base">
                           {mode === 'studio' ? "UTen Vision Pro 正在分析材质 & 设计光影..." : "正在提取模特 DNA..."}
                        </p>
                      </div>
                    )}

                    {status === 'success' && generatedImages.length > 0 && (
                      <div className={`grid gap-6 w-full ${generatedImages.length === 1 ? 'grid-cols-1' : generatedImages.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {generatedImages.map((img, idx) => (
                          <div key={idx} className="relative cursor-zoom-in group" onClick={() => handleZoom(img)}>
                            <img 
                              src={img} 
                              alt={`Result ${idx}`} 
                              className="w-full h-auto rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100"
                            />
                            <div className="absolute bottom-4 left-4 bg-black/70 text-white text-sm font-medium px-3 py-1.5 rounded-lg backdrop-blur-md">
                               {mode === 'studio' && brainOutput && 'concepts' in brainOutput
                                // @ts-ignore
                               ? (imageCount > 1 
                                   ? `${(brainOutput as StudioBrainOutput).concepts.filter(c => selectedConceptIds.includes(c.id))[Math.floor(idx/imageCount)]?.style_name} #${(idx%imageCount)+1}`
                                   : (brainOutput as StudioBrainOutput).concepts.filter(c => selectedConceptIds.includes(c.id))[idx]?.style_name)
                               : mode === 'custom_model' ? "定妆照 (Master)"
                               : `Variant #${idx+1}`
                              }
                            </div>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 p-2.5 rounded-full text-white cursor-pointer hover:bg-black transition-colors" onClick={(e) => {
                                    e.stopPropagation();
                                    const a = document.createElement('a');
                                    a.href = img;
                                    a.download = `uten-result-${idx}.png`;
                                    a.click();
                                }}>
                                    <Download size={18}/>
                                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {status !== 'generating' && status !== 'analyzing' && status !== 'reviewing_studio_plan' && !finalImage && generatedImages.length === 0 && (
                      <InstructionGuide mode={mode} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- LIBRARY VIEW --- */}
        {activeTab === 'gallery' && (
           <Gallery 
             items={galleryItems} 
             onDelete={handleDeleteGalleryItem}
             onZoom={handleZoom}
           />
        )}

        {/* --- USER CENTER VIEW --- */}
        {activeTab === 'user_center' && (
           <UserCenter 
             user={user}
             currentPlan={currentPlan}
             userPoints={userPoints}
             onLogout={handleLogout}
             onTopUp={() => setShowPricingModal(true)}
           />
        )}

      </main>

      {/* ... (Existing Modals) ... */}
      {isZoomOpen && zoomImageSrc && (
        <div 
          className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          <button 
            className="absolute top-8 right-8 p-3 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
            onClick={() => setIsZoomOpen(false)}
          >
            <X size={28} />
          </button>
          
          <img 
            src={zoomImageSrc} 
            alt="Full size" 
            className="max-w-full max-h-screen object-contain shadow-2xl rounded-xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* --- Quota Limit Modal --- */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1A1A1A] p-10 rounded-3xl max-w-lg w-full border border-red-900/50 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            
            <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📅</span>
            </div>

            <h3 className="text-3xl font-bold text-white mb-3">
              本月孵化名额已满
            </h3>
            
            <p className="text-gray-400 mb-8 text-base leading-relaxed">
              您的 [{currentPlan.name}] 本月赠送的 {monthlyQuota} 个名额已全部使用。<br/>
              <span className="text-[#FFD700]">下月 1 日</span> 将自动为您刷新额度。
            </p>
            
            <div className="space-y-4">
              {/* Option A: Buy Extra */}
              <button
                onClick={handleBuyExtraQuota}
                className="w-full flex items-center justify-between bg-gradient-to-r from-[#262626] to-[#333] border border-[#FFD700] p-5 rounded-2xl hover:scale-[1.02] transition-transform group"
              >
                <div className="text-left flex items-center gap-4">
                  <div className="bg-[#FFD700] text-black p-2.5 rounded-xl">
                    <PlusCircle size={24} />
                  </div>
                  <div>
                    <div className="text-[#FFD700] font-bold text-base">购买 1 个临时名额</div>
                    <div className="text-xs text-gray-400 group-hover:text-white mt-1">仅限本月使用 · 立即生效</div>
                  </div>
                </div>
                <div className="font-bold text-white text-xl">¥9.90</div>
              </button>

              {/* Option B: Upgrade */}
              <button
                onClick={() => { setShowLimitModal(false); setShowPricingModal(true); }}
                className="w-full flex items-center justify-between bg-[#111] border border-gray-700 hover:border-gray-500 p-5 rounded-2xl transition-all"
              >
                <div className="text-left flex items-center gap-4">
                  <div className="text-gray-500">
                    <Crown size={24} />
                  </div>
                  <div>
                    <div className="text-gray-300 font-bold text-base">升级会员等级</div>
                    <div className="text-xs text-gray-600 mt-1">每月额度提升至 30 个</div>
                  </div>
                </div>
                <div className="text-gray-500 text-sm font-medium">去升级 &gt;</div>
              </button>
            </div>

            <button
              onClick={() => setShowLimitModal(false)}
              className="mt-8 text-gray-600 text-sm hover:text-gray-400 font-medium"
            >
              我知道了，等下个月刷新
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
