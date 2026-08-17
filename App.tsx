import React, { useState } from 'react';
import { Dropzone } from './components/Dropzone';
import { ResultPreview } from './components/ResultPreview';
import { processImages } from './utils/imageProcessor';
import { ProcessedSlice, ProcessingMode } from './types';
import { Scissors, Settings, Zap, Grid, Layers, Percent, Files } from 'lucide-react';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [slices, setSlices] = useState<ProcessedSlice[]>([]);
  
  // Settings
  const [targetHeight, setTargetHeight] = useState(10000);
  const [mode, setMode] = useState<ProcessingMode>('slice');
  const [quality, setQuality] = useState(90); // 1-100 range for UI

  const handleFilesSelect = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setIsProcessing(true);
    setProgress(0);
    setSlices([]);

    try {
      // Small delay to let UI render the loading state
      setTimeout(async () => {
        // Convert quality from 0-100 to 0.1-1.0
        const normalizedQuality = Math.max(0.1, Math.min(1.0, quality / 100));
        
        const result = await processImages(
          selectedFiles, 
          targetHeight, 
          mode, 
          normalizedQuality, 
          (p) => setProgress(p)
        );
        
        setSlices(result);
        setIsProcessing(false);
      }, 100);
    } catch (error) {
      console.error("Processing failed", error);
      alert("이미지 처리 중 오류가 발생했습니다.");
      setIsProcessing(false);
      setFiles([]);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setSlices([]);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Scissors size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">한이룸의 상세페이지 재단사</h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-slate-500">
             <span className="flex items-center gap-1">
                 <Zap size={14} className="text-yellow-500" fill="currentColor"/>
                 스마트 분석 엔진 탑재
             </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12">
        {files.length === 0 ? (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-extrabold text-slate-900">
                긴 상세페이지, 한 번에 자르세요
              </h2>
              <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
                이미지 내용을 스마트하게 분석하여 최적의 위치에서 자르거나,<br/>
                여러 장의 이미지를 가로로 이어붙여 재구성하세요.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-8">
               <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                   <div className="flex items-center gap-2 text-slate-700 font-medium">
                       <Settings size={18} />
                       <span>작업 설정</span>
                   </div>
               </div>
               
               {/* Mode Selection */}
               <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">작업 모드</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setMode('slice')}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        mode === 'slice' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 hover:border-indigo-200 text-slate-600'
                      }`}
                    >
                      <Layers className="mb-2" size={24} />
                      <span className="font-semibold">세로 분할 (기본)</span>
                      <span className="text-xs mt-1 opacity-75">긴 이미지를 여러 장으로 자르기</span>
                      {mode === 'slice' && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full" />}
                    </button>

                    <button
                      onClick={() => setMode('stitch')}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        mode === 'stitch' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 hover:border-indigo-200 text-slate-600'
                      }`}
                    >
                      <Grid className="mb-2" size={24} />
                      <span className="font-semibold">가로 이어붙이기</span>
                      <span className="text-xs mt-1 opacity-75">자른 후 가로로 합치기</span>
                      {mode === 'stitch' && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full" />}
                    </button>
                  </div>
               </div>

               {/* Target Height Slider */}
               <div className="space-y-3">
                   <label className="block text-sm font-medium text-slate-700 flex justify-between">
                       <span>자르는 기준 높이</span>
                       <span className="text-indigo-600 font-mono font-bold">{targetHeight.toLocaleString()}px</span>
                   </label>
                   <input 
                        type="range" 
                        min="1000" 
                        max="20000" 
                        step="1000"
                        value={targetHeight}
                        onChange={(e) => setTargetHeight(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                   />
                   <p className="text-xs text-slate-400">
                       * {mode === 'slice' ? '이 높이를 기준으로 여러 장으로 나뉩니다.' : '이미지를 이 높이로 자른 뒤 가로로 배치합니다.'} (스마트 여백 감지)
                   </p>
               </div>

               {/* Quality Slider */}
               <div className="space-y-3">
                   <label className="block text-sm font-medium text-slate-700 flex justify-between">
                       <span>이미지 품질 (용량 압축)</span>
                       <span className={`font-mono font-bold ${quality < 80 ? 'text-orange-500' : 'text-indigo-600'}`}>
                         {quality}%
                       </span>
                   </label>
                   <div className="flex items-center gap-4">
                     <Percent size={16} className="text-slate-400" />
                     <input 
                          type="range" 
                          min="10" 
                          max="100" 
                          step="5"
                          value={quality}
                          onChange={(e) => setQuality(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                     />
                   </div>
                   <p className="text-xs text-slate-400">
                       * 낮을수록 용량이 줄어들지만 화질이 저하될 수 있습니다. (추천: 80-90%)
                   </p>
               </div>
            </div>

            <Dropzone onFilesSelect={handleFilesSelect} />
            
          </div>
        ) : isProcessing ? (
          <div className="max-w-xl mx-auto text-center space-y-8 py-20 animate-pulse">
             <div className="relative w-24 h-24 mx-auto">
                 <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                 <div 
                    className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"
                 ></div>
             </div>
             <div className="space-y-2">
                 <h3 className="text-xl font-bold text-slate-900">
                    {mode === 'slice' ? '이미지를 분석하고 자르는 중...' : '이미지를 자르고 이어붙이는 중...'}
                 </h3>
                 <p className="text-slate-500">
                     {files.length}장의 이미지를 처리하고 있습니다.
                 </p>
             </div>
             <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
             </div>
             <p className="font-mono text-slate-400">{progress}% 완료</p>
          </div>
        ) : (
          <ResultPreview 
            slices={slices} 
            onReset={handleReset} 
            originalFileName={files[0]?.name || 'result.jpg'}
          />
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
          <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
              <p>&copy; {new Date().getFullYear()} 팀 한이룸. Local processing ensures privacy.</p>
              <div className="flex justify-center gap-4 mt-4 font-medium">
                  <a href="https://www.rebrandb.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">홈페이지</a>
                  <a href="https://www.youtube.com/@irum_hahn" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">유튜브</a>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default App;