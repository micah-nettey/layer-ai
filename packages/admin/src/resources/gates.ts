import type { LayerAdmin } from '../client.js';
import type {
  Gate,
  CreateGateRequest,
  UpdateGateRequest,
  TaskAnalysis,
} from '@layer-ai/sdk';

export class GatesResource {
  constructor(private client: LayerAdmin) {}

  /**
   * Lists all gates
   */
  async list(): Promise<Gate[]> {
    return this.client.request<Gate[]>({
      method: 'GET',
      path: '/v1/gates',
    });
  }

  /**
   * Gets a specific gate by ID
   */
  async get(id: string): Promise<Gate> {
    return this.client.request<Gate>({
      method: 'GET',
      path: `/v1/gates/${id}`,
    });
  }

  /**
   * Create a new gate.
   */
  async create(data: CreateGateRequest): Promise<Gate> {
    return this.client.request<Gate>({
      method: 'POST',
      path: '/v1/gates',
      body: data,
    });
  }

  /**
   * Update an existing gate.
   */
  async update(id: string, data: UpdateGateRequest): Promise<Gate> {
    return this.client.request<Gate>({
      method: 'PATCH',
      path: `/v1/gates/${id}`,
      body: data,
    });
  }

  /**
   * Get AI-powered model suggestions for a gate.
   *
   * Analyzes the gate's task description and returns suggested models
   * with confidence scores based on the task requirements.
   */
  async suggestions(id: string): Promise<TaskAnalysis> {
    return this.client.request<TaskAnalysis>({
      method: 'GET',
      path: `/v1/gates/${id}/suggestions`,
    });
  }

  /**
   * Deletes an existing.
   */
  async delete(id: string): Promise<void> {
    await this.client.request<void>({
      method: 'DELETE',
      path: `/v1/gates/${id}`,
    });
  }

  /**
   * Test a gate configuration with a sample request.
   *
   * Tests the primary model and optionally all fallback models.
   * Can test an unsaved configuration or a saved gate with optional overrides.
   */
  async test(data: {
    gateId?: string;
    gate?: Partial<CreateGateRequest>;
    messages: Array<{ role: string; content: string }>;
    quickTest?: boolean;
  }): Promise<{
    primary?: {
      model: string;
      success: boolean;
      latency: number;
      content?: string;
      error?: string;
    };
    fallback?: Array<{
      model: string;
      success: boolean;
      latency: number;
      content?: string;
      error?: string;
    }>;
  }> {
    return this.client.request({
      method: 'POST',
      path: '/v1/gates/test',
      body: data,
    });
  }
}
