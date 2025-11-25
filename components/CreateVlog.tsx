import React, { useState, useRef, useEffect } from 'react';
import { generateVlogContent, modifyVlogContent, analyzeSelection } from '../services/geminiService';
import { saveVlog } from '../services/db';
import { VlogEntry, Vocabulary, Grammar } from '../types';
import { Flashcard } from './Flashcard';
import { AudioButton } from './AudioButton';
import { Send, CheckCircle, RefreshCw, Wand2, BookOpen, ALargeSmall, Edit3 } from 'lucide-react';

interface CreateVlogProps {
  onSaved: () => void;
}

interface SelectionState {
  text: string;
  rect: DOMRect | null;
}

export const CreateVlog: React.FC<CreateVlogProps> = ({ onSaved }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VlogEntry | null>(null);
  
  // Modification State
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);

  // Selection State
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [analyzingSelection, setAnalyzingSelection] = useState<'vocab' | 'grammar' | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  // Handle Text Selection
  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !result) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const text = sel.toString().trim();
      
      // Ensure selection is inside our text container
      if (textContainerRef.current && textContainerRef.current.contains(range.commonAncestorContainer) && text.length > 0) {
        const rect = range.getBoundingClientRect();
        // Adjust for scroll if necessary
        setSelection({ text, rect });
      } else {
        setSelection(null);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [result]);


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
    } catch (error) {
      console.error("Failed to generate vlog:", error);
      alert("Could not generate content. Check console or API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleModify = async () => {
    // Use current text from DOM to ensure we capture unblurred edits
    const currentText = textContainerRef.current?.innerText || result?.spanishText;
    
    if (!result || !modifyPrompt.trim() || !currentText) return;
    
    setIsModifying(true);
    try {
      const modifiedData = await modifyVlogContent(currentText, modifyPrompt, result.originalText);
      setResult({
        ...modifiedData,
        timestamp: result.timestamp
      });
      setModifyPrompt('');
    } catch (error) {
      console.error("Failed to modify:", error);
      alert("Modification failed.");
    } finally {
      setIsModifying(false);
    }
  };

  const handleManualTextUpdate = (e: React.FocusEvent<HTMLDivElement>) => {
      if (!result) return;
      const newText = e.currentTarget.innerText;
      if (newText !== result.spanishText) {
          setResult({ ...result, spanishText: newText });
      }
  };

  const handleAddToCollection = async (type: 'vocab' | 'grammar') => {
    if (!selection || !result) return;
    
    setAnalyzingSelection(type);
    try {
      const analysis = await analyzeSelection(selection.text, result.spanishText, type);
      
      const updatedResult = { ...result };
      if (type === 'vocab') {
        updatedResult.vocabulary = [...updatedResult.vocabulary, analysis as Vocabulary];
      } else {
        updatedResult.grammar = [...updatedResult.grammar, analysis as Grammar];
      }
      setResult(updatedResult);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error("Failed to analyze selection:", error);
      alert("Could not analyze selection.");
    } finally {
      setAnalyzingSelection(null);
    }
  };

  const handleSave = async () => {
    if (result) {
      // Ensure we save the latest text
      const currentText = textContainerRef.current?.innerText || result.spanishText;
      const finalEntry = { ...result, spanishText: currentText };
      
      await saveVlog(finalEntry);
      onSaved();
    }
  };

  const handleReset = () => {
    setResult(null);
    setInput('');
    setModifyPrompt('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-32">
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
        <div className="space-y-8 animate-fade-in relative">
          
          {/* Result Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-stone-800">Your Spanish Script</h2>
              <div className="flex gap-2 items-center">
                 <span className="text-xs text-stone-400 flex items-center gap-1 bg-stone-100 px-2 py-1 rounded mr-2">
                    <Edit3 size={12} /> Editable
                 </span>
                 <AudioButton text={result.spanishText} className="bg-orange-100 text-orange-600" />
              </div>
            </div>
            
            {/* Interactive Text Area - ContentEditable */}
            <div 
              ref={textContainerRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleManualTextUpdate}
              className="prose prose-lg text-stone-700 leading-relaxed whitespace-pre-line mb-6 cursor-text selection:bg-orange-200 selection:text-orange-900 p-3 -ml-3 rounded-lg hover:bg-stone-50 border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            >
              {result.spanishText}
            </div>
            
            <div className="border-t pt-4">
                <p className="text-stone-400 text-sm">Original:</p>
                <p className="text-stone-500 italic">{result.originalText}</p>
            </div>

            {/* Modification Input */}
            <div className="mt-6 bg-stone-50 rounded-xl p-4 border border-stone-200">
               <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Wand2 size={14} /> Refine with AI Instruction
               </label>
               <div className="flex gap-2">
                 <input 
                    type="text" 
                    value={modifyPrompt}
                    onChange={(e) => setModifyPrompt(e.target.value)}
                    placeholder="E.g., Make it more casual, fix typos, or use future tense..."
                    className="flex-1 px-4 py-2 rounded-lg border border-stone-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleModify()}
                 />
                 <button 
                   onClick={handleModify}
                   disabled={isModifying || !modifyPrompt.trim()}
                   className="bg-stone-800 text-white px-4 py-2 rounded-lg hover:bg-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {isModifying ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                 </button>
               </div>
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
                   {result.vocabulary.length === 0 && <p className="text-stone-400 text-sm">Select text above to add words.</p>}
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
                   {result.grammar.length === 0 && <p className="text-stone-400 text-sm">Select text above to add grammar.</p>}
                </div>
             </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 pt-8">
             <button 
               onClick={handleSave} 
               className="flex items-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-full hover:bg-stone-900 transition-colors"
             >
               <CheckCircle size={20} /> Save & Finish
             </button>
             <button 
               onClick={handleReset}
               className="flex items-center gap-2 px-6 py-3 text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
             >
               Discard & New
             </button>
          </div>

          {/* Floating Selection Menu */}
          {selection && selection.rect && (
            <div 
              className="fixed bg-stone-800 text-white rounded-lg shadow-xl p-2 z-50 flex gap-1 animate-in fade-in zoom-in-95 duration-200"
              style={{ 
                top: `${selection.rect.top - 50}px`, 
                left: `${selection.rect.left + (selection.rect.width / 2) - 100}px` 
              }}
            >
              {analyzingSelection ? (
                 <div className="flex items-center gap-2 px-3 py-1 text-sm">
                   <RefreshCw size={14} className="animate-spin" /> Analyzing...
                 </div>
              ) : (
                <>
                  <button 
                    onClick={() => handleAddToCollection('vocab')}
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-stone-700 rounded transition-colors text-sm font-medium"
                  >
                    <ALargeSmall size={14} /> Add Word
                  </button>
                  <div className="w-[1px] bg-stone-600 my-1"></div>
                  <button 
                     onClick={() => handleAddToCollection('grammar')}
                     className="flex items-center gap-1 px-3 py-1.5 hover:bg-stone-700 rounded transition-colors text-sm font-medium"
                  >
                    <BookOpen size={14} /> Add Grammar
                  </button>
                </>
              )}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-stone-800"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
