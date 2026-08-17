import React from 'react';
import { ProcessedSlice } from '../types';
import { Download, Archive, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import JSZip from 'jszip';
import saveAs from 'file-saver';

interface ResultPreviewProps {
  slices: ProcessedSlice[];
  onReset: () => void;
  originalFileName: string;
}

export const ResultPreview: React.FC<ResultPreviewProps> = ({ slices, onReset, originalFileName }) => {
  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const baseName = originalFileName.replace(/\.[^/.]+$/, "");
    
    slices.forEach((slice) => {
      // zero pad the index for proper sorting: 01, 02, etc.
      const padIndex = String(slice.index).padStart(2, '0');
      zip.file(`${baseName}_${padIndex}.jpg`, slice.blob);
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${baseName}_slices.zip`);
  };

  const handleDownloadSingle = (slice: ProcessedSlice) => {
    const baseName = originalFileName.replace(/\.[^/.]+$/, "");
    const padIndex = String(slice.index).padStart(2, '0');
    saveAs(slice.blob, `${baseName}_${padIndex}.jpg`);
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-800">작업 완료!</h2>
          <p className="text-slate-500">총 {slices.length}개의 이미지로 분할되었습니다.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <Button variant="outline" onClick={onReset} className="flex-1 md:flex-none">
            <RefreshCw size={16} className="mr-2" />
            다시하기
          </Button>
          <Button onClick={handleDownloadAll} className="flex-1 md:flex-none">
            <Archive size={16} className="mr-2" />
            전체 다운로드 (ZIP)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slices.map((slice) => (
          <div key={slice.id} className="group relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {/* Image preview with object-contain to show full slice */}
              <img 
                src={slice.url} 
                alt={`Slice ${slice.index}`} 
                className="w-full h-full object-contain bg-slate-50"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button size="sm" variant="secondary" onClick={() => handleDownloadSingle(slice)}>
                      <Download size={16} className="mr-2" />
                      개별 다운로드
                  </Button>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                  #{String(slice.index).padStart(2, '0')}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {slice.width} x {slice.height}px
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};