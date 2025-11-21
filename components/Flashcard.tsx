import React from 'react';
import { Vocabulary, Grammar } from '../types';
import { AudioButton } from './AudioButton';
import { BookOpen, Lightbulb } from 'lucide-react';

interface FlashcardProps {
  type: 'vocab' | 'grammar';
  data: Vocabulary | Grammar;
}

export const Flashcard: React.FC<FlashcardProps> = ({ type, data }) => {
  if (type === 'vocab') {
    const item = data as Vocabulary;
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded">Vocab</span>
            <AudioButton text={item.word} size="sm" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-stone-800 mb-1">{item.word}</h3>
        <p className="text-stone-600 mb-3">{item.meaning}</p>
        <div className="text-sm text-stone-500 italic bg-stone-50 p-2 rounded">
          "{item.context}"
        </div>
      </div>
    );
  } else {
    const item = data as Grammar;
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
           <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
             <BookOpen size={12} /> Grammar
           </span>
        </div>
        <h3 className="text-lg font-bold text-stone-800 mb-2">{item.point}</h3>
        <p className="text-stone-700 text-sm mb-3">{item.explanation}</p>
        <div className="flex items-start gap-2 text-sm text-stone-600 bg-stone-50 p-2 rounded border-l-2 border-blue-200">
          <Lightbulb size={16} className="shrink-0 mt-0.5 text-yellow-500" />
          <span>{item.example}</span>
        </div>
        <div className="mt-2 flex justify-end">
           <AudioButton text={item.example} size="sm" />
        </div>
      </div>
    );
  }
};