import 'dotenv/config';
import { MistralAdapter } from '../mistral-adapter.js';
import type { LayerRequest } from '@layer-ai/sdk';

const adapter = new MistralAdapter();

// Test delay to avoid rate limits
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function testChatCompletion() {
  console.log('--- Testing Chat Completion ---');

  const request: LayerRequest = {
    gateId: 'test-gate',
    type: 'chat',
    model: 'mistral-small-latest',
    data: {
      messages: [
        {
          role: 'user',
          content: 'What is the capital of France? Answer in one word.',
        },
      ],
      temperature: 0.7,
      maxTokens: 50,
    },
  };

  const response = await adapter.call(request);
  console.log('Response:', response.content);
  console.log('Model:', response.model);
  console.log('Finish Reason:', response.finishReason);
  console.log('Usage:', response.usage);
  console.log('Latency:', response.latencyMs, 'ms');
  console.log();
}

async function testChatWithSystemPrompt() {
  console.log('--- Testing Chat with System Prompt ---');

  const request: LayerRequest = {
    gateId: 'test-gate',
    type: 'chat',
    model: 'mistral-small-latest',
    data: {
      systemPrompt:
        'You are a helpful assistant that responds in JSON format only.',
      messages: [
        {
          role: 'user',
          content: 'List 3 colors.',
        },
      ],
      temperature: 0.5,
      maxTokens: 100,
    },
  };

  const response = await adapter.call(request);
  console.log('Response:', response.content);
  console.log('Model:', response.model);
  console.log();
}

async function testChatWithTools() {
  console.log('--- Testing Chat with Tools ---');

  const request: LayerRequest = {
    gateId: 'test-gate',
    type: 'chat',
    model: 'mistral-small-latest',
    data: {
      messages: [
        {
          role: 'user',
          content: 'What is the weather in Paris today?',
        },
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
                  description: 'The city name',
                },
                unit: {
                  type: 'string',
                  enum: ['celsius', 'fahrenheit'],
                  description: 'Temperature unit',
                },
              },
              required: ['location'],
            },
          },
        },
      ],
      toolChoice: 'auto',
      maxTokens: 200,
    },
  };

  const response = await adapter.call(request);
  console.log('Response content:', response.content);
  console.log('Tool calls:', JSON.stringify(response.toolCalls, null, 2));
  console.log('Finish Reason:', response.finishReason);
  console.log();
}

async function testToolResponse() {
  console.log('--- Testing Tool Response Flow ---');

  // First, get the tool call
  const initialRequest: LayerRequest = {
    gateId: 'test-gate',
    type: 'chat',
    model: 'mistral-small-latest',
    data: {
      messages: [
        {
          role: 'user',
          content: 'What is 25 multiplied by 4?',
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'calculator',
            description: 'Perform mathematical calculations',
            parameters: {
              type: 'object',
              properties: {
                operation: {
                  type: 'string',
                  enum: ['add', 'subtract', 'multiply', 'divide'],
                },
                a: { type: 'number' },
                b: { type: 'number' },
              },
              required: ['operation', 'a', 'b'],
            },
          },
        },
      ],
      toolChoice: 'required',
      maxTokens: 200,
    },
  };

  const initialResponse = await adapter.call(initialRequest);
  console.log(
    'Initial response tool calls:',
    JSON.stringify(initialResponse.toolCalls, null, 2)
  );

  if (initialResponse.toolCalls && initialResponse.toolCalls.length > 0) {
    const toolCall = initialResponse.toolCalls[0];

    await delay(2000);

    const followUpRequest: LayerRequest = {
      gateId: 'test-gate',
      type: 'chat',
      model: 'mistral-small-latest',
      data: {
        messages: [
          {
            role: 'user',
            content: 'What is 25 multiplied by 4?',
          },
          {
            role: 'assistant',
            content: '',
            toolCalls: initialResponse.toolCalls,
          },
          {
            role: 'tool',
            content: '100',
            toolCallId: toolCall.id,
            name: toolCall.function.name,
          },
        ],
        maxTokens: 200,
      },
    };

    const followUpResponse = await adapter.call(followUpRequest);
    console.log('Follow-up response:', followUpResponse.content);
  }
  console.log();
}

