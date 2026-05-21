import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createBin,
  getBin,
  getBinRequests,
  addRequest,
  deleteBin,
  clearBinRequests,
  deleteRequest,
  hashIP,
} from './store';
import type { CapturedRequest } from '@hookdrop/types';

export const apiRouter = Router();
export const webhookRouter = Router();

// === API Routes ===

// Create a new bin
apiRouter.post('/bin', (_req: Request, res: Response) => {
  const bin = createBin();
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
  res.status(201).json({
    slug: bin.slug,
    webhookUrl: `${baseUrl}/h/${bin.slug}`,
    expiresAt: bin.expiresAt,
  });
});

// Get bin details + all requests
apiRouter.get('/bin/:slug', (req: Request, res: Response) => {
  const bin = getBin(req.params.slug);
  if (!bin) {
    res.status(404).json({ error: 'Bin not found or expired' });
    return;
  }
  const requests = getBinRequests(req.params.slug);
  res.json({ bin, requests });
});

// Delete a bin
apiRouter.delete('/bin/:slug', (req: Request, res: Response) => {
  const deleted = deleteBin(req.params.slug);
  if (!deleted) {
    res.status(404).json({ error: 'Bin not found or expired' });
    return;
  }
  res.json({ deleted: true });
});

// Clear all requests from a bin
apiRouter.delete('/bin/:slug/requests', (req: Request, res: Response) => {
  const cleared = clearBinRequests(req.params.slug);
  if (!cleared) {
    res.status(404).json({ error: 'Bin not found or expired' });
    return;
  }
  res.json({ cleared: true });
});

// Delete individual request
apiRouter.delete('/bin/:slug/requests/:requestId', (req: Request, res: Response) => {
  const deleted = deleteRequest(req.params.slug, req.params.requestId);
  if (!deleted) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }
  res.json({ deleted: true });
});

// === Webhook Capture Route ===

// Capture ALL HTTP methods on /h/:slug
webhookRouter.all('/:slug', (req: Request, res: Response) => {
  const bin = getBin(req.params.slug);
  if (!bin) {
    res.status(404).json({ error: 'Bin not found or expired' });
    return;
  }

  // Build captured request
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  
  let bodyParsed: object | null = null;
  try {
    if (rawBody && rawBody.trim()) {
      bodyParsed = JSON.parse(rawBody);
    }
  } catch {
    bodyParsed = null;
  }

  // Extract query params
  const queryParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.query)) {
    queryParams[key] = String(value);
  }

  // Extract headers (redact Authorization)
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() === 'authorization') {
      headers[key] = '[REDACTED]';
    } else {
      headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
    }
  }

  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  const captured: CapturedRequest = {
    id: uuidv4(),
    binSlug: req.params.slug,
    timestamp: Date.now(),
    method: req.method,
    path: req.originalUrl,
    queryParams,
    headers,
    body: rawBody || null,
    bodyParsed,
    contentType: (req.headers['content-type'] as string) || '',
    size: rawBody ? Buffer.byteLength(rawBody) : 0,
    clientIpHash: hashIP(clientIp),
  };

  addRequest(req.params.slug, captured);

  res.status(200).json({ received: true });
});
