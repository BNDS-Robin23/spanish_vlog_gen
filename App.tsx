import React, { useState, useEffect } from 'react';
import { ViewState, VlogEntry } from './types';
import { getAllVlogs, deleteVlog } from './services/db';
import { CreateVlog } from './components/CreateVlog';
import { History } from './components/History';
import { Quiz } from './components/Quiz';
import { Flashcard } from './components/Flashcard';
import { AudioButton } from './components/AudioButton';
import { PlusCircle, Book, BrainCircuit, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.CREATE);
  const [vlogs, setVlogs] = useState<VlogEntry[]>([]);
  const [selectedVlog, setSelectedVlog] = useState<VlogEntry | null>(null);

  // Load vlogs on mount and when view changes to History/Dashboard
  useEffect(() => {
    loadVlogs();
  }, []);

  const loadVlogs = async () => {
    const data = await getAllVlogs();
    setVlogs(data);
  };

  const handleVlogSaved = async () => {
    await loadVlogs();
    setView(ViewState.HISTORY);
  };

  const handleVlogSelect = (vlog: VlogEntry) => {
    setSelectedVlog(vlog);
  };

  const handleDeleteVlog = async (id: string) => {
    await deleteVlog(id);
    if (selectedVlog && selectedVlog.id === id) {
      setSelectedVlog(null);
    }
    await loadVlogs();
  };

  // Navigation Item Component
  const NavItem = ({ v, icon: Icon, label }: { v: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        setSelectedVlog(null);
        setView(v);
      }}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
        view === v ? 'text-orange-600' : 'text-stone-400 hover:text-stone-600'
      }`}
    >
      <Icon size={24} strokeWidth={view === v ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Detailed View for a Single Vlog History Item */}
      {selectedVlog ? (
        <div className="max-w-4xl mx-auto p-4 animate-fade-in">
          <button 
            onClick={() => setSelectedVlog(null)}
            className="flex items-center gap-1 text-stone-500 hover:text-stone-800 mb-6"
          >
            <ArrowLeft size={20} /> Back to List
          </button>
          
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 mb-8">
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold text-stone-800">Entry Details</h1>
                <AudioButton text={selectedVlog.spanishText} />
            </div>
            <p className="text-lg text-stone-800 whitespace-pre-line leading-relaxed mb-4">
                {selectedVlog.spanishText}
            </p>
            <p className="text-stone-500 text-sm italic border-t pt-4">
                {selectedVlog.originalText}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
                <h3 className="font-bold text-stone-700 mb-4">Vocabulary</h3>
                <div className="space-y-4">
                    {selectedVlog.vocabulary.map((v, i) => <Flashcard key={i} type="vocab" data={v} />)}
                </div>
            </div>
            <div>
                <h3 className="font-bold text-stone-700 mb-4">Grammar</h3>
                <div className="space-y-4">
                    {selectedVlog.grammar.map((g, i) => <Flashcard key={i} type="grammar" data={g} />)}
                </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Views */
        <>
          {view === ViewState.CREATE && <CreateVlog onSaved={handleVlogSaved} />}
          {view === ViewState.HISTORY && (
            <History 
              vlogs={vlogs} 
              onSelect={handleVlogSelect} 
              onDelete={handleDeleteVlog} 
            />
          )}
          {view === ViewState.REVIEW && <Quiz vlogs={vlogs} />}
        </>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex justify-around items-center z-50 max-w-screen-xl mx-auto">
        <NavItem v={ViewState.CREATE} icon={PlusCircle} label="New Vlog" />
        <NavItem v={ViewState.HISTORY} icon={Book} label="History" />
        <NavItem v={ViewState.REVIEW} icon={BrainCircuit} label="Review" />
      </nav>
    </div>
  );
};

export default App;