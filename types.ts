export interface Vocabulary {
  word: string;
  meaning: string;
  context: string; // The sentence where it appeared or an example
}

export interface Grammar {
  point: string;
  explanation: string;
  example: string;
}

export interface VlogEntry {
  id: string;
  timestamp: number;
  originalText: string;
  spanishText: string;
  vocabulary: Vocabulary[];
  grammar: Grammar[];
}

export interface QuizQuestion {
  type: 'multiple-choice' | 'fill-blank';
  question: string;
  correctAnswer: string;
  options?: string[]; // For multiple choice
  explanation?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CREATE = 'CREATE',
  HISTORY = 'HISTORY',
  REVIEW = 'REVIEW'
}