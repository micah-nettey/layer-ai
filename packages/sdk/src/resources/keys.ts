import type { Layer } from '../client.js';
import type { ApiKey, CreateKeyRequest, CreateKeyResponse } from '@layer-ai/types';

export class KeysResource {
  constructor(private client: Layer) {}

  /**
   * Create a new API key.
   *
   * Requires `adminMode: true` in Layer constructor.
   *
   * @throws Error if adminMode is not enabled
   * @see https://docs.uselayer.ai/sdk/admin-mode
   */
  async create(data: CreateKeyRequest): Promise<CreateKeyResponse> {
    this.client.checkAdminMode();
    return this.client.request<CreateKeyResponse> ({
      method: 'POST',
      path: '/v1/keys',
      body: data,
    })
  }

  /**
   * List all API keys.
   * No admin mode required.
   */
  async list(): Promise<ApiKey[]> {
    return this.client.request<ApiKey[]>({
      method: 'GET', 
      path: '/v1/keys',
    })
  }

   /**
   * Delete an existint key.
   *
   * Requires `adminMode: true` in Layer constructor.
   *
   * @throws Error if adminMode is not enabled
   * @see https://docs.uselayer.ai/sdk/admin-mode
   */
  async delete(id: string): Promise<void> {
    this.client.checkAdminMode();
    await this.client.request<void>({
      method: 'DELETE',
      path: `/v1/keys/${id}`,
    })
  }
}