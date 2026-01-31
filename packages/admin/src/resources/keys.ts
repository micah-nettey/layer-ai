import type { LayerAdmin } from '../client.js';
import type {
  ApiKey,
  CreateKeyRequest,
  CreateKeyResponse,
} from '@layer-ai/sdk';

export class KeysResource {
  constructor(private client: LayerAdmin) {}

  /**
   * Create a new API key.
   */
  async create(data: CreateKeyRequest): Promise<CreateKeyResponse> {
    return this.client.request<CreateKeyResponse>({
      method: 'POST',
      path: '/v1/keys',
      body: data,
    });
  }

  /**
   * List all API keys.
   */
  async list(): Promise<ApiKey[]> {
    return this.client.request<ApiKey[]>({
      method: 'GET',
      path: '/v1/keys',
    });
  }

  /**
   * Delete an existing key.
   */
  async delete(id: string): Promise<void> {
    await this.client.request<void>({
      method: 'DELETE',
      path: `/v1/keys/${id}`,
    });
  }
}
