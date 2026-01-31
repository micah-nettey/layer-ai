// Test v2 complete route with Anthropic adapter
// This demonstrates the full LayerRequest format with all features

import type { LayerRequest } from '@layer-ai/sdk';

async function testBasicChat() {
  console.log('Test 1: Basic chat completion with Anthropic\n');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'claude-sonnet-4-5-20250929',
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
  console.log('- raw: original provider response');
}

async function testVision() {
  console.log('\n\nTest 2: Vision with Anthropic (not supported in v1)\n');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'claude-sonnet-4-5-20250929',
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

  console.log('Request includes image URL in message');
  console.log('This feature is only available in v2 API');
}

async function testToolCalls() {
  console.log('\n\nTest 3: Tool calls with Anthropic (not supported in v1)\n');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'claude-sonnet-4-5-20250929',
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
  console.log(
    'Response will include toolCalls array if Claude wants to call a tool'
  );
  console.log('This feature is only available in v2 API');
}

async function testSystemPrompt() {
  console.log('\n\nTest 4: System prompt and advanced params\n');

  const request: LayerRequest = {
    gateId: 'test-gate',
    model: 'claude-sonnet-4-5-20250929',
    type: 'chat',
    data: {
      messages: [{ role: 'user', content: 'Write a haiku about coding' }],
      systemPrompt: 'You are a poetic AI that loves to write haikus.',
      temperature: 1.0,
      topP: 0.9,
      maxTokens: 100,
      stopSequences: ['END'],
    },
  };

  console.log('Request includes:');
  console.log('- systemPrompt: custom system instruction');
  console.log('- temperature: controls randomness');
  console.log('- topP: nucleus sampling');
  console.log('- stopSequences: custom stop sequences');
  console.log('All these features are available in v2');
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('V2 Complete Route - Feature Showcase');
  console.log('='.repeat(60));
  console.log('\nTo test manually:');
  console.log('1. Start server: pnpm --filter @layer-ai/api dev');
  console.log('2. Create test gate in database with Claude model');
  console.log('3. POST to /v2/complete with LayerRequest format');
  console.log('='.repeat(60));

  await testBasicChat();
  await testVision();
  await testToolCalls();
  await testSystemPrompt();

  console.log('\n' + '='.repeat(60));
  console.log('Key differences from v1:');
  console.log(
    '- v1: Simple CompletionRequest (messages, temp, maxTokens, topP)'
  );
  console.log(
    '- v2: Full LayerRequest (all above + tools, images, stopSeqs, etc)'
  );
  console.log('- v1: Returns CompletionResponse (content, usage)');
  console.log(
    '- v2: Returns LayerResponse (content, usage, toolCalls, cost, etc)'
  );
  console.log('='.repeat(60));
}

runTests();
