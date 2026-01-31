import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

export function encrypt(plaintext: string, masterKey: string): EncryptedData {
  if (!plaintext) {
    throw new Error('Plaintext is required');
  }
  if (!masterKey || masterKey.length !== 64) {
    throw new Error('Master key must be a 64-character hex string (32 bytes)');
  }

  const iv = randomBytes(12);
  const keyBuffer = Buffer.from(masterKey, 'hex');
  const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv);

  let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decrypt(
  encryptedData: EncryptedData,
  masterKey: string
): string {
  if (
    !encryptedData ||
    !encryptedData.encrypted ||
    !encryptedData.iv ||
    !encryptedData.authTag
  ) {
    throw new Error('Invalid encrypted data structure');
  }
  if (!masterKey || masterKey.length !== 64) {
    throw new Error('Master key must be a 64-character hex string (32 bytes)');
  }

  const keyBuffer = Buffer.from(masterKey, 'hex');
  const ivBuffer = Buffer.from(encryptedData.iv, 'hex');
  const authTagBuffer = Buffer.from(encryptedData.authTag, 'hex');

  const decipher = createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}
