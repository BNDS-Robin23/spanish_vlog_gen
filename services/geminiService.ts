import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VlogEntry, Vocabulary, Grammar } from "../types";
import { v4 as uuidv4 } from 'uuid';

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing in environment variables");
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

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          spanishText: { type: Type.STRING, description: "The translated Spanish vlog script." },
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
    originalText: chineseText,
    spanishText: result.spanishText,
    vocabulary: result.vocabulary,
    grammar: result.grammar
  };
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
  
  // Truncate text if it's too long for a single pass, though Gemini can handle decent length.
  // For a vlog, it might be long, but let's assume reasonably short paragraphs for now.
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Spanish-sounding or generic capable voice
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
    
    return source; // Return source to allow stopping if needed
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};