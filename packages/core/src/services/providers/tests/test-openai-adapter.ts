import { OpenAIAdapter } from '../openai-adapter.js';
import type { LayerRequest } from '@layer-ai/sdk';

const adapter = new OpenAIAdapter();

async function testChatCompletion() {
  console.log('Testing chat completion...');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'gpt-4o-mini',
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
    model: 'gpt-4o-mini',
    type: 'chat',
    data: {
      messages: [
        {
          role: 'user',
          content: 'What color is the sky in this image?',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1765202659641-9ad9facfe5cf?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
              detail: 'high',
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
    model: 'dall-e-3',
    type: 'image',
    data: {
      prompt: 'A cute cat playing with a ball of yarn',
      size: '1024x1024',
      quality: 'standard',
      count: 1,
    },
  };

  const response = await adapter.call(request);
  console.log('Generated images:', response.images?.length);
  console.log('Image URL:', response.images?.[0]?.url);
  console.log('Revised prompt:', response.images?.[0]?.revisedPrompt);
  console.log('✅ Image generation test passed\n');
}

async function testEmbeddings() {
  console.log('Testing embeddings...');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'text-embedding-3-small',
    type: 'embeddings',
    data: {
      input: 'Hello world',
    },
  };

  const response = await adapter.call(request);
  console.log('Embeddings dimensions:', response.embeddings?.[0]?.length);
  console.log('Tokens:', response.usage);
  console.log('Cost:', response.cost);
  console.log('✅ Embeddings test passed\n');
}

async function testTextToSpeech() {
  console.log('Testing text-to-speech...');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'tts-1',
    type: 'tts',
    data: {
      input: 'Hello, this is a test.',
      voice: 'alloy',
      speed: 1.0,
      responseFormat: 'mp3',
    },
  };

  const response = await adapter.call(request);
  console.log('Audio format:', response.audio?.format);
  console.log('Audio base64 length:', response.audio?.base64?.length);
  console.log('✅ Text-to-speech test passed\n');
}

async function testToolCalling() {
  console.log('Testing tool calling...');

  // Step 1: Initial request with tool available
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
      maxTokens: 100,
    },
  };

  const response = await adapter.call(request);
  console.log('Response content:', response.content);
  console.log('Tool calls:', response.toolCalls);
  console.log('Finish reason:', response.finishReason);

  if (!response.toolCalls || response.toolCalls.length === 0) {
    throw new Error('Expected tool calls but got none');
  }

  const toolCall = response.toolCalls[0];
  console.log('Function called:', toolCall.function.name);
  console.log('Function arguments:', toolCall.function.arguments);

  // Step 2: Send tool response back
  const toolResponseRequest: LayerRequest = {
    gateId: 'test-gate',
    model: 'gpt-4o-mini',
    type: 'chat',
    data: {
      messages: [
        { role: 'user', content: 'What is the weather in San Francisco?' },
        {
          role: 'assistant',
          content: response.content,
          toolCalls: response.toolCalls,
        },
        {
          role: 'tool',
          toolCallId: toolCall.id,
          content: JSON.stringify({ temperature: 72, condition: 'sunny' }),
        },
      ],
      tools: request.data.tools,
    },
  };

  const finalResponse = await adapter.call(toolResponseRequest);
  console.log('Final response:', finalResponse.content);
  console.log('✅ Tool calling test passed\n');
}

async function testContentAndToolCalls() {
  console.log('Testing content + tool calls in same message...');

  // This tests the fix we made - assistant messages can have BOTH content and toolCalls
  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'gpt-4o-mini',
    type: 'chat',
    data: {
      messages: [
        { role: 'user', content: 'Calculate 5 + 3 and explain why' },
        {
          role: 'assistant',
          content: 'Let me calculate that for you.',
          toolCalls: [
            {
              id: 'call_test_123',
              type: 'function',
              function: {
                name: 'calculate',
                arguments: JSON.stringify({ operation: 'add', a: 5, b: 3 }),
              },
            },
          ],
        },
        {
          role: 'tool',
          toolCallId: 'call_test_123',
          content: JSON.stringify({ result: 8 }),
        },
      ],
      maxTokens: 100,
    },
  };

  const response = await adapter.call(request);
  console.log('Response:', response.content);

  if (!response.content) {
    throw new Error('Expected content in response');
  }

  console.log('✅ Content + tool calls test passed\n');
}

async function runTests() {
  try {
    await testChatCompletion();

    console.log('Testing vision...');
    await testChatWithVision();

    console.log('Testing tool calling...');
    await testToolCalling();

    console.log('Testing content + tool calls...');
    await testContentAndToolCalls();

    await testImageGeneration();
    await testEmbeddings();
    await testTextToSpeech();

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
