import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, CheckCircle, Image as ImageIcon, Plus } from 'lucide-react';

interface FileUploadProps {
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  files, 
  onFilesChange, 
  multiple = false,
  accept = "image/*",
  maxFiles = 1
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  // Generate previews when files change
  useEffect(() => {
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);

    // Cleanup URLs
    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    let updatedFiles: File[];
    
    if (multiple) {
      updatedFiles = [...files, ...newFiles];
      if (maxFiles && updatedFiles.length > maxFiles) {
        updatedFiles = updatedFiles.slice(0, maxFiles);
      }
    } else {
      updatedFiles = [newFiles[0]];
    }
    
    onFilesChange(updatedFiles);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
    // Reset value so same file can be selected again if needed
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-semibold text-gray-900">{label}</label>
        {files.length > 0 && (
          <span className="text-xs text-red-600 flex items-center gap-1 font-medium">
            <CheckCircle size={12}/> 已上传 {files.length} 张
          </span>
        )}
      </div>
      
      <div 
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group cursor-pointer 
          border-2 border-dashed rounded-xl 
          transition-all duration-200 ease-in-out
          min-h-[12rem] flex flex-col items-center justify-center
          overflow-hidden bg-white
          ${isDragging ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'}
          ${files.length > 0 ? 'border-solid border-red-100' : ''}
        `}
      >
        <input 
          type="file" 
          ref={inputRef}
          className="hidden" 
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
        />

        {files.length > 0 ? (
          <div className="w-full h-full p-2 grid grid-cols-2 gap-2">
             {previews.map((url, index) => (
                <div key={index} className={`relative rounded-lg overflow-hidden group/item shadow-sm border border-gray-100 ${files.length === 1 ? 'col-span-2 h-44' : 'h-32'}`}>
                  <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={(e) => removeFile(e, index)}
                    className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-red-500 hover:text-white text-gray-600 rounded-full transition-colors opacity-0 group-hover/item:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
             ))}
             {multiple && (!maxFiles || files.length < maxFiles) && (
               <div className="h-32 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                  <Plus size={24} />
               </div>
             )}
          </div>
        ) : (
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:text-red-600 group-hover:bg-red-50 transition-colors">
              {multiple ? <ImageIcon size={24} /> : <Upload size={24} />}
            </div>
            <p className="text-sm font-medium text-gray-900">
              {multiple ? "点击或拖拽上传多张图片" : "点击或拖拽上传图片"}
            </p>
            <p className="text-xs text-gray-500 mt-1">支持 JPG, PNG</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;