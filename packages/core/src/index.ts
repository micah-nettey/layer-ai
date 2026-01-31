// Routes
export { default as authRouter } from './routes/v1/auth.js';
export { default as gatesRouter } from './routes/v1/gates.js';
export { default as keysRouter } from './routes/v1/keys.js';
export { default as logsRouter } from './routes/v1/logs.js';

// v2 routes
export { default as completeRouter } from './routes/v2/complete.js';

// v3 routes
export { default as chatRouter } from './routes/v3/chat.js';
export { default as imageRouter } from './routes/v3/image.js';
export { default as videoRouter } from './routes/v3/video.js';
export { default as embeddingsRouter } from './routes/v3/embeddings.js';
export { default as ttsRouter } from './routes/v3/tts.js';
export { default as ocrRouter } from './routes/v3/ocr.js';

// Middleware
export { authenticate } from './middleware/auth.js';
export type {} from './middleware/auth.js';

// Database
export { db } from './lib/db/postgres.js';
export { default as redis } from './lib/db/redis.js';

// Encryption
export { encrypt, decrypt, generateEncryptionKey } from './lib/encryption.js';
export type { EncryptedData } from '@layer-ai/sdk';

// Session Key Utilities (for Next.js auth)
export const createSessionKey = async (userId: string): Promise<string> => {
  const { db } = await import('./lib/db/postgres.js');
  return db.createSessionKey(userId);
};

export const deleteSessionKeysForUser = async (
  userId: string
): Promise<void> => {
  const { db } = await import('./lib/db/postgres.js');
  return db.deleteSessionKeysForUser(userId);
};

// Services
export * from './services/task-analysis.js';

// Provider Factory
export {
  PROVIDER,
  PROVIDERS,
  type Provider,
  callAdapter,
  normalizeModelId,
  getProviderForModel,
} from './lib/provider-factory.js';
