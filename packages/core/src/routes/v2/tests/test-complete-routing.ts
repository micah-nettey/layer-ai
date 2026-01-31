// Test v2 complete route with routing strategies
// Demonstrates fallback and round-robin across different providers

import type { LayerRequest } from '@layer-ai/sdk';

async function testFallbackRouting() {
  console.log('Test 1: Fallback routing (Anthropic -> OpenAI)\n');

  const request: LayerRequest = {
    gateId: 'test-gate-with-fallback',
    model: 'claude-sonnet-4-5-20250929', // Primary model
    type: 'chat',
    data: {
      messages: [{ role: 'user', content: 'Hello! Please respond.' }],
      maxTokens: 50,
    },
  };

  console.log('Gate configuration should have:');
  console.log('- model: claude-sonnet-4-5-20250929');
  console.log('- routingStrategy: "fallback"');
  console.log('- fallbackModels: ["gpt-4o-mini", "gpt-3.5-turbo"]');
  console.log('\nBehavior:');
  console.log('1. Try primary model (Claude Sonnet)');
  console.log('2. If fails, try first fallback (GPT-4o-mini)');
  console.log('3. If fails, try second fallback (GPT-3.5-turbo)');
  console.log('4. Return first successful response');
  console.log(
    '\nResponse will include "model" field showing which model was used'
  );
}

async function testRoundRobinRouting() {
  console.log('\n\nTest 2: Round-robin routing across providers\n');

  const request: LayerRequest = {
    gateId: 'test-gate-with-round-robin',
    model: 'claude-sonnet-4-5-20250929',
    type: 'chat',
    data: {
      messages: [{ role: 'user', content: 'Tell me a fun fact.' }],
      maxTokens: 100,
    },
  };

  console.log('Gate configuration should have:');
  console.log('- model: claude-sonnet-4-5-20250929');
  console.log('- routingStrategy: "round-robin"');
  console.log('- fallbackModels: ["gpt-4o-mini", "gpt-4o"]');
  console.log('\nBehavior:');
  console.log(
    '- Randomly selects one of: [Claude Sonnet, GPT-4o-mini, GPT-4o]'
  );
  console.log('- Distributes load across multiple models/providers');
  console.log('- Useful for cost optimization and rate limit management');
  console.log(
    '\nResponse "model" field shows which model was randomly selected'
  );
}

async function testCrossProviderFallback() {
  console.log('\n\nTest 3: Cross-provider fallback with vision\n');

  const request: LayerRequest = {
    gateId: 'test-gate-vision-fallback',
    model: 'claude-sonnet-4-5-20250929',
    type: 'chat',
    data: {
      messages: [
        {
          role: 'user',
          content: 'What do you see in this image?',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1765202659641-9ad9facfe5cf?q=80&w=1364&auto=format&fit=crop',
            },
          ],
        },
      ],
      maxTokens: 100,
    },
  };

  console.log('Gate configuration:');
  console.log('- model: claude-sonnet-4-5-20250929 (Anthropic vision)');
  console.log('- routingStrategy: "fallback"');
  console.log('- fallbackModels: ["gpt-4o", "gpt-4o-mini"]');
  console.log('\nUse case:');
  console.log('- Try Anthropic vision first');
  console.log('- If rate limited or error, fallback to OpenAI vision');
  console.log('- Ensures high availability for vision workloads');
}

async function testToolCallsFallback() {
  console.log('\n\nTest 4: Fallback routing with tool calls\n');

  const request: LayerRequest = {
    gateId: 'test-gate-tools-fallback',
    model: 'gpt-4o-mini',
    type: 'chat',
    data: {
      messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get weather for a location',
            parameters: {
              type: 'object',
              properties: {
                location: { type: 'string', description: 'City name' },
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

  console.log('Gate configuration:');
  console.log('- model: gpt-4o-mini');
  console.log('- routingStrategy: "fallback"');
  console.log('- fallbackModels: ["gpt-4o", "claude-sonnet-4-5-20250929"]');
  console.log('\nBehavior:');
  console.log('- All three models support function calling');
  console.log('- Fallback works seamlessly across providers');
  console.log(
    '- Response includes toolCalls array from whichever model succeeded'
  );
}

async function testCostOptimization() {
  console.log('\n\nTest 5: Cost optimization with round-robin\n');

  const request: LayerRequest = {
    gateId: 'test-gate-cost-optimization',
    model: 'gpt-4o-mini',
    type: 'chat',
    data: {
      messages: [
        { role: 'user', content: 'Write a short poem about the ocean.' },
      ],
      maxTokens: 150,
    },
  };

  console.log('Gate configuration:');
  console.log('- model: gpt-4o-mini ($0.15/$0.60 per 1M tokens)');
  console.log('- routingStrategy: "round-robin"');
  console.log('- fallbackModels: [');
  console.log('    "gpt-3.5-turbo" ($0.50/$1.50 per 1M)');
  console.log('    "claude-haiku-3-5-20241022" ($0.80/$4.00 per 1M)');
  console.log('  ]');
  console.log('\nUse case:');
  console.log('- Distribute load across cheapest available models');
  console.log('- Balance cost vs quality for non-critical workloads');
  console.log('- Response includes "cost" field for tracking');
}

async function testProviderSpecificFeatures() {
  console.log('\n\nTest 6: Mixing provider-specific features\n');

  console.log('Scenario A: Start with Claude (better reasoning)');
  console.log('Gate: model=claude-sonnet, fallback=[gpt-4o]');
  console.log('Use for: Complex reasoning, analysis, code generation');

  console.log('\nScenario B: Start with GPT-4o (multimodal)');
  console.log('Gate: model=gpt-4o, fallback=[claude-sonnet]');
  console.log('Use for: Image analysis, audio processing');

  console.log('\nScenario C: Start with cheapest (GPT-3.5)');
  console.log(
    'Gate: model=gpt-3.5-turbo, fallback=[gpt-4o-mini, claude-haiku]'
  );
  console.log('Use for: Simple tasks, high volume workloads');

  console.log('\nThe v2 API makes it easy to switch strategies per gate');
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('V2 Complete Route - Routing Strategies with Mixed Models');
  console.log('='.repeat(70));
  console.log('\nRouting enables:');
  console.log('- High availability (fallback to working models)');
  console.log('- Cost optimization (round-robin across cheap models)');
  console.log('- Provider redundancy (mix OpenAI + Anthropic)');
  console.log('- Rate limit handling (switch when rate limited)');
  console.log('='.repeat(70));

  await testFallbackRouting();
  await testRoundRobinRouting();
  await testCrossProviderFallback();
  await testToolCallsFallback();
  await testCostOptimization();
  await testProviderSpecificFeatures();

  console.log('\n' + '='.repeat(70));
  console.log('How to set up routing:');
  console.log('\n1. Create a gate with routing configuration:');
  console.log('   POST /v1/gates');
  console.log('   {');
  console.log('     "name": "my-gate",');
  console.log('     "model": "claude-sonnet-4-5-20250929",');
  console.log('     "routingStrategy": "fallback",');
  console.log('     "fallbackModels": ["gpt-4o-mini", "gpt-3.5-turbo"]');
  console.log('   }');
  console.log('\n2. Use the gate in v2/complete:');
  console.log('   POST /v2/complete');
  console.log('   {');
  console.log('     "gate": "my-gate",');
  console.log('     "type": "chat",');
  console.log('     "data": { "messages": [...] }');
  console.log('   }');
  console.log('\n3. Check response.model to see which model was used');
  console.log('='.repeat(70));
}

runTests();
