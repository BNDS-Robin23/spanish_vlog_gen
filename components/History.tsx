import React from 'react';
import { VlogEntry } from '../types';
import { Calendar, ChevronRight } from 'lucide-react';
import { AudioButton } from './AudioButton';

interface HistoryProps {
  vlogs: VlogEntry[];
  onSelect: (vlog: VlogEntry) => void;
}

export const History: React.FC<HistoryProps> = ({ vlogs, onSelect }) => {
  if (vlogs.length === 0) {
    return (
      <div className="text-center p-12">
        <p className="text-stone-400 text-lg">No vlogs yet. Start your journey by creating one!</p>
      </div>
    );
  }

  // Reverse chronological
  const sorted = [...vlogs].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4 pb-20">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">Your Journal</h2>
      {sorted.map((vlog) => (
        <div 
          key={vlog.id}
          className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 hover:border-orange-300 transition-all cursor-pointer group"
          onClick={() => onSelect(vlog)}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center text-xs text-stone-400 font-medium uppercase tracking-wide">
              <Calendar size={14} className="mr-1" />
              {new Date(vlog.timestamp).toLocaleDateString()} • {new Date(vlog.timestamp).toLocaleTimeString()}
            </div>
            <AudioButton text={vlog.spanishText} size="sm" />
          </div>
          
          <p className="text-stone-800 font-medium line-clamp-2 mb-2 group-hover:text-orange-700 transition-colors">
            {vlog.spanishText}
          </p>
          <p className="text-stone-400 text-sm line-clamp-1">
            {vlog.originalText}
          </p>
          
          <div className="mt-4 flex items-center gap-4">
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-md">
                {vlog.vocabulary.length} Words
              </span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                {vlog.grammar.length} Grammar Points
              </span>
            </div>
            <div className="ml-auto text-stone-300 group-hover:text-orange-500 transition-colors">
                <ChevronRight size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};