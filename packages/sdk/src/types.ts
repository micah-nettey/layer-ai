export interface LayerConfig {
  apiKey: string;
  baseUrl?: string; // api base url already defaults to localhost:3001, keeping this optional
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; 
  path: string; 
  body?: unknown;
}