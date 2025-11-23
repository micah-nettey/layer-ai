import { GoogleGenAI } from "@google/genai";
import type { Message, SupportedModel } from '@layer/types';
import { MODEL_REGISTRY } from "@layer/types";

let client: GoogleGenAI | null = null;

function getGoogleClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || ''});
  }
  return client;
}

export interface GoogleCompletionParams {
  model: string; 
  messages: Message[];
  temperature?: number; 
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
}


export interface ProviderResponse {
  content: string; 
  promptTokens: number;
  completionTokens: number; 
  totalTokens: number;
  costUsd: number;
}

export async function createCompletion(params: GoogleCompletionParams): Promise<ProviderResponse> {
  const contents = params.messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const response = await getGoogleClient().models.generateContent({
    model: params.model,
    contents,
    config: {
      systemInstruction: params.systemPrompt,
      temperature: params.temperature,
      maxOutputTokens: params.maxTokens,
      topP: params.topP,
    },
  });

  const content = response.text || '';
  const usageMetadata = response.usageMetadata;
  const promptTokens = usageMetadata?.promptTokenCount || 0;
  const completionTokens = usageMetadata?.candidatesTokenCount || 0;
  const totalTokens = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

  const pricing = MODEL_REGISTRY[params.model as SupportedModel].pricing;
  const costUsd = (promptTokens / 1000 * pricing.input) + (completionTokens / 1000 * pricing.output);

  return {
    content,
    promptTokens,
    completionTokens,
    totalTokens,
    costUsd,
  };
}