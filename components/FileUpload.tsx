
import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, CheckCircle, Image as ImageIcon, Plus } from 'lucide-react';

interface FileUploadProps {
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  minimal?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  files, 
  onFilesChange, 
  multiple = false,
  accept = "image/*",
  maxFiles = 1,
  minimal = false
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
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-bold text-gray-900 tracking-wide">{label}</label>
        {files.length > 0 && (
          <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            <CheckCircle size={10}/> 已就绪
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
          rounded-xl 
          transition-all duration-300 ease-out
          min-h-[12rem] flex flex-col items-center justify-center
          overflow-hidden bg-gray-50
          ${isDragging ? 'border-2 border-black bg-gray-100' : 'border border-gray-200 hover:border-gray-400 hover:bg-white hover:shadow-sm'}
          ${files.length > 0 ? 'bg-white' : ''}
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
          <div className="w-full h-full p-3 grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95 duration-300">
             {previews.map((url, index) => (
                <div key={index} className={`relative rounded-lg overflow-hidden group/item shadow-sm border border-gray-100 ${files.length === 1 ? 'col-span-2 h-48' : 'h-32'}`}>
                  <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors" />
                  <button 
                    onClick={(e) => removeFile(e, index)}
                    className="absolute top-2 right-2 p-1.5 bg-white text-gray-900 rounded-full transition-all opacity-0 group-hover/item:opacity-100 shadow-sm hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
             ))}
             {multiple && (!maxFiles || files.length < maxFiles) && (
               <div className="h-32 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-400 transition-all">
                  <Plus size={24} />
               </div>
             )}
          </div>
        ) : (
          <div className="text-center p-6 flex flex-col items-center justify-center h-full w-full relative">
            
            <div className="w-12 h-12 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 group-hover:border-black group-hover:text-black transition-all">
                {multiple ? <ImageIcon size={20} /> : <Upload size={20} />}
            </div>
            
            {!minimal && (
              <>
                <p className="text-sm font-bold text-gray-900 mb-1">
                  {multiple ? "点击上传多张" : "点击上传图片"}
                </p>
                <p className="text-xs text-gray-400">支持 JPG, PNG (Max 10MB)</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
