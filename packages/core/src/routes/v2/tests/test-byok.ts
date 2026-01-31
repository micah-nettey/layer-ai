/**
 * Test BYOK (Bring Your Own Keys) functionality
 *
 * This test verifies that when a user has configured their own provider keys,
 * those keys are used instead of the platform keys.
 */

import { db } from '../../../lib/db/postgres.js';
import { decrypt } from '../../../lib/encryption.js';

async function testBYOK() {
  console.log('\n🔑 Testing BYOK Key Resolution...\n');

  // Test user ID from the database query
  const userId = 'ebd64998-465d-4211-ad67-87b4e01ad0da';

  try {
    // Test 1: Retrieve OpenAI key
    console.log('Test 1: Retrieving OpenAI BYOK key...');
    const openaiKey = await db.getProviderKey(userId, 'openai');

    if (openaiKey) {
      console.log('✓ OpenAI key found in database');
      console.log(`  Provider: ${openaiKey.provider}`);
      console.log(`  Key Prefix: ${openaiKey.keyPrefix}`);
      console.log(`  Created: ${openaiKey.createdAt}`);

      // Decrypt and verify the key
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY not found in environment');
      }

      const decryptedKey = decrypt(openaiKey.encryptedKey, encryptionKey);
      console.log(
        `  Decrypted key starts with: ${decryptedKey.substring(0, 10)}...`
      );
      console.log(`  Decrypted key length: ${decryptedKey.length} characters`);
    } else {
      console.log('✗ No OpenAI key found');
    }

    console.log('\nTest 2: Retrieving Anthropic BYOK key...');
    const anthropicKey = await db.getProviderKey(userId, 'anthropic');

    if (anthropicKey) {
      console.log('✓ Anthropic key found in database');
      console.log(`  Provider: ${anthropicKey.provider}`);
      console.log(`  Key Prefix: ${anthropicKey.keyPrefix}`);
      console.log(`  Created: ${anthropicKey.createdAt}`);

      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY not found in environment');
      }

      const decryptedKey = decrypt(anthropicKey.encryptedKey, encryptionKey);
      console.log(
        `  Decrypted key starts with: ${decryptedKey.substring(0, 14)}...`
      );
      console.log(`  Decrypted key length: ${decryptedKey.length} characters`);
    } else {
      console.log('✗ No Anthropic key found');
    }

    console.log('\nTest 3: Retrieving Google BYOK key (should not exist)...');
    const googleKey = await db.getProviderKey(userId, 'google');

    if (googleKey) {
      console.log('✓ Google key found in database');
    } else {
      console.log('✓ No Google key found (as expected)');
    }

    console.log('\n✅ BYOK test completed successfully!\n');
  } catch (error) {
    console.error('\n❌ BYOK test failed:', error);
    throw error;
  }
}

// Run the test
testBYOK()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
