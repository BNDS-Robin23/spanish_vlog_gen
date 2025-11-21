import React, { useState } from 'react';
import { generateVlogContent } from '../services/geminiService';
import { saveVlog } from '../services/db';
import { VlogEntry } from '../types';
import { Flashcard } from './Flashcard';
import { AudioButton } from './AudioButton';
import { Mic, Send, CheckCircle, RefreshCw } from 'lucide-react';

interface CreateVlogProps {
  onSaved: () => void;
}

export const CreateVlog: React.FC<CreateVlogProps> = ({ onSaved }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VlogEntry | null>(null);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const entryData = await generateVlogContent(input);
      const fullEntry: VlogEntry = {
        ...entryData,
        timestamp: Date.now(),
      };
      setResult(fullEntry);
      await saveVlog(fullEntry);
    } catch (error) {
      console.error("Failed to generate vlog:", error);
      alert("Could not generate content. Check console or API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Create New Vlog</h1>
        <p className="text-stone-500">Describe your day in Chinese, get it in Spanish.</p>
      </header>

      {!result ? (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">What happened today?</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-40 p-4 rounded-xl border border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none resize-none transition-all text-lg"
            placeholder="今天我去公园散步，天气很好..."
          />
          <div className="mt-4 flex justify-end items-center gap-4">
            <span className="text-xs text-stone-400">Powered by Gemini 2.5 Flash</span>
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all ${
                loading || !input.trim() ? 'bg-stone-300 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 shadow-lg hover:shadow-orange-200'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} /> Generating...
                </>
              ) : (
                <>
                  <Send size={20} /> Translate & Generate
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          
          {/* Result Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-stone-800">Your Spanish Script</h2>
              <div className="flex gap-2">
                 <AudioButton text={result.spanishText} className="bg-orange-100 text-orange-600" />
              </div>
            </div>
            <div className="prose prose-lg text-stone-700 leading-relaxed whitespace-pre-line mb-6">
              {result.spanishText}
            </div>
            <div className="border-t pt-4">
                <p className="text-stone-400 text-sm">Original:</p>
                <p className="text-stone-500 italic">{result.originalText}</p>
            </div>
          </div>

          {/* Extracted Cards */}
          <div className="grid md:grid-cols-2 gap-6">
             <div>
                <h3 className="text-lg font-semibold text-stone-700 mb-4 flex items-center gap-2">
                   Vocabulary
                </h3>
                <div className="space-y-4">
                   {result.vocabulary.map((v, i) => (
                      <Flashcard key={i} type="vocab" data={v} />
                   ))}
                </div>
             </div>
             <div>
                <h3 className="text-lg font-semibold text-stone-700 mb-4 flex items-center gap-2">
                   Grammar Points
                </h3>
                <div className="space-y-4">
                   {result.grammar.map((g, i) => (
                      <Flashcard key={i} type="grammar" data={g} />
                   ))}
                </div>
             </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 pt-8 pb-20">
             <button 
               onClick={onSaved} 
               className="flex items-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-full hover:bg-stone-900 transition-colors"
             >
               <CheckCircle size={20} /> Save & Finish
             </button>
             <button 
               onClick={handleReset}
               className="flex items-center gap-2 px-6 py-3 text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
             >
               Create Another
             </button>
          </div>

        </div>
      )}
    </div>
  );
};