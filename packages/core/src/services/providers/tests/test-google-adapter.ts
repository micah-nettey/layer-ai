import 'dotenv/config';
import { GoogleAdapter } from '../google-adapter.js';
import type { LayerRequest } from '@layer-ai/sdk';

const adapter = new GoogleAdapter();

async function testChatCompletion() {
  console.log('Testing chat completion...');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'gemini-2.5-flash',
    type: 'chat',
    data: {
      messages: [
        { role: 'user', content: 'Say "Hello World" and nothing else.' },
      ],
      temperature: 0.7,
      maxTokens: 10,
    },
  };

  const response = await adapter.call(request);
  console.log('Response:', response.content);
  console.log('Tokens:', response.usage);
  console.log('Cost:', response.cost);
  console.log('Latency:', response.latencyMs + 'ms');
  console.log('Finish reason:', response.finishReason);
  console.log('✅ Chat completion test passed\n');
}

async function testChatWithVision() {
  console.log('Testing chat with vision...');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'gemini-2.5-flash',
    type: 'chat',
    data: {
      messages: [
        {
          role: 'user',
          content: 'What color is the sky in this image?',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1765202659641-9ad9facfe5cf?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            },
          ],
        },
      ],
      maxTokens: 50,
    },
  };

  const response = await adapter.call(request);
  console.log('Response:', response.content);
  console.log('Finish reason:', response.finishReason);
  console.log('✅ Vision test passed\n');
}

async function testImageGeneration() {
  console.log('Testing image generation...');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'imagen-4.0-generate-001',
    type: 'image',
    data: {
      prompt: 'A cute cat playing with a ball of yarn',
      count: 1,
    },
  };

  const response = await adapter.call(request);
  console.log('Generated images:', response.images?.length);
  console.log('Image base64 length:', response.images?.[0]?.base64?.length);
  console.log('Latency:', response.latencyMs + 'ms');
  console.log('✅ Image generation test passed\n');
}

async function testEmbeddings() {
  console.log('Testing embeddings...');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'text-embedding-004',
    type: 'embeddings',
    data: {
      input: 'Hello world',
    },
  };

  const response = await adapter.call(request);
  console.log('Embeddings dimensions:', response.embeddings?.[0]?.length);
  console.log('Latency:', response.latencyMs + 'ms');
  console.log('✅ Embeddings test passed\n');
}

async function testToolCalling() {
  console.log('Testing tool calling...');

  // Step 1: Send message with tools available
  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'gemini-2.5-flash',
    type: 'chat',
    data: {
      messages: [
        {
          role: 'user',
          content:
            'Use the get_current_time function to tell me what time it is.',
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_current_time',
            description: 'Returns the current time in ISO format',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        },
      ],
      toolChoice: 'required',
    },
  };

  const response = await adapter.call(request);
  console.log('Response content:', response.content);
  console.log('Tool calls:', response.toolCalls);
  console.log('Finish reason:', response.finishReason);
  console.log('Raw finish reason:', response.rawFinishReason);

  if (!response.toolCalls || response.toolCalls.length === 0) {
    console.log('Full response:', JSON.stringify(response, null, 2));
    throw new Error('Expected tool calls but got none');
  }

  const toolCall = response.toolCalls[0];
  console.log('Function called:', toolCall.function.name);
  console.log('Function arguments:', toolCall.function.arguments);

  // Step 2: Send tool response back
  const toolResponseRequest: LayerRequest = {
    gateId: 'test-gate',
    model: 'gemini-2.5-flash',
    type: 'chat',
    data: {
      messages: [
        {
          role: 'user',
          content:
            'Use the get_current_time function to tell me what time it is.',
        },
        {
          role: 'assistant',
          toolCalls: response.toolCalls,
        },
        {
          role: 'tool',
          toolCallId: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify({ current_time: '2025-12-20T07:30:00Z' }),
        },
      ],
      tools: request.data.tools,
    },
  };

  const finalResponse = await adapter.call(toolResponseRequest);
  console.log('Final response:', finalResponse.content);
  console.log('✅ Tool calling test passed\n');
}

async function testEmbeddingsMultiple() {
  console.log('Testing multiple embeddings...');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'text-embedding-004',
    type: 'embeddings',
    data: {
      input: ['Hello world', 'Goodbye world', 'Testing embeddings'],
    },
  };

  const response = await adapter.call(request);
  console.log('Number of embeddings:', response.embeddings?.length);
  console.log('First embedding dimensions:', response.embeddings?.[0]?.length);
  console.log('Latency:', response.latencyMs + 'ms');
  console.log('✅ Multiple embeddings test passed\n');
}

async function testTextToSpeech() {
  console.log('Testing text-to-speech...');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'gemini-2.5-flash-preview-tts',
    type: 'tts',
    data: {
      input: 'Hello, this is a test of the Google text-to-speech capabilities.',
      voice: 'Kore',
    },
  };

  const response = await adapter.call(request);
  console.log('Audio format:', response.audio?.format);
  console.log('Audio base64 length:', response.audio?.base64?.length);
  console.log('Latency:', response.latencyMs + 'ms');
  console.log('✅ Text-to-speech test passed\n');
}

async function testVideoGeneration() {
  console.log('Testing video generation (this may take a few minutes)...');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'veo-2.0-generate-001',
    type: 'video',
    data: {
      prompt: 'A serene ocean wave rolling onto a sandy beach at sunset',
      size: '1280x720',
      duration: 5,
    },
  };

  const response = await adapter.call(request);
  console.log('Generated videos:', response.videos?.length);
  console.log('Video URL:', response.videos?.[0]?.url);
  console.log('Video duration:', response.videos?.[0]?.duration);
  console.log('Latency:', response.latencyMs + 'ms');
  console.log('✅ Video generation test passed\n');
}

async function runTests() {
  try {
    console.log('Chat completion tests...');
    await testChatCompletion();
    await testChatWithVision();

    console.log('Embeddings...');
    await testEmbeddings();
    await testEmbeddingsMultiple();

    console.log('Image generation...');
    await testImageGeneration();

    console.log('Text-to-speech...');
    await testTextToSpeech();

    console.log('Video generation...');
    await testVideoGeneration();

    console.log('Tool calling...');
    await testToolCalling();

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
