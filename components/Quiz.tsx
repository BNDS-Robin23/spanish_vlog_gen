import React, { useState, useEffect, useMemo } from 'react';
import { VlogEntry, Vocabulary } from '../types';
import { AudioButton } from './AudioButton';
import { Shuffle, Check, X, ArrowRight } from 'lucide-react';

interface QuizProps {
  vlogs: VlogEntry[];
}

type Question = {
  word: Vocabulary;
  options: string[];
  correctIndex: number;
};

export const Quiz: React.FC<QuizProps> = ({ vlogs }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Flatten all vocabulary from all vlogs
  const allVocab = useMemo(() => {
    return vlogs.flatMap(v => v.vocabulary);
  }, [vlogs]);

  // Generate questions
  const questions = useMemo(() => {
    if (allVocab.length < 4) return [];
    
    const shuffled = [...allVocab].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, 10); // Max 10 questions

    return selectedWords.map(targetWord => {
      // Pick 3 distractors
      const distractors = allVocab
        .filter(w => w.word !== targetWord.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(w => w.meaning); // Use meanings as options
      
      const options = [...distractors, targetWord.meaning].sort(() => 0.5 - Math.random());
      const correctIndex = options.indexOf(targetWord.meaning);

      return {
        word: targetWord,
        options,
        correctIndex
      };
    });
  }, [allVocab]);

  if (allVocab.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="bg-orange-100 p-4 rounded-full mb-4">
           <Shuffle size={32} className="text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Not enough words yet</h2>
        <p className="text-stone-500">Create more vlogs to unlock the quiz mode! You need at least 4 distinct words.</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center mt-8">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">Quiz Completed!</h2>
        <div className="text-6xl font-black text-orange-600 mb-4">{score}/{questions.length}</div>
        <p className="text-stone-500 mb-8">Great job reviewing your vocabulary.</p>
        <button 
          onClick={() => window.location.reload()} // Simple reset via reload or could handle state reset
          className="w-full py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700"
        >
          Start New Session
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return; // Prevent multiple clicks
    setSelectedOption(index);
    const correct = index === currentQ.correctIndex;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setCompleted(true);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-semibold text-stone-400 uppercase tracking-wider">
          Question {currentQuestionIndex + 1} / {questions.length}
        </span>
        <span className="text-orange-600 font-bold">Score: {score}</span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-stone-100 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-stone-100 p-8 relative overflow-hidden">
        {/* Flashcard Look for Question */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-orange-50 rounded-full mb-4">
             <AudioButton text={currentQ.word.word} size="md" />
          </div>
          <h2 className="text-4xl font-bold text-stone-800 mb-2">{currentQ.word.word}</h2>
          <p className="text-stone-400 text-sm italic">"{currentQ.word.context}"</p>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            let btnClass = "w-full p-4 rounded-xl border-2 text-left transition-all font-medium ";
            
            if (selectedOption === null) {
               btnClass += "border-stone-100 hover:border-orange-300 hover:bg-orange-50 text-stone-600";
            } else {
               if (idx === currentQ.correctIndex) {
                 btnClass += "border-green-500 bg-green-50 text-green-700";
               } else if (idx === selectedOption) {
                 btnClass += "border-red-500 bg-red-50 text-red-700";
               } else {
                 btnClass += "border-stone-100 text-stone-300 opacity-50";
               }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selectedOption !== null}
                className={btnClass}
              >
                <div className="flex justify-between items-center">
                  <span>{option}</span>
                  {selectedOption !== null && idx === currentQ.correctIndex && <Check size={20} />}
                  {selectedOption !== null && idx === selectedOption && idx !== currentQ.correctIndex && <X size={20} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedOption !== null && (
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 bg-stone-800 text-white rounded-full hover:bg-stone-900 transition-transform active:scale-95"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next Question'} <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};