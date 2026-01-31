import type { ErrorResponse, RequestOptions, LayerConfig } from '@layer-ai/sdk';
import { GatesResource } from './resources/gates.js';
import { KeysResource } from './resources/keys.js';
import { LogsResource } from './resources/logs.js';

export interface LayerAdminConfig extends LayerConfig {
  // Currently identical to LayerConfig, but allows future admin-specific options
}

export class LayerAdmin {
  private apiKey: string;
  private baseUrl: string;

  public gates: GatesResource;
  public keys: KeysResource;
  public logs: LogsResource;

  constructor(config: LayerAdminConfig) {
    if (!config.apiKey) {
      throw new Error('Layer API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'http://localhost:3001';

    this.gates = new GatesResource(this);
    this.keys = new KeysResource(this);
    this.logs = new LogsResource(this);
  }

  /** @internal */
  public async request<T>(options: RequestOptions): Promise<T> {
    const { method, path, body } = options;
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();

    if (!response.ok) {
      const error = data as ErrorResponse;
      throw new Error(error.message || error.error);
    }

    return data as T;
  }
}
