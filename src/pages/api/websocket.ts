import type { Server as HttpServer } from "http";
import type { Socket as NetSocket } from "net";
import type { NextApiRequest } from "next";
import type { NextApiResponse } from "next";

export type NextApiResponseWithSocket = NextApiResponse & {
    socket: NetSocket & {
        server: HttpServer & {
            wsClients?: Set<any>;
        };
    };
};

export default function handler(
    req: NextApiRequest,
    res: NextApiResponseWithSocket,
) {
    if (res.socket.server.wsClients) {
        console.log("⚡ WebSocket server is already running.");
        res.end();
        return;
    }

    console.log("🔌 Initializing WebSocket upgrade handler...");

    // WebSocketクライアントのセットを初期化
    res.socket.server.wsClients = new Set();

    // WebSocketアップグレードハンドラーを設定
    res.socket.server.on('upgrade', (request, socket, head) => {
        console.log('📡 WebSocket upgrade request received');

        if (request.url === '/api/websocket') {
            // WebSocketハンドシェイク
            const key = request.headers['sec-websocket-key'];
            if (!key) {
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
                return;
            }
            const acceptKey = generateAcceptKey(key);

            const responseHeaders = [
                'HTTP/1.1 101 Switching Protocols',
                'Upgrade: websocket',
                'Connection: Upgrade',
                `Sec-WebSocket-Accept: ${acceptKey}`,
                '',
                ''
            ].join('\r\n');

            socket.write(responseHeaders);

            // WebSocketクライアントとして管理
            const wsClient = {
                socket,
                roomKey: null,
                userId: null,
                send: (data: any) => {
                    const frame = createWebSocketFrame(JSON.stringify(data));
                    socket.write(frame);
                }
            };

            res.socket.server.wsClients!.add(wsClient);

            socket.on('data', (buffer) => {
                try {
                    const message = parseWebSocketFrame(buffer);
                    if (message) {
                        handleWebSocketMessage(wsClient, message, res.socket.server.wsClients!);
                    }
                } catch (error) {
                    console.error('❌ Error parsing WebSocket frame:', error);
                }
            });

            socket.on('close', () => {
                console.log('⚡ WebSocket client disconnected');
                res.socket.server.wsClients!.delete(wsClient);
            });

            socket.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                res.socket.server.wsClients!.delete(wsClient);
            });

            // 接続確認メッセージを送信
            wsClient.send({ type: 'connected', message: 'WebSocket connected successfully' });
        }
    });

    res.end();
}

// WebSocketキー生成
function generateAcceptKey(key: string): string {
    const crypto = require('crypto');
    const WEBSOCKET_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    return crypto
        .createHash('sha1')
        .update(key + WEBSOCKET_MAGIC_STRING)
        .digest('base64');
}

// WebSocketフレーム作成
function createWebSocketFrame(data: string): Buffer {
    const payload = Buffer.from(data, 'utf8');
    const payloadLength = payload.length;

    let frame;
    if (payloadLength < 126) {
        frame = Buffer.allocUnsafe(2 + payloadLength);
        frame[0] = 0x81; // FIN + text frame
        frame[1] = payloadLength;
        payload.copy(frame, 2);
    } else if (payloadLength < 65536) {
        frame = Buffer.allocUnsafe(4 + payloadLength);
        frame[0] = 0x81;
        frame[1] = 126;
        frame.writeUInt16BE(payloadLength, 2);
        payload.copy(frame, 4);
    } else {
        frame = Buffer.allocUnsafe(10 + payloadLength);
        frame[0] = 0x81;
        frame[1] = 127;
        frame.writeUInt32BE(0, 2);
        frame.writeUInt32BE(payloadLength, 6);
        payload.copy(frame, 10);
    }

    return frame;
}

// WebSocketフレーム解析
function parseWebSocketFrame(buffer: Buffer): string | null {
    if (buffer.length < 2) return null;

    const firstByte = buffer[0];
    const secondByte = buffer[1];

    const opcode = firstByte & 0x0f;
    if (opcode === 0x08) return null; // Close frame

    const masked = (secondByte & 0x80) === 0x80;
    let payloadLength = secondByte & 0x7f;

    let offset = 2;
    if (payloadLength === 126) {
        payloadLength = buffer.readUInt16BE(offset);
        offset += 2;
    } else if (payloadLength === 127) {
        offset += 4; // Skip high 32 bits
        payloadLength = buffer.readUInt32BE(offset);
        offset += 4;
    }

    if (masked) {
        const maskKey = buffer.slice(offset, offset + 4);
        offset += 4;
        const payload = buffer.slice(offset, offset + payloadLength);

        for (let i = 0; i < payload.length; i++) {
            payload[i] ^= maskKey[i % 4];
        }

        return payload.toString('utf8');
    } else {
        return buffer.slice(offset, offset + payloadLength).toString('utf8');
    }
}

// WebSocketメッセージ処理
function handleWebSocketMessage(client: any, messageStr: string, clients: Set<any>) {
    try {
        const message = JSON.parse(messageStr);
        console.log('📨 WebSocket message received:', message);

        switch (message.type) {
            case 'joinRoom':
                client.roomKey = message.roomKey;
                client.userId = message.userId;
                console.log(`📢 User ${message.userId} joined room: ${message.roomKey}`);
                break;

            case 'sendMessage':
                clients.forEach((otherClient) => {
                    if (otherClient !== client &&
                        otherClient.roomKey === client.roomKey) {
                        otherClient.send({
                            type: 'newMessage',
                            data: message.data
                        });
                    }
                });
                break;

            case 'markAsRead':
                clients.forEach((otherClient) => {
                    if (otherClient !== client &&
                        otherClient.roomKey === client.roomKey) {
                        otherClient.send({
                            type: 'messagesRead',
                            roomKey: message.roomKey
                        });
                    }
                });
                break;

            case 'sendNotification':
                clients.forEach((otherClient) => {
                    if (otherClient.userId === message.userId) {
                        otherClient.send({
                            type: 'newNotification',
                            data: message.data
                        });
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