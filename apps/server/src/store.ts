import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import type { Bin, CapturedRequest } from './types';

const BIN_TTL_SECONDS = 60 * 60; // 1 hour
const MAX_REQUESTS_PER_BIN = 100;

// In-memory storage
const bins = new Map<string, Bin>();
const binRequests = new Map<string, CapturedRequest[]>();
const binTimers = new Map<string, NodeJS.Timeout>();

// Event emitter for pub/sub simulation
type Listener = (data: CapturedRequest) => void;
const listeners = new Map<string, Set<Listener>>();

export function generateSlug(length = 8): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += alphabet[bytes[i] % alphabet.length];
  }
  return slug;
}

export function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

export function createBin(): Bin {
  const slug = generateSlug();
  const now = Date.now();
  const bin: Bin = {
    slug,
    createdAt: now,
    expiresAt: now + BIN_TTL_SECONDS * 1000,
    requestCount: 0,
  };
  bins.set(slug, bin);
  binRequests.set(slug, []);

  // Auto-delete after TTL
  const timer = setTimeout(() => {
    deleteBin(slug);
  }, BIN_TTL_SECONDS * 1000);
  binTimers.set(slug, timer);

  return bin;
}

export function getBin(slug: string): Bin | null {
  const bin = bins.get(slug);
  if (!bin) return null;
  if (Date.now() > bin.expiresAt) {
    deleteBin(slug);
    return null;
  }
  return bin;
}

export function getBinRequests(slug: string): CapturedRequest[] {
  return binRequests.get(slug) || [];
}

export function addRequest(slug: string, request: CapturedRequest): boolean {
  const bin = getBin(slug);
  if (!bin) return false;

  const requests = binRequests.get(slug) || [];
  if (requests.length >= MAX_REQUESTS_PER_BIN) {
    requests.pop(); // Remove oldest
  }
  requests.unshift(request); // Add newest first
  binRequests.set(slug, requests);

  bin.requestCount++;
  bins.set(slug, bin);

  // Notify listeners
  const slugListeners = listeners.get(slug);
  if (slugListeners) {
    for (const listener of slugListeners) {
      listener(request);
    }
  }

  return true;
}

export function deleteBin(slug: string): boolean {
  const existed = bins.has(slug);
  bins.delete(slug);
  binRequests.delete(slug);
  
  const timer = binTimers.get(slug);
  if (timer) {
    clearTimeout(timer);
    binTimers.delete(slug);
  }

  // Notify listeners of expiry
  listeners.delete(slug);

  return existed;
}

export function clearBinRequests(slug: string): boolean {
  const bin = getBin(slug);
  if (!bin) return false;
  binRequests.set(slug, []);
  bin.requestCount = 0;
  bins.set(slug, bin);
  return true;
}

export function deleteRequest(slug: string, requestId: string): boolean {
  const requests = binRequests.get(slug);
  if (!requests) return false;
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return false;
  requests.splice(idx, 1);
  binRequests.set(slug, requests);
  
  const bin = bins.get(slug);
  if (bin) {
    bin.requestCount = requests.length;
    bins.set(slug, bin);
  }
  return true;
}

export function subscribe(slug: string, listener: Listener): () => void {
  if (!listeners.has(slug)) {
    listeners.set(slug, new Set());
  }
  listeners.get(slug)!.add(listener);

  return () => {
    const set = listeners.get(slug);
    if (set) {
      set.delete(listener);
      if (set.size === 0) listeners.delete(slug);
    }
  };
}

export function getActiveBinCount(): number {
  return bins.size;
}
