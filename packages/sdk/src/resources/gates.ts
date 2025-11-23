import type { Layer } from '../client.js';
import type { Gate, CreateGateRequest, UpdateGateRequest } from '@layer/types';

export class GatesResource {
  constructor(private client: Layer) {}

  async create(data: CreateGateRequest): Promise<Gate> {
    return this.client.request<Gate>({
      method: 'POST', 
      path: '/v1/gates',
      body: data,
    });
  }

  async list(): Promise<Gate[]> {
    return this.client.request<Gate[]>({
      method: 'GET',
      path: '/v1/gates',
    })
  }

  async get(id: string): Promise<Gate> {
    return this.client.request<Gate>({
      method: 'GET',
      path: `/v1/gates/${id}`,
    })
  }

  async update(id: string, data: UpdateGateRequest): Promise<Gate> {
    return this.client.request<Gate>({
      method: 'PATCH',
      path: `/v1/gates/${id}`,
      body: data,
    })
  }

  async delete(id: string): Promise<void> {
    await this.client.request<void>({
      method: 'DELETE',
      path: `/v1/gates/${id}`,
    })
  }
}