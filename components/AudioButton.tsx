import React, { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { playSpanishAudio } from '../services/geminiService';

interface AudioButtonProps {
  text: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({ text, size = 'md', className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      await playSpanishAudio(text);
      // Since the AudioContext API doesn't give a simple "onend" for the fire-and-forget method used in the service,
      // we reset the state after a rough estimation or simply let the user click again. 
      // A robust implementation would manage the AudioContext state more closely.
      // For this UI feedback, we'll set a timeout based on text length roughly or just quick reset.
      setTimeout(() => setIsPlaying(false), 1000 + (text.length * 50)); 
    } catch (err) {
      console.error(err);
      setIsPlaying(false);
    }
  };

  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <button
      onClick={handlePlay}
      disabled={isPlaying}
      className={`inline-flex items-center justify-center rounded-full hover:bg-stone-200 text-orange-600 transition-colors ${size === 'sm' ? 'p-1' : 'p-2'} ${className}`}
      title="Listen"
    >
      {isPlaying ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : (
        <Volume2 size={iconSize} />
      )}
    </button>
  );
};