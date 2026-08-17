import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Files } from 'lucide-react';

interface DropzoneProps {
  onFilesSelect: (files: File[]) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = (Array.from(e.dataTransfer.files) as File[]).filter(file => file.type.startsWith('image/'));
      if (files.length > 0) {
        onFilesSelect(files);
      }
    }
  }, [onFilesSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = (Array.from(e.target.files) as File[]).filter(file => file.type.startsWith('image/'));
      if (files.length > 0) {
        onFilesSelect(files);
      }
    }
  }, [onFilesSelect]);

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 ease-in-out text-center cursor-pointer group
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50/50' 
          : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input
        id="file-upload"
        type="file"
        className="hidden"
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleInputChange}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
          {isDragging ? <Files size={32} /> : <UploadCloud size={32} />}
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-700">
            이미지를 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-sm text-slate-500">
            JPG, PNG, WEBP (여러 장 선택 가능)
          </p>
        </div>
      </div>
    </div>
  );
};