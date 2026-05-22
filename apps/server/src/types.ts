export interface Bin {
  slug: string;
  createdAt: number;
  expiresAt: number;
  requestCount: number;
}

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
