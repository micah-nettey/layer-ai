// Test v2 complete route with OpenAI adapter
// This demonstrates LayerRequest format with OpenAI features

import type { LayerRequest } from '@layer-ai/sdk';

async function testBasicChat() {
  console.log('Test 1: Basic chat completion with OpenAI\n');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'gpt-4o-mini',
    type: 'chat',
    data: {
      messages: [
        { role: 'user', content: 'Say "Hello from v2 API" and nothing else.' },
      ],
      temperature: 0.7,
      maxTokens: 20,
    },
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('\nExpected response includes:');
  console.log('- content: string');
  console.log('- model: string');
  console.log(
    '- finishReason: "completed" | "length_limit" | "tool_call" | "filtered" | "error"'
  );
  console.log('- usage: { promptTokens, completionTokens, totalTokens }');
  console.log('- cost: number');
  console.log('- latencyMs: number');
}

async function testVision() {
  console.log('\n\nTest 2: Vision with GPT-4o\n');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'gpt-4o',
    type: 'chat',
    data: {
      messages: [
        {
          role: 'user',
          content: 'What color is the sky in this image?',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1765202659641-9ad9facfe5cf?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0',
              detail: 'auto',
            },
          ],
        },
      ],
      maxTokens: 50,
    },
  };

  console.log('Request includes image with detail level (auto/low/high)');
  console.log('OpenAI supports image detail parameter for cost optimization');
}

async function testToolCalls() {
  console.log('\n\nTest 3: Tool calls with GPT-4\n');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'gpt-4o-mini',
    type: 'chat',
    data: {
      messages: [
        { role: 'user', content: 'What is the weather in San Francisco?' },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get the current weather for a location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state, e.g. San Francisco, CA',
                },
              },
              required: ['location'],
            },
          },
        },
      ],
      toolChoice: 'auto',
      maxTokens: 100,
    },
  };

  console.log('Request includes tools array and toolChoice');
  console.log('OpenAI will return toolCalls in response when needed');
}

async function testImageGeneration() {
  console.log('\n\nTest 4: Image generation with DALL-E\n');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'dall-e-3',
    type: 'image',
    data: {
      prompt: 'A cute cat playing with yarn',
      size: '1024x1024',
      quality: 'standard',
      count: 1,
    },
  };

  console.log('Image generation request format');
  console.log('Response will include images array with URLs');
  console.log(
    'This is a unique feature to v2 - multiple modalities in one endpoint'
  );
}

async function testEmbeddings() {
  console.log('\n\nTest 5: Text embeddings\n');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'text-embedding-3-small',
    type: 'embeddings',
    data: {
      input: 'The quick brown fox jumps over the lazy dog',
      dimensions: 1536,
    },
  };

  console.log('Embeddings request format');
  console.log('Response will include embeddings array (number[][])');
  console.log(
    'Another unique v2 feature - embeddings through the same endpoint'
  );
}

async function testTextToSpeech() {
  console.log('\n\nTest 6: Text-to-speech\n');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'tts-1',
    type: 'tts',
    data: {
      input: 'Hello, this is a test of the text to speech system.',
      voice: 'alloy',
      responseFormat: 'mp3',
    },
  };

  console.log('Text-to-speech request format');
  console.log('Response will include audio with base64 data');
  console.log('Yet another v2 exclusive - TTS through unified API');
}

async function testResponseFormat() {
  console.log('\n\nTest 7: JSON response format\n');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'gpt-4o-mini',
    type: 'chat',
    data: {
      messages: [
        {
          role: 'user',
          content:
            'Generate a JSON object with name and age fields for a person.',
        },
      ],
      responseFormat: 'json_object',
      maxTokens: 100,
    },
  };

  console.log('Request with JSON response format');
  console.log('OpenAI will ensure the response is valid JSON');
  console.log('Available in v2 with responseFormat parameter');
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('V2 Complete Route - OpenAI Feature Showcase');
  console.log('='.repeat(60));
  console.log('\nTo test manually:');
  console.log('1. Start server: pnpm --filter @layer-ai/api dev');
  console.log('2. Create test gate in database with OpenAI model');
  console.log('3. POST to /v2/complete with LayerRequest format');
  console.log('='.repeat(60));

  await testBasicChat();
  await testVision();
  await testToolCalls();
  await testImageGeneration();
  await testEmbeddings();
  await testTextToSpeech();
  await testResponseFormat();

  console.log('\n' + '='.repeat(60));
  console.log('V2 API supports ALL modalities through one endpoint:');
  console.log('- chat: Text completion and multimodal chat');
  console.log('- image: DALL-E image generation');
  console.log('- embeddings: Text embeddings');
  console.log('- tts: Text-to-speech');
  console.log('- video: (Future) Video generation');
  console.log('\nAll with consistent LayerRequest/LayerResponse format');
  console.log('='.repeat(60));
}

runTests();
