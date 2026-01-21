
import React, { useState } from 'react';
import { GalleryItem, AppMode } from '../types';
import { Download, Grid, Trash2 } from 'lucide-react';

interface GalleryProps {
  items: GalleryItem[];
  onDelete: (id: string) => void;
  onZoom: (url: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ items, onDelete, onZoom }) => {
  const [filter, setFilter] = useState<'all' | AppMode>('all');

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.category === filter);

  // Sort by timestamp descending (newest first)
  const sortedItems = [...filteredItems].sort((a, b) => b.timestamp - a.timestamp);

  const getLabelColor = (cat: AppMode) => {
    switch (cat) {
      case 'remix': return 'bg-gray-100 text-gray-900 border border-gray-200';
      case 'tryon': return 'bg-gray-100 text-gray-900 border border-gray-200';
      case 'custom_model': return 'bg-black text-white border border-black';
      case 'studio': return 'bg-white text-black border border-black';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryName = (cat: AppMode) => {
    switch (cat) {
      case 'remix': return '风格同款';
      case 'tryon': return '虚拟佩戴';
      case 'custom_model': return '定制模特';
      case 'studio': return '虚拟棚拍';
      default: return cat;
    }
  };

  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Grid size={28} className="text-red-600" />
            素材库 (Asset Library)
          </h2>
          <p className="text-gray-500 text-base mt-1.5 font-medium">管理您生成的所有创意资产</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-1.5 bg-gray-100 p-1.5 rounded-xl">
          {['all', 'remix', 'tryon', 'custom_model', 'studio'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`
                px-6 py-2.5 rounded-lg text-base font-bold transition-all
                ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              {f === 'all' ? '全部' : getCategoryName(f as AppMode)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
        {sortedItems.map((item) => (
          <div key={item.id} className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            {/* Image */}
            <div 
              className="aspect-[3/4] bg-gray-50 cursor-zoom-in relative overflow-hidden"
              onClick={() => onZoom(item.url)}
            >
              <img 
                src={item.url} 
                alt={item.label} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                 <a 
                   href={item.url} 
                   download={`uten-${item.category}-${item.id}.png`}
                   className="p-3 bg-white/20 hover:bg-white text-white hover:text-gray-900 rounded-full backdrop-blur-md transition-all shadow-lg"
                   onClick={(e) => e.stopPropagation()}
                   title="下载"
                 >
                   <Download size={20} />
                 </a>
                 <button 
                   className="p-3 bg-white/20 hover:bg-white text-white hover:text-red-600 rounded-full backdrop-blur-md transition-all shadow-lg"
                   onClick={(e) => {
                     e.stopPropagation();
                     onDelete(item.id);
                   }}
                   title="删除"
                 >
                   <Trash2 size={20} />
                 </button>
              </div>
            </div>

            {/* Meta */}
            <div className="p-5 border-t border-gray-50">
              <div className="flex justify-between items-center mb-2.5">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getLabelColor(item.category)}`}>
                  {getCategoryName(item.category)}
                </span>
                <span className="text-xs text-gray-400 font-mono font-medium">
                  {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p className="text-base font-bold text-gray-800 truncate" title={item.label}>{item.label}</p>
            </div>
          </div>
        ))}

        {items.length === 0 && (
           <div className="col-span-full py-24 text-center">
             <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-6">
                <Grid className="text-gray-300" size={40} />
             </div>
             <h3 className="text-gray-900 font-bold text-xl mb-2">暂无素材</h3>
             <p className="text-gray-500 text-base">生成的图片将自动保存在这里</p>
           </div>
        )}

        {items.length > 0 && sortedItems.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 bg-gray-50 rounded-2xl border-dashed border-2 border-gray-200 text-lg font-medium">
            <p>该分类下暂无素材</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
