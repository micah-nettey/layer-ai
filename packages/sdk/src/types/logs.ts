export interface Log {
  id: string;
  userId: string;
  gateId: string | null;
  gateName: string | null;
  modelRequested: string;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  latencyMs: number;
  success: number;
  errorMessage: string | null;
  loggedAt: Date;
}

export interface ListLogOptions {
  limit?: number;
  gate?: string;
  offset?: number;
}
