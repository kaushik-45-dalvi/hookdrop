import { create } from 'zustand';
import toast from 'react-hot-toast';

// === Types (inline to avoid monorepo path issues) ===
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

export const METHOD_COLORS: Record<string, string> = {
  POST: '#3b82f6',
  GET: '#22c55e',
  PUT: '#f59e0b',
  PATCH: '#a855f7',
  DELETE: '#ef4444',
  OPTIONS: '#6b7280',
  HEAD: '#6b7280',
};

// === Store Types ===
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';
type MethodFilter = string | null;

interface HookDropState {
  // Bin
  bin: Bin | null;
  binLoading: boolean;
  
  // Requests
  requests: CapturedRequest[];
  selectedRequestId: string | null;
  
  // Connection
  connectionStatus: ConnectionStatus;
  
  // UI
  methodFilter: MethodFilter;
  searchQuery: string;
  showDetailPanel: boolean;
  
  // Actions
  setBin: (bin: Bin | null) => void;
  setBinLoading: (loading: boolean) => void;
  setRequests: (requests: CapturedRequest[]) => void;
  addRequest: (request: CapturedRequest) => void;
  selectRequest: (id: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setMethodFilter: (method: MethodFilter) => void;
  setSearchQuery: (query: string) => void;
  setShowDetailPanel: (show: boolean) => void;
  clearRequests: () => void;
  deleteRequest: (id: string) => void;
  reset: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useStore = create<HookDropState>((set, get) => ({
  // Initial state
  bin: null,
  binLoading: false,
  requests: [],
  selectedRequestId: null,
  connectionStatus: 'disconnected',
  methodFilter: null,
  searchQuery: '',
  showDetailPanel: false,

  // Actions
  setBin: (bin) => set({ bin }),
  setBinLoading: (binLoading) => set({ binLoading }),
  setRequests: (requests) => set({ requests }),
  
  addRequest: (request) => set((state) => {
    const newRequests = [request, ...state.requests].slice(0, 100);
    const bin = state.bin ? { ...state.bin, requestCount: newRequests.length } : null;
    return { requests: newRequests, bin };
  }),
  
  selectRequest: (id) => set({ selectedRequestId: id, showDetailPanel: id !== null }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setMethodFilter: (methodFilter) => set({ methodFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setShowDetailPanel: (showDetailPanel) => set({ showDetailPanel }),
  
  clearRequests: () => set((state) => ({
    requests: [],
    selectedRequestId: null,
    showDetailPanel: false,
    bin: state.bin ? { ...state.bin, requestCount: 0 } : null,
  })),
  
  deleteRequest: (id) => set((state) => ({
    requests: state.requests.filter(r => r.id !== id),
    selectedRequestId: state.selectedRequestId === id ? null : state.selectedRequestId,
    showDetailPanel: state.selectedRequestId === id ? false : state.showDetailPanel,
    bin: state.bin ? { ...state.bin, requestCount: state.requests.length - 1 } : null,
  })),
  
  reset: () => set({
    bin: null,
    requests: [],
    selectedRequestId: null,
    connectionStatus: 'disconnected',
    methodFilter: null,
    searchQuery: '',
    showDetailPanel: false,
  }),
}));

// === API Functions ===

export async function createBin(): Promise<{ slug: string; webhookUrl: string; expiresAt: number }> {
  const res = await fetch(`${API_URL}/api/bin`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create bin');
  return res.json();
}

export async function fetchBin(slug: string): Promise<{ bin: Bin; requests: CapturedRequest[] }> {
  const res = await fetch(`${API_URL}/api/bin/${slug}`);
  if (!res.ok) throw new Error('Bin not found or expired');
  return res.json();
}

export async function deleteBinApi(slug: string): Promise<void> {
  await fetch(`${API_URL}/api/bin/${slug}`, { method: 'DELETE' });
}

export async function clearRequestsApi(slug: string): Promise<void> {
  await fetch(`${API_URL}/api/bin/${slug}/requests`, { method: 'DELETE' });
}

export async function deleteRequestApi(slug: string, requestId: string): Promise<void> {
  await fetch(`${API_URL}/api/bin/${slug}/requests/${requestId}`, { method: 'DELETE' });
}

// === WebSocket Manager ===

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;

export function connectWebSocket(slug: string) {
  const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001') + `/ws/${slug}`;
  
  if (ws) {
    ws.close();
  }

  useStore.getState().setConnectionStatus('connecting');
  reconnectAttempts = 0;

  function connect() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      useStore.getState().setConnectionStatus('connected');
      reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'request':
            useStore.getState().addRequest(data.data);
            // Notify if tab is not focused
            if (document.hidden && Notification.permission === 'granted') {
              new Notification('HookDrop', {
                body: `New ${data.data.method} request received`,
                icon: '/favicon.ico',
              });
            }
            break;
          case 'expiry_warning':
            toast('⏰ Bin expires in 5 minutes!', {
              duration: 8000,
              icon: '⚠️',
            });
            break;
          case 'bin_expired':
            toast.error('Session expired. Create a new bin.', { duration: 6000 });
            useStore.getState().setConnectionStatus('disconnected');
            break;
          case 'ping':
            ws?.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (err) {
        console.error('WS message parse error:', err);
      }
    };

    ws.onclose = () => {
      useStore.getState().setConnectionStatus('disconnected');
      
      // Exponential backoff reconnection
      if (reconnectAttempts < 10) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
        
        useStore.getState().setConnectionStatus('connecting');
        reconnectTimer = setTimeout(() => {
          connect();
          // Also re-fetch full state
          fetchBin(slug).then(({ requests }) => {
            useStore.getState().setRequests(requests);
          }).catch(() => {});
        }, delay);
      }
    };

    ws.onerror = (err) => {
      console.error('WS error:', err);
    };
  }

  connect();
}

export function disconnectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  reconnectAttempts = 10; // Prevent reconnection
}

// === Utility Functions ===

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 1000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function formatAbsoluteTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatCountdown(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'Expired';
  const min = Math.floor(diff / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  return `${min}m ${sec.toString().padStart(2, '0')}s`;
}

export function generateCurlCommand(request: CapturedRequest): string {
  let curl = `curl -X ${request.method}`;
  
  for (const [key, value] of Object.entries(request.headers)) {
    if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'content-length') {
      curl += ` \\\n  -H '${key}: ${value}'`;
    }
  }
  
  if (request.body) {
    curl += ` \\\n  -d '${request.body.replace(/'/g, "'\\''")}'`;
  }
  
  curl += ` \\\n  '${request.path}'`;
  
  return curl;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
