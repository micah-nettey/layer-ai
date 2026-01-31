import Anthropic from '@anthropic-ai/sdk';
import {
  MODEL_REGISTRY,
  TaskAnalysis,
  type ModelType,
  type ModelEntry,
} from '@layer-ai/sdk';

async function detectTaskType(
  description: string,
  anthropic: Anthropic
): Promise<ModelType> {
  const prompt = `Analyze this task description and determine what TYPE of AI task it is.

TASK DESCRIPTION:
"${description}"

AVAILABLE TASK TYPES:
- chat: Conversational AI, text generation, Q&A, summarization, translation
- image: Image generation, image creation
- video: Video generation, video creation
- audio: Audio/music generation
- tts: Text-to-speech, voice synthesis
- stt: Speech-to-text, audio transcription
- embeddings: Text embeddings, semantic search
- document: Document processing, OCR
- responses: Complex reasoning tasks (o3-pro style models)
- language-completion: Legacy text completion

Return ONLY the task type as a single word, nothing else.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      temperature: 0.0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseContent = response.content[0];
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const detectedType = responseContent.text.trim().toLowerCase();

    const validTypes: ModelType[] = [
      'chat',
      'image',
      'video',
      'audio',
      'tts',
      'stt',
      'embeddings',
      'document',
      'responses',
      'language-completion',
    ];

    if (validTypes.includes(detectedType as ModelType)) {
      return detectedType as ModelType;
    }

    return 'chat';
  } catch (error) {
    console.error('Failed to detect task type:', error);
    return 'chat';
  }
}

export async function analyzeTask(
  description: string,
  userPreferences?: {
    costWeight?: number;
    latencyWeight?: number;
    qualityWeight?: number;
  }
): Promise<TaskAnalysis> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const costWeight = userPreferences?.costWeight ?? 0.33;
  const latencyWeight = userPreferences?.latencyWeight ?? 0.33;
  const qualityWeight = userPreferences?.qualityWeight ?? 0.33;

  let taskType: ModelType = 'chat';

  try {
    taskType = await detectTaskType(description, anthropic);
  } catch (error) {
    console.error('Failed to detect task type, defaulting to chat:', error);
  }

  const filteredRegistry: Record<string, ModelEntry> = {};
  for (const [key, model] of Object.entries(MODEL_REGISTRY)) {
    if (model.type === taskType) {
      filteredRegistry[key] = model;
    }
  }

  const registryContext = JSON.stringify(filteredRegistry, null, 2);

  const prompt = `You are analyzing a task to recommend the best AI models from our registry.

TASK TYPE: ${taskType}
All models below are specifically for ${taskType} tasks.

MODEL REGISTRY (available models and their capabilities):
${registryContext}

TASK DESCRIPTION:
"${description}"

USER PREFERENCES (0.0 = doesn't care, 1.0 = very important):
- Cost importance: ${costWeight}
- Latency importance: ${latencyWeight}
- Quality importance: ${qualityWeight}

Analyze this task and recommend the BEST models from our registry that match BOTH the task requirements AND user preferences.

Consider:
- Math benchmarks (for quantitative tasks)
- Coding benchmarks (for programming tasks)
- Intelligence scores (for reasoning)
- Context window (if task needs long context)
- Pricing (balance quality vs cost)
- Performance (speed matters for some tasks)
- Capabilities (if a model is able to accurately perform task in the description)
- Model Modalities (what form does model input and output come in)

Return JSON with:
{
  "primary": "model-id",           // Best overall choice
  "alternatives": ["id1", "id2"],  // 2-3 other good options
  "reasoning": "why these models work for this task and user preferences"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      temperature: 0.0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseContent = response.content[0];
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let jsonText = responseContent.text.trim();

    // Extract JSON from code blocks
    if (jsonText.startsWith('```')) {
      jsonText = jsonText
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '');
    }

    // Extract JSON object if there's additional text after it
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const mapping = JSON.parse(jsonText);

    if (typeof mapping !== 'object' || Array.isArray(mapping)) {
      throw new Error('Mapping is in wrong format');
    }

    return {
      taskType,
      ...mapping,
    };
  } catch (error) {
    console.error('Failed to find accurate task requirements', error);
    return {
      taskType,
      primary: 'gpt-4o',
      alternatives: ['claude-sonnet-4-5-20250929', 'gemini-2.5-flash'],
      reasoning: 'Task analysis failed, returning safe defaults',
    };
  }
}
