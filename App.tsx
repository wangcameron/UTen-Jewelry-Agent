import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Loader2, AlertCircle, Download, Layout, Sliders, X, ZoomIn, Shirt, Boxes, UserRound, Grid, Palette, RotateCcw, Camera, Check, Tag, Square, CheckSquare, Layers } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ModelDnaForm from './components/ModelDnaForm';
import Gallery from './components/Gallery';
import { BrainOutput, ImageSize, AppStatus, AspectRatio, AppMode, TryOnBrainOutput, RemixBrainOutput, ModelIncubationAnalysis, GalleryItem, StudioBrainOutput } from './types';
import { analyzeImages, generateRemixImage, generateVirtualModel, generateStudioPhotos } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';

function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'gallery'>('studio');
  const [mode, setMode] = useState<AppMode>('remix'); // 'remix' | 'tryon' | 'custom_model' | 'studio'

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

  const [finalImage, setFinalImage] = useState<string | null>(null); // Kept for legacy single, but logic updated to use generatedImages array
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  // Gallery State
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomImageSrc, setZoomImageSrc] = useState<string | null>(null);

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

  // Reset state when mode changes
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
  };

  // Reset current session to start over (clears inputs but keeps settings)
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

  // --- Main Action Handlers ---

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

    // --- Studio Flow ---
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
                
                // Add to gallery logic with variant labels
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
             }
        }
        return;
    }

    // --- Custom Model Flow ---
    if (mode === 'custom_model' && modelDna) {
        setStatus('generating');
        setProgress(0);
        setErrorMsg(null);
        setGeneratedImages([]);
        try {
            const refB64 = await fileToBase64(refFiles[0]);
            const imgs = await generateVirtualModel(modelDna, refB64, freedomLevel, imageSize, aspectRatio, setProgress);
            setGeneratedImages(imgs);
            
            imgs.forEach((img, idx) => {
               const label = idx === 0 ? "正面 (Front)" : idx === 1 ? "左侧 (Left)" : "右侧 (Right)";
               addToGallery(img, 'custom_model', label);
            });
            
            setStatus('success');
        } catch(e: any) {
            console.error(e);
            setStatus('error');
            setErrorMsg(e.message);
        }
        return;
    }

    // --- Legacy Flow (Remix & TryOn) ---
    setStatus('analyzing'); 
    setProgress(0);
    setErrorMsg(null);
    setFinalImage(null);
    setGeneratedImages([]);

    try {
      const refB64 = await fileToBase64(refFiles[0]);
      const prodB64s = await Promise.all(prodFiles.map(file => fileToBase64(file)));
      const userInstr = instruction.trim() || (mode === 'tryon' ? "High fashion, elegant." : "保持专业感，并与参考图风格一致。");

      if (freedomLevel === 0) {
        setStatus('generating');
        let strictPrompt = "";
        if (mode === 'tryon') {
           strictPrompt = "Replace the jewelry on the person with the provided products. Keep the face, body, and clothing exactly the same. Do not change the background.";
        } else {
           strictPrompt = "Replace the main object in the first image with the product from the second image. Keep the background and lighting of the first image exactly the same.";
        }
        
        const imgs = await generateRemixImage(strictPrompt, prodB64s, imageSize, aspectRatio, imageCount, setProgress, refB64, true, mode);
        
        setFinalImage(imgs[0]); // Primary for display if needed
        setGeneratedImages(imgs);
        imgs.forEach((img, i) => addToGallery(img, mode, `Strict ${imageCount > 1 ? '#' + (i+1) : ''}`));
        
        setStatus('success');
        return;
      }

      // Creative Mode
      const analysis = await analyzeImages(refB64, prodB64s, userInstr, freedomLevel, mode);
      setBrainOutput(analysis);
      
      setStatus('generating');
      let fullPrompt = "";
      if (mode === 'tryon') {
        const tryOnData = analysis as TryOnBrainOutput;
        fullPrompt = `${tryOnData.nano_banana_execution.visual_prompt}. Negative prompt: ${tryOnData.nano_banana_execution.negative_prompt}`;
      } else {
        const remixData = analysis as RemixBrainOutput;
        fullPrompt = `${remixData.nano_banana_instructions.visual_prompt}. Lighting: ${remixData.nano_banana_instructions.lighting_guide}. Negative prompt: ${remixData.nano_banana_instructions.negative_prompt}`;
      }

      const imgs = await generateRemixImage(fullPrompt, prodB64s, imageSize, aspectRatio, imageCount, setProgress, undefined, false, mode);
      setFinalImage(imgs[0]);
      setGeneratedImages(imgs);
      imgs.forEach((img, i) => addToGallery(img, mode, `Creative Lv${freedomLevel} ${imageCount > 1 ? '#' + (i+1) : ''}`));
      
      setStatus('success');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setErrorMsg(e.message || "发生未知错误。");
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
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-300">
           <div className="flex items-center gap-2 text-sm font-bold text-emerald-900 border-b border-emerald-100 pb-2">
             <Sparkles size={16} className="text-emerald-500"/>
             <span>创意总监拍摄方案提案 (Director's Plan)</span>
           </div>

           <div className="bg-emerald-50/50 p-3 rounded-lg text-xs space-y-1">
             <div className="flex gap-2"><span className="font-bold text-emerald-700 shrink-0">材质识别:</span> <span className="text-gray-600">{studioData.product_material_analysis}</span></div>
             <div className="flex gap-2"><span className="font-bold text-emerald-700 shrink-0">需求解读:</span> <span className="text-gray-600">{studioData.user_requirement_analysis}</span></div>
           </div>

           <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {studioData.concepts.map((concept, idx) => {
                  const isSelected = selectedConceptIds.includes(concept.id);
                  return (
                    <div 
                      key={concept.id} 
                      onClick={() => toggleConceptSelection(concept.id)}
                      className={`
                        border rounded-lg p-3 transition-all cursor-pointer relative
                        ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 bg-white'}
                      `}
                    >
                      <div className="absolute top-3 right-3 text-emerald-600">
                          {isSelected ? <CheckSquare size={18} fill="currentColor" className="text-emerald-100" /> : <Square size={18} className="text-gray-300" />}
                      </div>

                      <div className="flex justify-between items-center mb-2 pr-8">
                          <h4 className={`font-bold text-sm ${isSelected ? 'text-emerald-900' : 'text-gray-800'}`}>{concept.style_name}</h4>
                          <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">Option {idx + 1}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 italic">"{concept.design_rationale}"</p>
                      <div className="flex flex-wrap gap-1">
                         {concept.suggested_props.map((prop, pIdx) => (
                             <span key={pIdx} className="inline-flex items-center gap-1 bg-white text-emerald-700 text-[10px] px-1.5 py-0.5 rounded border border-emerald-100">
                                <Tag size={8} /> {prop}
                             </span>
                         ))}
                      </div>
                    </div>
                  );
              })}
           </div>
           
           <div className="flex items-center gap-2 text-xs text-gray-400 justify-center pt-2">
             <Check size={12} />
             <span>请勾选您满意的方案，点击下方按钮执行</span>
           </div>
        </div>
     );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20 font-sans selection:bg-red-100 selection:text-red-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('studio')}>
              <div className="bg-red-600 p-1.5 rounded-lg text-white shadow-md shadow-red-200">
                <Sparkles size={18} fill="currentColor" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900">
                UTen<span className="text-red-600">幼狮</span>
              </h1>
            </div>
            
            {/* Main Navigation Tabs */}
            <div className="hidden md:flex bg-gray-100/80 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('studio')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'studio' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Palette size={14} /> 创作工坊
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'gallery' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Grid size={14} /> 素材库
                {galleryItems.length > 0 && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 rounded-full">{galleryItems.length}</span>}
              </button>
            </div>

          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span className="uppercase tracking-widest hidden sm:inline">Enterprise Edition</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- STUDIO VIEW --- */}
        {activeTab === 'studio' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Mode Switcher */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-xl flex gap-1 shadow-inner">
                <button
                  onClick={() => handleModeChange('remix')}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'remix' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Boxes size={18} />
                  <span className="hidden sm:inline">风格同款</span>
                </button>
                <button
                  onClick={() => handleModeChange('tryon')}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'tryon' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Shirt size={18} />
                  <span className="hidden sm:inline">虚拟佩戴</span>
                </button>
                <button
                  onClick={() => handleModeChange('custom_model')}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'custom_model' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <UserRound size={18} />
                  <span className="hidden sm:inline">定制模特</span>
                </button>
                 <button
                  onClick={() => handleModeChange('studio')}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'studio' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Camera size={18} />
                  <span className="hidden sm:inline">虚拟棚拍</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Left Column: Inputs */}
              <div className="lg:col-span-5 space-y-8">
                
                <section>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2 border-l-4 border-red-600 pl-3">
                    {mode === 'custom_model' ? '模特孵化' : mode === 'tryon' ? '模特与产品' : mode === 'studio' ? '产品拍摄' : '素材上传'}
                  </h2>
                  <div className="space-y-4">
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
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2 border-l-4 border-red-600 pl-3">
                    {mode === 'custom_model' ? '基因重组' : mode === 'studio' ? '摄影指导' : '智能控制'}
                  </h2>
                  
                  <div className="space-y-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    
                    {/* Phase 1 Button for Custom Model */}
                    {mode === 'custom_model' && !modelDna && (
                      <button
                        onClick={handleAnalysis}
                        disabled={status === 'analyzing' || refFiles.length === 0}
                        className={`
                          w-full py-3 rounded-xl font-bold text-white shadow-lg text-sm uppercase tracking-widest
                          flex items-center justify-center gap-2 transition-all
                          ${status === 'analyzing' ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black'}
                        `}
                      >
                        {status === 'analyzing' ? (
                          <><Loader2 className="animate-spin" size={18} /> 分析中...</>
                        ) : (
                          <><Sparkles className="fill-white" size={18} /> 提取模特 DNA</>
                        )}
                      </button>
                    )}

                    {/* Show DNA Form if Analyzed */}
                    {mode === 'custom_model' && modelDna && (
                      <ModelDnaForm dna={modelDna} onDnaChange={setModelDna} />
                    )}

                    {/* Studio Mode - Review Panel */}
                    {renderStudioReview()}

                    {/* Studio Mode Info Panel - Only show if NOT reviewing */}
                    {mode === 'studio' && status !== 'reviewing_studio_plan' && !brainOutput && (
                        <div className="text-xs text-gray-500 bg-white p-3 rounded-lg border border-gray-200">
                            <p className="mb-2 font-bold flex items-center gap-1"><Sparkles size={12} className="text-emerald-500"/> AI 摄影流程:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-1">
                                <li>识别产品材质 (金/银/宝石)</li>
                                <li>DoP 设计3种光影方案</li>
                                <li>用户确认方案</li>
                                <li>并发执行棚拍生成</li>
                            </ol>
                        </div>
                    )}

                    {/* Common Controls (visible for model mode ONLY after extraction) */}
                    { (mode !== 'custom_model' || modelDna) && (
                    <>
                      {/* Freedom Level Slider - Hidden for Studio Mode (It's auto-creative) */}
                      {mode !== 'studio' && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-sm font-semibold text-gray-700">
                            AI 自由度: {freedomLevel}
                          </label>
                          <span className={`text-xs font-bold px-2 py-1 rounded border ${freedomLevel === 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-200'}`}>
                            {mode === 'tryon' 
                              ? (freedomLevel === 0 ? "保留模特原貌" : "数字替身重绘")
                              : mode === 'custom_model'
                              ? (freedomLevel === 0 ? "复刻原型" : freedomLevel <= 3 ? "微调神态" : "全新面孔 (Text-Only)")
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
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600 hover:accent-red-700"
                        />
                        <div className="flex justify-between text-[10px] uppercase font-medium text-gray-400 mt-2 tracking-wide">
                          <span>{mode === 'custom_model' ? 'Clone (0)' : 'Strict (0)'}</span>
                          <span>{mode === 'custom_model' ? 'New (10)' : 'Creative (10)'}</span>
                        </div>
                      </div>
                      )}

                      {mode !== 'studio' && <div className="h-px bg-gray-200 w-full" />}
                      
                      {/* Image Count Selector - Hidden for Custom Model Mode */}
                      {mode !== 'custom_model' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex justify-between">
                            <span>生成数量 (每种方案)</span>
                            <span className="text-gray-400 font-normal text-xs">{mode === 'studio' ? '针对每个选中的方案生成' : '生成变体数量'}</span>
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((count) => (
                            <button
                              key={count}
                              onClick={() => setImageCount(count)}
                              className={`
                                flex-1 py-2 rounded-lg text-sm font-bold transition-all border
                                ${imageCount === count 
                                  ? 'bg-gray-900 text-white border-gray-900' 
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          图片比例
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['3:4', '1:1', '9:16'] as AspectRatio[]).map((ratio) => (
                            <button
                              key={ratio}
                              onClick={() => setAspectRatio(ratio)}
                              className={`
                                py-2 px-2 rounded-lg text-sm font-medium transition-all border
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
                      <div className="h-px bg-gray-200 w-full" />
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {mode === 'tryon' ? "模特特征/风格指令" : mode === 'studio' ? "拍摄需求 (品牌色/偏好)" : "场景提示词 / 修改指令"}
                          {freedomLevel > 5 && mode !== 'studio' && <span className="text-red-500 ml-1 text-xs">* 必填</span>}
                        </label>
                        <textarea
                          value={instruction}
                          onChange={(e) => setInstruction(e.target.value)}
                          placeholder={
                            mode === 'tryon' 
                            ? (freedomLevel > 5 ? "描述新模特特征：例如‘高冷亚洲超模，黑色丝绒晚礼服’..." : "可选：描述想要强调的氛围...")
                            : mode === 'studio'
                            ? "例如：品牌色是深紫色，希望营造神秘奢华的氛围，不要出现花朵。"
                            : (freedomLevel > 5 ? "详细描述您想要的画面风格、背景元素..." : "例如：把背景换成大理石材质...")
                          }
                          className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all resize-none h-24 text-sm bg-white
                            ${freedomLevel > 5 && instruction.trim().length === 0 && mode !== 'studio' ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-gray-100 focus:border-gray-400'}
                          `}
                        />
                      </div>
                      </>
                      )}
                      
                      {/* Resolution */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          分辨率
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                            <button
                              key={size}
                              onClick={() => setImageSize(size)}
                              className={`
                                py-1.5 px-4 rounded-lg text-xs font-bold transition-all
                                ${imageSize === size 
                                  ? 'bg-gray-900 text-white border border-gray-900' 
                                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}
                              `}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleGenerate}
                        disabled={status === 'analyzing' || status === 'generating' || refFiles.length === 0}
                        className={`
                          w-full py-4 rounded-xl font-bold text-white shadow-lg text-sm uppercase tracking-widest
                          flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]
                          ${status === 'analyzing' || status === 'generating' 
                            ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                            : 'bg-red-600 hover:bg-red-700 shadow-red-200'}
                        `}
                      >
                        {status === 'generating' ? (
                          <>
                            <Loader2 className="animate-spin" size={18} /> 
                            {mode === 'tryon' ? "正在虚拟佩戴..." 
                            : mode === 'custom_model' ? "正在生成定妆照..." 
                            : mode === 'studio' ? "正在执行棚拍..." 
                            : "正在生成同款..."}
                          </>
                        ) : status === 'reviewing_studio_plan' ? (
                          <>
                             <Camera className="fill-white" size={18} /> 
                             {selectedConceptIds.length > 0 ? `执行选中的方案` : "请选择方案"}
                          </>
                        ) : (
                          <>
                            <Sparkles className="fill-white" size={18} /> 
                            {mode === 'custom_model' ? "生成虚拟模特" 
                             : mode === 'studio' ? "咨询 DoP & 获取方案" 
                             : "开始生成"}
                          </>
                        )}
                      </button>
                    </>
                    )}

                    {errorMsg && (
                      <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg flex items-start gap-2 border border-red-100">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        {errorMsg}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column: Output */}
              <div className="lg:col-span-7 space-y-6">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2 border-l-4 border-gray-900 pl-3">
                    生成结果
                  </h2>

                {/* Final Image Container */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col relative group">
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    {status === 'success' && (finalImage || generatedImages.length > 0) && (
                      <>
                        <button
                          onClick={handleReset}
                          className="bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 p-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm font-medium px-4 shadow-sm"
                        >
                          <RotateCcw size={18}/> <span className="hidden sm:inline">开始新创作</span>
                        </button>
                        <a 
                          href={generatedImages[0] || finalImage} 
                          download={`uten-${mode}.png`}
                          className="bg-red-600 text-white hover:bg-red-700 p-2 rounded-lg shadow-md shadow-red-200 transition-colors flex items-center gap-2 text-sm font-medium px-4"
                        >
                          <Download size={18}/> {generatedImages.length > 0 ? "全部下载" : "下载"}
                        </a>
                      </>
                    )}
                  </div>
                  
                  <div className="flex-1 bg-gray-50 flex items-center justify-center p-8 relative">
                    {status === 'generating' && (
                      <div className="text-center space-y-6 w-full max-w-xs">
                        <div className="relative mx-auto w-24 h-24">
                           <svg className="w-full h-full" viewBox="0 0 100 100">
                              <circle
                                className="text-gray-200 stroke-current"
                                strokeWidth="8"
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                              ></circle>
                              <circle
                                className="text-red-600 progress-ring__circle stroke-current"
                                strokeWidth="8"
                                strokeLinecap="round"
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                strokeDasharray="251.2"
                                strokeDashoffset={251.2 - (251.2 * progress) / 100}
                                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                              ></circle>
                           </svg>
                           <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xl font-bold text-gray-800">{progress}%</span>
                           </div>
                        </div>
                        
                        <div>
                           <p className="text-gray-900 font-bold mb-1">
                             {mode === 'tryon' ? "正在虚拟佩戴..." 
                             : mode === 'custom_model' ? "正在试镜拍摄..." 
                             : mode === 'studio' ? "DoP 正在监制拍摄..."
                             : "正在执行生成指令..."}
                           </p>
                           <p className="text-gray-500 text-xs animate-pulse">
                              {progress < 30 ? "初始化生成环境..." : progress < 80 ? "正在渲染光影细节..." : "正在优化最终画质..."}
                           </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Reviewing Studio Plan State for Result Area - Maybe show a placeholder or "Awaiting Confirmation" */}
                    {status === 'reviewing_studio_plan' && (
                        <div className="text-center space-y-4 animate-pulse">
                            <Sparkles className="text-emerald-500 mx-auto" size={48} />
                            <p className="text-emerald-800 font-medium">方案已生成，请在左侧确认后执行拍摄</p>
                        </div>
                    )}

                    {status === 'analyzing' && (mode === 'custom_model' || mode === 'studio') && (
                      <div className="text-center space-y-4">
                        <Loader2 className="animate-spin text-gray-400 mx-auto" size={32} />
                        <p className="text-gray-400 font-medium text-sm">
                           {mode === 'studio' ? "Gemini 3 Pro 正在分析材质 & 设计光影..." : "正在提取模特 DNA..."}
                        </p>
                      </div>
                    )}

                    {status === 'success' && generatedImages.length > 0 && (
                      <div className={`grid gap-3 w-full ${generatedImages.length === 1 ? 'grid-cols-1' : generatedImages.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {generatedImages.map((img, idx) => (
                          <div key={idx} className="relative cursor-zoom-in group" onClick={() => handleZoom(img)}>
                            <img 
                              src={img} 
                              alt={`Result ${idx}`} 
                              className="w-full h-auto rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-100"
                            />
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                               {mode === 'studio' && brainOutput && 'concepts' in brainOutput
                                // @ts-ignore
                               ? (imageCount > 1 
                                   ? `${(brainOutput as StudioBrainOutput).concepts.filter(c => selectedConceptIds.includes(c.id))[Math.floor(idx/imageCount)]?.style_name} #${(idx%imageCount)+1}`
                                   : (brainOutput as StudioBrainOutput).concepts.filter(c => selectedConceptIds.includes(c.id))[idx]?.style_name)
                               : mode === 'custom_model' ? (idx === 0 ? "Front" : idx === 1 ? "Left" : "Right")
                               : `Variant #${idx+1}`
                              }
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 p-1 rounded-full text-white cursor-pointer hover:bg-black" onClick={(e) => {
                                    e.stopPropagation();
                                    const a = document.createElement('a');
                                    a.href = img;
                                    a.download = `uten-result-${idx}.png`;
                                    a.click();
                                }}>
                                    <Download size={14}/>
                                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {status !== 'generating' && status !== 'analyzing' && status !== 'reviewing_studio_plan' && !finalImage && generatedImages.length === 0 && (
                      <div className="text-center text-gray-300">
                        <div className="mb-4">
                          <Layout size={64} className="mx-auto opacity-20" />
                        </div>
                        <p className="font-light">准备就绪，等待指令</p>
                      </div>
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

      </main>

      {/* Image Modal / Lightbox */}
      {isZoomOpen && zoomImageSrc && (
        <div 
          className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          <button 
            className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
            onClick={() => setIsZoomOpen(false)}
          >
            <X size={24} />
          </button>
          
          <img 
            src={zoomImageSrc} 
            alt="Full size" 
            className="max-w-full max-h-screen object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}

export default App;