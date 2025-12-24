import type { Server as HttpServer } from "http";
import type { Socket as NetSocket } from "net";
import type { NextApiRequest } from "next";
import type { NextApiResponse } from "next";
import { WebSocketServer, WebSocket } from 'ws';

export type NextApiResponseWithSocket = NextApiResponse & {
    socket: NetSocket & {
        server: HttpServer & {
            wss?: WebSocketServer;
        };
    };
};

export default function handler(
    req: NextApiRequest,
    res: NextApiResponseWithSocket,
) {
    console.log(`🔌 WebSocket handler called: ${req.method} ${req.url}`);

    if (res.socket.server.wss) {
        console.log("⚡ WebSocket server is already running.");
        res.end();
        return;
    }

    console.log("🔌 Initializing WebSocket server...");

    // WebSocketサーバーを初期化
    const wss = new WebSocketServer({
        noServer: true,
        perMessageDeflate: false
    });

    res.socket.server.wss = wss;

    // WebSocketクライアント管理
    const clients = new Map<WebSocket, { roomKey?: string; userId?: number }>();

    // WebSocketアップグレードハンドラーを設定
    res.socket.server.on('upgrade', (request, socket, head) => {
        console.log('📡 WebSocket upgrade request received');
        console.log('Request URL:', request.url);

        if (request.url === '/api/websocket') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                console.log('✅ WebSocket connection established');

                // クライアント情報を初期化
                clients.set(ws, {});

                // 接続確認メッセージを送信
                ws.send(JSON.stringify({
                    type: 'connected',
                    message: 'WebSocket connected successfully'
                }));

                // メッセージハンドラー
                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        console.log('📨 Received WebSocket message:', message);
                        handleWebSocketMessage(ws, message, clients);
                    } catch (error) {
                        console.error('❌ Error parsing WebSocket message:', error);
                    }
                });

                // 切断ハンドラー
                ws.on('close', (code, reason) => {
                    console.log(`🔌 WebSocket client disconnected: ${code} ${reason}`);
                    clients.delete(ws);
                    console.log(`👥 Client removed. Total clients: ${clients.size}`);
                });

                // エラーハンドラー
                ws.on('error', (error) => {
                    console.error('❌ WebSocket error:', error);
                    clients.delete(ws);
                });

                // Ping/Pong for keep-alive
                const pingInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.ping();
                    } else {
                        clearInterval(pingInterval);
                    }
                }, 30000);

                ws.on('pong', () => {
                    console.log('🏓 Pong received');
                });

                console.log(`👥 WebSocket client added. Total clients: ${clients.size}`);
            });
        } else {
            console.log('❌ Invalid WebSocket URL:', request.url);
            socket.end('HTTP/1.1 404 Not Found\r\n\r\n');
        }
    });

    console.log('✅ WebSocket server initialized');
    res.end();
}

// WebSocketメッセージ処理
function handleWebSocketMessage(
    ws: WebSocket,
    message: any,
    clients: Map<WebSocket, { roomKey?: string; userId?: number }>
) {
    try {
        console.log('📨 WebSocket message received:', message);
        const clientInfo = clients.get(ws);
        if (!clientInfo) return;

        switch (message.type) {
            case 'joinRoom':
                clientInfo.roomKey = message.roomKey;
                clientInfo.userId = message.userId;
                console.log(`📢 User ${message.userId} joined room: ${message.roomKey}`);
                break;

            case 'sendMessage':
                clients.forEach((otherClientInfo, otherWs) => {
                    if (otherWs !== ws &&
                        otherClientInfo.roomKey === clientInfo.roomKey &&
                        otherWs.readyState === WebSocket.OPEN) {
                        otherWs.send(JSON.stringify({
                            type: 'newMessage',
                            data: message.data
                        }));
                    }
                });
                break;

            case 'markAsRead':
                clients.forEach((otherClientInfo, otherWs) => {
                    if (otherWs !== ws &&
                        otherClientInfo.roomKey === clientInfo.roomKey &&
                        otherWs.readyState === WebSocket.OPEN) {
                        otherWs.send(JSON.stringify({
                            type: 'messagesRead',
                            roomKey: message.roomKey
                        }));
                    }
                });
                break;

            case 'sendNotification':
                clients.forEach((otherClientInfo, otherWs) => {
                    if (otherClientInfo.userId === message.userId &&
                        otherWs.readyState === WebSocket.OPEN) {
                        otherWs.send(JSON.stringify({
                            type: 'newNotification',
                            data: message.data
                        }));
                    }
                });
                break;

            default:
                console.log(`ℹ️ Unknown message type: ${message.type}`);
        }
    } catch (error) {
        console.error('❌ Error processing WebSocket message:', error);
    }
}