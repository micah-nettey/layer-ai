// Key creation request
export interface CreateKeyRequest {
  name: string;
}

// key creation response
export interface CreateKeyResponse {
  id: string;
  name: string;
  key: string; // full key only returned on creation
  keyPrefix: string;
  createdAt: Date;
}
