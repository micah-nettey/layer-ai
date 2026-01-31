import type { LayerAdmin } from '../client.js';
import type { Log, ListLogOptions } from '@layer-ai/sdk';

export class LogsResource {
  constructor(private client: LayerAdmin) {}

  async list(options?: ListLogOptions): Promise<Log[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.gate) params.set('gate', options.gate);
    if (options?.offset) params.set('offset', options.offset.toString());

    const query = params.toString();
    const path = query ? `/v1/logs?${query}` : '/v1/logs';

    return this.client.request<Log[]>({
      method: 'GET',
      path,
    });
  }
}
