/**
 * Key Resolver
 *
 * Resolves API keys for providers with BYOK support.
 * Priority: User's BYOK key → Platform key → Error
 */

import type { Provider } from './provider-constants.js';
import { decrypt } from './encryption.js';

export interface ResolvedKey {
  key: string;
  usedPlatformKey: boolean;
}

/**
 * Resolves the API key to use for a provider
 * @param provider - The provider name
 * @param userId - Optional user ID for BYOK lookup
 * @param platformKey - The platform's API key (fallback)
 * @returns The API key to use and whether platform key was used
 */
export async function resolveApiKey(
  provider: Provider,
  userId: string | undefined,
  platformKey: string | undefined
): Promise<ResolvedKey> {
  // If userId is provided, check for BYOK key
  if (userId) {
    try {
      const byokKey = await getUserProviderKey(userId, provider);
      if (byokKey) {
        return { key: byokKey, usedPlatformKey: false };
      }
    } catch (error) {
      console.error(
        `Failed to fetch BYOK key for user ${userId}, provider ${provider}:`,
        error
      );
      // Continue to fallback
    }
  }

  // Fallback to platform key
  if (platformKey) {
    return { key: platformKey, usedPlatformKey: true };
  }

  throw new Error(`No API key available for provider: ${provider}`);
}

/**
 * Fetches and decrypts user's BYOK key for a provider
 * @param userId - The user ID
 * @param provider - The provider name
 * @returns The decrypted API key, or null if not found
 */
async function getUserProviderKey(
  userId: string,
  provider: Provider
): Promise<string | null> {
  // Dynamically import to avoid circular dependencies
  const { db } = await import('./db/postgres.js');

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.warn('ENCRYPTION_KEY not set, BYOK disabled');
    return null;
  }

  const providerKey = await db.getProviderKey(userId, provider);

  if (!providerKey) {
    return null;
  }

  // Check if key is active
  if (!providerKey.isActive) {
    return null;
  }

  // Decrypt the key
  const decryptedKey = decrypt(providerKey.encryptedKey, encryptionKey);
  return decryptedKey;
}
