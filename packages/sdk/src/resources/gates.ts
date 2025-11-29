import type { Layer } from '../client.js';
import type { Gate, CreateGateRequest, UpdateGateRequest } from '@layer-ai/types';

export class GatesResource {
  constructor(private client: Layer) {}

  /**
   * Create a new gate.
   *
   * Requires `adminMode: true` in Layer constructor.
   *
   * @throws Error if adminMode is not enabled
   * @see https://docs.uselayer.ai/sdk/admin-mode
   */
  async create(data: CreateGateRequest): Promise<Gate> {
    this.client.checkAdminMode();
    return this.client.request<Gate>({
      method: 'POST', 
      path: '/v1/gates',
      body: data,
    });
  }

  /**
   * Lists all gates
   * No admin mode required.
   */
  async list(): Promise<Gate[]> {
    return this.client.request<Gate[]>({
      method: 'GET',
      path: '/v1/gates',
    })
  }

  /**
   * Gets a specific gate by name
   * No admin mode required.
   */
  async get(id: string): Promise<Gate> {
    return this.client.request<Gate>({
      method: 'GET',
      path: `/v1/gates/${id}`,
    })
  }

  /**
   * Update an existing gate.
   *
   * ⚠️ Requires `adminMode: true` in Layer constructor.
   *
   * @throws Error if adminMode is not enabled
   * @see https://docs.uselayer.ai/sdk/admin-mode
   */
  async update(id: string, data: UpdateGateRequest): Promise<Gate> {
    this.client.checkAdminMode();
    return this.client.request<Gate>({
      method: 'PATCH',
      path: `/v1/gates/${id}`,
      body: data,
    })
  }

  /**
   * Deletes an existing.
   *
   * ⚠️ Requires `adminMode: true` in Layer constructor.
   *
   * @throws Error if adminMode is not enabled
   * @see https://docs.uselayer.ai/sdk/admin-mode
   */
  async delete(id: string): Promise<void> {
    this.client.checkAdminMode();
    await this.client.request<void>({
      method: 'DELETE',
      path: `/v1/gates/${id}`,
    })
  }
}