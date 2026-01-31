export interface LayerConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
}
