import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VlogEntry, Vocabulary, Grammar } from "../types";
import { v4 as uuidv4 } from 'uuid';

const getAIClient = () => {
  // Safely check for env vars avoiding ReferenceError for 'process' in browser
  // Netlify/Vite uses import.meta.env.VITE_API_KEY.
  // We check typeof process to avoid crashing if process is undefined (browser).
  const apiKey = import.meta.env.VITE_API_KEY || (typeof process !== 'undefined' ? process.env.API_KEY : undefined);
  
  if (!apiKey) {
    console.error("API Key is missing. Make sure VITE_API_KEY is set in Netlify or .env");
    throw new Error("API_KEY is missing");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Text Generation ---

export const generateVlogContent = async (chineseText: string): Promise<Omit<VlogEntry, 'timestamp'>> => {
  const ai = getAIClient();

  const prompt = `
    You are a professional Spanish language tutor.
    Translate the following Chinese text into a natural, spoken-style Spanish vlog script suitable for a learner.
    Identify key vocabulary words and interesting grammar points from the translation.
    
    Chinese Input: "${chineseText}"
  `;

  return await fetchFromGemini(prompt, chineseText);
};

export const modifyVlogContent = async (currentSpanishText: string, instruction: string, originalChinese: string): Promise<Omit<VlogEntry, 'timestamp'>> => {
  const prompt = `
    You are a professional Spanish language tutor.
    Here is a Spanish vlog script: "${currentSpanishText}"
    
    Please REWRITE this script based on the following instruction: "${instruction}"
    
    Keep the meaning close to the original concept unless the instruction says otherwise.
    After rewriting, re-extract key vocabulary and grammar points from the NEW text.
  `;

  return await fetchFromGemini(prompt, originalChinese);
};

// Helper to handle the JSON schema request for full vlog entries
async function fetchFromGemini(prompt: string, originalTextRef: string): Promise<Omit<VlogEntry, 'timestamp'>> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          spanishText: { type: Type.STRING, description: "The translated/rewritten Spanish vlog script." },
          vocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                meaning: { type: Type.STRING, description: "Meaning in Chinese" },
                context: { type: Type.STRING, description: "The sentence from the script containing the word" }
              }
            }
          },
          grammar: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                point: { type: Type.STRING, description: "The grammar rule name" },
                explanation: { type: Type.STRING, description: "Explanation in Chinese" },
                example: { type: Type.STRING, description: "Example usage from the text" }
              }
            }
          }
        }
      }
    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("No response from AI");

  const result = JSON.parse(jsonText) as { spanishText: string; vocabulary: Vocabulary[]; grammar: Grammar[] };

  return {
    id: uuidv4(),
    originalText: originalTextRef, // Preserve original thought
    spanishText: result.spanishText,
    vocabulary: result.vocabulary,
    grammar: result.grammar
  };
}

// --- Selection Analysis ---

export const analyzeSelection = async (
  selection: string, 
  fullContext: string, 
  type: 'vocab' | 'grammar'
): Promise<Vocabulary | Grammar> => {
  const ai = getAIClient();

  const prompt = type === 'vocab' 
    ? `
      Context: "${fullContext}"
      Target Word/Phrase: "${selection}"
      
      Explain this target word/phrase as a vocabulary item for a Chinese learner of Spanish.
      Return JSON.
    `
    : `
      Context: "${fullContext}"
      Target Phrase/Sentence: "${selection}"
      
      Explain the grammar point visible in this target phrase for a Chinese learner of Spanish.
      Return JSON.
    `;

  const schema = type === 'vocab' 
    ? {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The selected word(s)" },
          meaning: { type: Type.STRING, description: "Meaning in Chinese" },
          context: { type: Type.STRING, description: "The sentence containing it (or the selection itself)" }
        }
      }
    : {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING, description: "Name of the grammar point" },
          explanation: { type: Type.STRING, description: "Explanation in Chinese" },
          example: { type: Type.STRING, description: "The selection usage" }
        }
      };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("No response from AI");
  
  return JSON.parse(jsonText);
};


// --- TTS Generation ---

// Helper to decode base64 audio (from documentation)
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playSpanishAudio = async (text: string) => {
  const ai = getAIClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      outputAudioContext,
      24000,
      1,
    );

    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputNode);
    source.start();
    
    return source; 
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};