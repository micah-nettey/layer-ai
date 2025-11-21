export interface LayerConfig {
  apiKey: string;
  baseUrl?: string; // api base url already defaults to localhost:3001, keeping this optional
}

export interface LayerError {
  error: string; 
  message: string;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'; 
  path: string; 
  body?: unknown;
}