async function testEmbeddings() {
  console.log('--- Testing Embeddings ---');

  const request: LayerRequest = {
    gateId: 'test-gate',
    type: 'embeddings',
    model: 'mistral-embed',
    data: {
      input: ['Hello, world!', 'How are you?'],
    },
  };

  const response = await adapter.call(request);
  console.log('Number of embeddings:', response.embeddings?.length);
  console.log('First embedding dimensions:', response.embeddings?.[0]?.length);
  console.log('Usage:', response.usage);
  console.log('Latency:', response.latencyMs, 'ms');
  console.log();
}

async function testVisionCapability() {
  console.log('--- Testing Vision Capability (Pixtral) ---');

  // Use a public image URL for testing
  const request: LayerRequest = {
    gateId: 'test-gate',
    type: 'chat',
    model: 'pixtral-large-2411',
    data: {
      messages: [
        {
          role: 'user',
          content: 'Describe this image briefly.',
          images: [
            {
              url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/320px-Camponotus_flavomarginatus_ant.jpg',
            },
          ],
        },
      ],
      maxTokens: 150,
    },
  };

  try {
    const response = await adapter.call(request);
    console.log('Vision response:', response.content);
    console.log('Model:', response.model);
  } catch (error) {
    console.log(
      'Test failed (Mistral could not fetch image URL):',
      (error as Error).message.substring(0, 100)
    );
  }
  console.log();
}

async function testResponseFormat() {
  console.log('--- Testing JSON Response Format ---');

  const request: LayerRequest = {
    gateId: 'test-gate',
    type: 'chat',
    model: 'mistral-small-latest',
    data: {
      messages: [
        {
          role: 'user',
          content: 'List 3 programming languages with their year of creation.',
        },
      ],
      responseFormat: { type: 'json_object' },
      maxTokens: 200,
    },
  };

  const response = await adapter.call(request);
  console.log('JSON Response:', response.content);
  console.log();
}

async function testMultiTurn() {
  console.log('--- Testing Multi-turn Conversation ---');

  const request: LayerRequest = {
    gateId: 'test-gate',
    type: 'chat',
    model: 'mistral-small-latest',
    data: {
      messages: [
        {
          role: 'user',
          content: 'My name is Alice.',
        },
        {
          role: 'assistant',
          content: 'Hello Alice! Nice to meet you.',
        },
        {
          role: 'user',
          content: 'What is my name?',
        },
      ],
      maxTokens: 50,
    },
  };

  const response = await adapter.call(request);
  console.log('Response:', response.content);
  console.log();
}

async function testOCR() {
  console.log('--- Testing OCR Capability ---');

  const request: LayerRequest = {
    gateId: 'test-gate',
    type: 'ocr',
    model: 'mistral-ocr-latest',
    data: {
      documentUrl: 'https://arxiv.org/pdf/2201.04234',
    },
  };

  try {
    const response = await adapter.call(request);
    console.log(
      'OCR Response (first 500 chars):',
      response.content?.substring(0, 500)
    );
    console.log('Model:', response.model);
    console.log('Pages extracted:', response.ocr?.pages?.length || 0);
    console.log('Latency:', response.latencyMs, 'ms');
  } catch (error) {
    console.log('Test failed:', (error as Error).message);
  }
  console.log();
}

async function testUnsupportedModality() {
  console.log('--- Testing Unsupported Modality (Image Generation) ---');

  const request = {
    gateId: 'test-gate',
    type: 'image',
    model: 'mistral-large-latest',
    data: {
      prompt: 'A sunset over the ocean',
    },
  } as LayerRequest;

  try {
    await adapter.call(request);
    console.log('ERROR: Should have thrown an error');
  } catch (error) {
    console.log('Expected error:', (error as Error).message);
  }
  console.log();
}

async function runAllTests() {
  console.log('=== Mistral Adapter Tests ===\n');

  try {
    await testChatCompletion();
    await testChatWithSystemPrompt();
    await testChatWithTools();
    await testToolResponse();
    await testEmbeddings();
    await testVisionCapability();
    await testOCR();
    await testResponseFormat();
    await testMultiTurn();
    await testUnsupportedModality();

    console.log('=== All tests completed ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runAllTests();
