/**
 * Provider Constants
 *
 * Central location for provider-related types and constants.
 * Separated from provider-factory to avoid circular dependencies.
 */

/**
 * Provider type - maps to adapter implementations
 */
export type Provider = 'openai' | 'anthropic' | 'google' | 'mistral';

/**
 * Provider constants - use these instead of string literals
 */
export const PROVIDER = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  MISTRAL: 'mistral',
} as const satisfies Record<string, Provider>;

/**
 * List of all providers
 */
export const PROVIDERS: Provider[] = [
  PROVIDER.OPENAI,
  PROVIDER.ANTHROPIC,
  PROVIDER.GOOGLE,
  PROVIDER.MISTRAL,
];
