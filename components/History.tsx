import React from 'react';
import { VlogEntry } from '../types';
import { Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { AudioButton } from './AudioButton';

interface HistoryProps {
  vlogs: VlogEntry[];
  onSelect: (vlog: VlogEntry) => void;
  onDelete: (id: string) => void;
}

export const History: React.FC<HistoryProps> = ({ vlogs, onSelect, onDelete }) => {
  if (vlogs.length === 0) {
    return (
      <div className="text-center p-12">
        <p className="text-stone-400 text-lg">No vlogs yet. Start your journey by creating one!</p>
      </div>
    );
  }

  // Reverse chronological
  const sorted = [...vlogs].sort((a, b) => b.timestamp - a.timestamp);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this vlog?")) {
      onDelete(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 pb-32">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">Your Vlog History</h2>
      {sorted.map((vlog) => (
        <div 
          key={vlog.id}
          onClick={() => onSelect(vlog)}
          className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 text-stone-400 text-sm">
              <Calendar size={14} />
              <span>{new Date(vlog.timestamp).toLocaleDateString()}</span>
              <span>•</span>
              <span>{new Date(vlog.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="flex items-center gap-2">
              <AudioButton text={vlog.spanishText} size="sm" />
              <button 
                onClick={(e) => handleDelete(e, vlog.id)}
                className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Delete Vlog"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          <p className="text-stone-800 font-medium line-clamp-2 mb-2 pr-8">
            {vlog.spanishText}
          </p>
          
          <div className="flex justify-between items-center text-xs text-stone-500">
             <span className="bg-stone-100 px-2 py-1 rounded">
                {vlog.vocabulary.length} words • {vlog.grammar.length} grammar points
             </span>
             <ChevronRight size={16} className="text-stone-300 group-hover:text-orange-500 transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
};
