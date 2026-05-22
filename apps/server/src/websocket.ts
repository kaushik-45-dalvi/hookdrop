import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { subscribe, getBin } from './store';
import type { CapturedRequest } from './types';

interface WSClient {
  ws: WebSocket;
  slug: string;
  unsubscribe: () => void;
}

const clients = new Map<WebSocket, WSClient>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade manually to extract slug from URL
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const match = url.pathname.match(/^\/ws\/([a-z0-9]+)$/);
    
    if (!match) {
      socket.destroy();
      return;
    }

    const slug = match[1];
    const bin = getBin(slug);
    
    if (!bin) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, slug);
    });
  });

  wss.on('connection', (ws: WebSocket, _request: any, slug: string) => {
    console.log(`🔌 WS client connected to bin: ${slug}`);

    // Subscribe to bin updates
    const unsubscribe = subscribe(slug, (request: CapturedRequest) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'request',
          data: request,
        }));
      }
    });

    const client: WSClient = { ws, slug, unsubscribe };
    clients.set(ws, client);

    // Send initial ping
    ws.send(JSON.stringify({ type: 'ping' }));

    // Keepalive ping every 30s
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    // Expiry warning timer
    const bin = getBin(slug);
    if (bin) {
      const warningTime = bin.expiresAt - 5 * 60 * 1000 - Date.now();
      if (warningTime > 0) {
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'expiry_warning',
              expiresAt: bin.expiresAt,
            }));
          }
        }, warningTime);
      }

      // Bin expired event
      const expiryTime = bin.expiresAt - Date.now();
      if (expiryTime > 0) {
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'bin_expired' }));
            ws.close();
          }
        }, expiryTime);
      }
    }

    // Handle messages from client
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'pong') {
          // Client responded to keepalive
        }
      } catch {
        // Ignore invalid messages
      }
    });

    ws.on('close', () => {
      console.log(`🔌 WS client disconnected from bin: ${slug}`);
      clearInterval(pingInterval);
      unsubscribe();
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error(`WS error for bin ${slug}:`, err.message);
      clearInterval(pingInterval);
      unsubscribe();
      clients.delete(ws);
    });
  });

  return wss;
}
