export interface LayerConfig {
  apiKey: string;
  baseUrl?: string; // api base url already defaults to localhost:3001, keeping this optional
  /**
   * Enable admin mode for mutation operations.
   * 
   * WARNING: Only set to true in setup scripts and IaC (infrastructure as code), and not in runtime code.
   * 
   * Admin mode enables: 
   * - layer.gates.create/udpate/delete()
   * - layer.keys.create/delete()
   * 
   * Read operations are always available without admin mode: 
   * - layer.gates.list/get()
   * - layer.keys.list()
   * - layer.complete()
   * 
   * @default false
   * @see https://docs.uselayer.ai/sdk/admin-mode
   */
  adminMode?: boolean;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; 
  path: string; 
  body?: unknown;
}