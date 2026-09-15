import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface ClientConnection {
  ws: WebSocket;
  roomId: string;
  role: 'host' | 'guest' | 'spectator';
  teamId?: string;
  isAlive: boolean;
}

interface RoomInfo {
  roomId: string;
  hostClient?: ClientConnection;
  guestClient?: ClientConnection;
  spectators: Set<ClientConnection>;
  latestMatchState?: any;
}

const rooms = new Map<string, RoomInfo>();

function getRoomStatePayload(room: RoomInfo) {
  return {
    type: 'room_state',
    roomId: room.roomId,
    hostConnected: !!(room.hostClient && room.hostClient.ws.readyState === WebSocket.OPEN),
    guestConnected: !!(room.guestClient && room.guestClient.ws.readyState === WebSocket.OPEN),
    hostTeamId: room.hostClient?.teamId || null,
    guestTeamId: room.guestClient?.teamId || null,
    spectatorCount: Array.from(room.spectators).filter(s => s.ws.readyState === WebSocket.OPEN).length,
    hasActiveMatch: !!room.latestMatchState,
  };
}

function broadcastToRoom(roomId: string, data: any, excludeWs?: WebSocket) {
  const room = rooms.get(roomId);
  if (!room) return;

  const payload = JSON.stringify(data);
  const clients: ClientConnection[] = [];
  if (room.hostClient) clients.push(room.hostClient);
  if (room.guestClient) clients.push(room.guestClient);
  room.spectators.forEach(s => clients.push(s));

  clients.forEach(client => {
    if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(payload);
      } catch (err) {
        console.error('Broadcast send error:', err);
      }
    }
  });
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  // Room status API
  app.get('/api/rooms', (req, res) => {
    const list = Array.from(rooms.entries()).map(([id, room]) => ({
      roomId: id,
      hostConnected: !!(room.hostClient && room.hostClient.ws.readyState === WebSocket.OPEN),
      guestConnected: !!(room.guestClient && room.guestClient.ws.readyState === WebSocket.OPEN),
      hostTeamId: room.hostClient?.teamId || null,
      guestTeamId: room.guestClient?.teamId || null,
      spectatorCount: Array.from(room.spectators).filter(s => s.ws.readyState === WebSocket.OPEN).length,
    }));
    res.json({ rooms: list });
  });

  // WebSocket server for real-time multiplayer & spectator mode
  const wss = new WebSocketServer({ server });

  // Heartbeat ping/pong timer
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket & { isAlive?: boolean }) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      try {
        ws.ping();
      } catch (e) {}
    });
  }, 25000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: WebSocket & { isAlive?: boolean }) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    let currentClient: ClientConnection | null = null;

    ws.on('message', (rawData: string) => {
      try {
        const msg = JSON.parse(rawData.toString());

        if (msg.type === 'ping') {
          ws.isAlive = true;
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (msg.type === 'join') {
          const { roomId, role, teamId } = msg;

          if (!rooms.has(roomId)) {
            rooms.set(roomId, {
              roomId,
              spectators: new Set(),
            });
          }

          const room = rooms.get(roomId)!;
          currentClient = { ws, roomId, role, teamId, isAlive: true };

          if (role === 'host') {
            room.hostClient = currentClient;
          } else if (role === 'guest') {
            room.guestClient = currentClient;
          } else {
            room.spectators.add(currentClient);
          }

          // Send confirmation to joining client
          ws.send(JSON.stringify({
            type: 'joined',
            roomId,
            role,
            teamId,
            roomState: getRoomStatePayload(room),
            latestMatchState: room.latestMatchState || null,
          }));

          // Broadcast updated room state to all players & spectators in room
          broadcastToRoom(roomId, getRoomStatePayload(room));

          // If there is already an active match running, send start_match to re-joining player or spectator
          if (room.latestMatchState) {
            ws.send(JSON.stringify({
              type: 'start_match',
              matchState: room.latestMatchState,
              homeTeamId: room.latestMatchState.homeTeam.id,
              awayTeamId: room.latestMatchState.awayTeam.id,
            }));
          }
        } else if (msg.type === 'start_match') {
          if (currentClient && currentClient.role === 'host') {
            const room = rooms.get(currentClient.roomId);
            if (room) {
              room.latestMatchState = msg.matchState;
              broadcastToRoom(currentClient.roomId, {
                type: 'start_match',
                matchState: msg.matchState,
                homeTeamId: msg.homeTeamId || msg.matchState.homeTeam.id,
                awayTeamId: msg.awayTeamId || msg.matchState.awayTeam.id,
              });
            }
          }
        } else if (msg.type === 'match_update') {
          if (currentClient) {
            const room = rooms.get(currentClient.roomId);
            if (room) {
              room.latestMatchState = msg.matchState;
            }
            broadcastToRoom(currentClient.roomId, msg, ws);
          }
        } else if (msg.type === 'manager_action') {
          if (currentClient) {
            broadcastToRoom(currentClient.roomId, msg, ws);
          }
        } else if (msg.type === 'tactic_change') {
          if (currentClient) {
            broadcastToRoom(currentClient.roomId, msg, ws);
          }
        }
      } catch (err) {
        console.error('WebSocket message processing error:', err);
      }
    });

    ws.on('close', () => {
      if (currentClient && rooms.has(currentClient.roomId)) {
        const room = rooms.get(currentClient.roomId)!;
        if (currentClient.role === 'host' && room.hostClient === currentClient) {
          room.hostClient = undefined;
        } else if (currentClient.role === 'guest' && room.guestClient === currentClient) {
          room.guestClient = undefined;
        } else {
          room.spectators.delete(currentClient);
        }

        broadcastToRoom(currentClient.roomId, getRoomStatePayload(room));

        // Delay room cleanup by 5 minutes so page refreshes don't drop active rooms
        const roomToCleanId = currentClient.roomId;
        setTimeout(() => {
          const checkRoom = rooms.get(roomToCleanId);
          if (checkRoom && !checkRoom.hostClient && !checkRoom.guestClient && checkRoom.spectators.size === 0) {
            rooms.delete(roomToCleanId);
          }
        }, 300000);
      }
    });
  });

  // Vite development vs production middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`i-SiM 1. Futbol Ligi sunucusu http://0.0.0.0:${PORT} adresinde aktif.`);
  });
}

startServer();
