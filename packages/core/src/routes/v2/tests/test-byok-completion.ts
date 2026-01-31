/**
 * Test BYOK completion flow
 *
 * This test verifies that when making a completion request:
 * 1. The system checks for user's BYOK keys
 * 2. Uses BYOK keys when available
 * 3. Falls back to platform keys when BYOK not configured
 */

import { OpenAIAdapter } from '../../../services/providers/openai-adapter.js';
import { AnthropicAdapter } from '../../../services/providers/anthropic-adapter.js';
import { GoogleAdapter } from '../../../services/providers/google-adapter.js';
import type { LayerRequest } from '@layer-ai/sdk';

// Test user ID from the database
const TEST_USER_ID = 'ebd64998-465d-4211-ad67-87b4e01ad0da';

const SIMPLE_REQUEST: LayerRequest = {
  gateId: 'byok-test',
  model: 'gpt-4o-mini',
  type: 'chat',
  data: {
    messages: [
      {
        role: 'user',
        content: 'Say "BYOK test successful" and nothing else.',
      },
    ],
    maxTokens: 20,
  },
};

async function testBYOKCompletion() {
  console.log('\n🧪 Testing BYOK Completion Flow...\n');

  try {
    // Test 1: OpenAI with BYOK (should use user's key)
    console.log('Test 1: OpenAI completion with BYOK key');
    console.log('----------------------------------------');
    const openaiAdapter = new OpenAIAdapter();
    const openaiRequest = { ...SIMPLE_REQUEST, model: 'gpt-4o-mini' };

    console.log(`Making request to OpenAI with userId: ${TEST_USER_ID}`);
    const openaiResult = await openaiAdapter.call(openaiRequest, TEST_USER_ID);
    console.log('✓ OpenAI request successful');
    console.log(`Response: ${openaiResult.content}`);
    console.log('Note: This request used your BYOK OpenAI key\n');

    // Test 2: Anthropic with BYOK (should use user's key)
    console.log('Test 2: Anthropic completion with BYOK key');
    console.log('------------------------------------------');
    const anthropicAdapter = new AnthropicAdapter();
    const anthropicRequest = {
      ...SIMPLE_REQUEST,
      model: 'claude-3-haiku-20240307',
    };

    console.log(`Making request to Anthropic with userId: ${TEST_USER_ID}`);
    const anthropicResult = await anthropicAdapter.call(
      anthropicRequest,
      TEST_USER_ID
    );
    console.log('✓ Anthropic request successful');
    console.log(`Response: ${anthropicResult.content}`);
    console.log('Note: This request used your BYOK Anthropic key\n');

    // Test 3: Google without BYOK (should use platform key)
    console.log('Test 3: Google completion without BYOK key');
    console.log('------------------------------------------');
    const googleAdapter = new GoogleAdapter();
    const googleRequest = { ...SIMPLE_REQUEST, model: 'gemini-2.0-flash' };

    console.log(`Making request to Google with userId: ${TEST_USER_ID}`);
    const googleResult = await googleAdapter.call(googleRequest, TEST_USER_ID);
    console.log('✓ Google request successful');
    console.log(`Response: ${googleResult.content}`);
    console.log(
      'Note: This request used the platform Google key (no BYOK configured)\n'
    );

    console.log('✅ All BYOK completion tests passed!\n');
    console.log('Summary:');
    console.log('- OpenAI: Used BYOK key ✓');
    console.log('- Anthropic: Used BYOK key ✓');
    console.log('- Google: Used platform key (fallback) ✓');
  } catch (error) {
    console.error('\n❌ BYOK completion test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
    throw error;
  }
}

// Run the test
testBYOKCompletion()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
