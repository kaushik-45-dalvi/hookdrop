// === Bin Types ===
export interface Bin {
  slug: string;
  createdAt: number;
  expiresAt: number;
  requestCount: number;
}

// === Request Types ===
export interface CapturedRequest {
  id: string;
  binSlug: string;
  timestamp: number;
  method: string;
  path: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  body: string | null;
  bodyParsed: object | null;
  contentType: string;
  size: number;
  clientIpHash: string;
}

// === API Response Types ===
export interface CreateBinResponse {
  slug: string;
  webhookUrl: string;
  expiresAt: number;
}

export interface GetBinResponse {
  bin: Bin;
  requests: CapturedRequest[];
}

export interface ErrorResponse {
  error: string;
}

// === WebSocket Event Types ===
export type WSEventType = 'request' | 'expiry_warning' | 'bin_expired' | 'ping' | 'pong';

export interface WSRequestEvent {
  type: 'request';
  data: CapturedRequest;
}

export interface WSExpiryWarningEvent {
  type: 'expiry_warning';
  expiresAt: number;
}

export interface WSBinExpiredEvent {
  type: 'bin_expired';
}

export interface WSPingEvent {
  type: 'ping';
}

export interface WSPongEvent {
  type: 'pong';
}

export type WSServerEvent = WSRequestEvent | WSExpiryWarningEvent | WSBinExpiredEvent | WSPingEvent;
export type WSClientEvent = WSPongEvent;

// === HTTP Method Colors ===
export const METHOD_COLORS: Record<string, string> = {
  POST: '#3b82f6',
  GET: '#22c55e',
  PUT: '#f59e0b',
  PATCH: '#a855f7',
  DELETE: '#ef4444',
  OPTIONS: '#6b7280',
  HEAD: '#6b7280',
};

// === Constants ===
export const BIN_TTL_MS = 60 * 60 * 1000; // 1 hour
export const BIN_TTL_SECONDS = 60 * 60; // 1 hour
export const MAX_REQUESTS_PER_BIN = 100;
export const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB
export const SLUG_LENGTH = 8;
export const EXPIRY_WARNING_MS = 5 * 60 * 1000; // 5 minutes before expiry
