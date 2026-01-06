import type { NextApiRequest } from "next";
import type { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import type { Socket as NetSocket } from "net";
import { setSocketIOInstance } from "@/lib/notification/notificationService";

export type NextApiResponseWithSocket = NextApiResponse & {
	socket: NetSocket & {
		server: HttpServer & {
			io?: SocketIOServer;
		};
	};
};

export default function handler(
	req: NextApiRequest,
	res: NextApiResponseWithSocket,
) {
	console.log(`🔌 Socket.IO handler called: ${req.method} ${req.url}`);

	// CORSヘッダーを設定
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	if (req.method === 'OPTIONS') {
		res.status(200).end();
		return;
	}

	if (res.socket.server.io) {
		console.log("⚡ Socket.IO server is already running.");
		res.status(200).json({ success: true, message: "Socket.IO server running" });
		return;
	}

	console.log("🔌 Initializing Socket.IO server...");

	const io = new SocketIOServer(res.socket.server, {
		path: "/api/socket",
		addTrailingSlash: false,
		cors: {
			origin: ["https://evoliss.jp", "http://localhost:3000", "https://www.evoliss.jp"],
			methods: ["GET", "POST", "OPTIONS"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"]
		},
		transports: ["polling", "websocket"], // pollingを優先
		allowEIO3: true,
		pingTimeout: 60000,
		pingInterval: 25000,
		upgradeTimeout: 30000,
		maxHttpBufferSize: 1e6,
		// 本番環境用の追加設定
		serveClient: false,
		cookie: false
	});

	res.socket.server.io = io;

	// 通知サービスにSocket.IOインスタンスを設定
	setSocketIOInstance(io);

	io.on("connection", (socket) => {
		console.log(`✅ Socket.IO client connected: ${socket.id}`);

		// ユーザー接続時のログ
		socket.on("joinRoom", ({ roomKey, userId }) => {
			socket.join(roomKey);
			socket.data.roomKey = roomKey;
			socket.data.userId = userId;
			console.log(`📢 User ${userId} joined room: ${roomKey} (Socket: ${socket.id})`);
		});

		// ユーザー登録（通知用）
		socket.on("registerUser", ({ userId }) => {
			socket.data.userId = userId;
			console.log(`👤 User ${userId} registered for notifications (Socket: ${socket.id})`);
		});

		// メッセージ送信
		socket.on("sendMessage", (data) => {
			const roomKey = socket.data.roomKey;
			if (roomKey) {
				socket.to(roomKey).emit("newMessage", data);
				console.log(`📨 Message sent to room ${roomKey}:`, data);
			} else {
				console.warn(`⚠️ No room key for socket ${socket.id}`);
			}
		});

		// 既読マーク
		socket.on("markAsRead", ({ roomKey }) => {
			socket.to(roomKey).emit("messagesRead", { roomKey });
			console.log(`👁️ Messages marked as read in room: ${roomKey}`);
		});

		// 通知送信
		socket.on("sendNotification", ({ userId, data }) => {
			console.log(`🔔 Attempting to send notification to user ${userId}:`, data);
			let notificationSent = false;

			// 特定のユーザーに通知を送信
			io.sockets.sockets.forEach((clientSocket) => {
				if (clientSocket.data.userId === userId) {
					clientSocket.emit("newNotification", data);
					console.log(`📡 Notification sent to user ${userId} via socket ${clientSocket.id}`);
					notificationSent = true;
				}
			});

			if (!notificationSent) {
				console.warn(`⚠️ No active socket found for user ${userId}`);
			}
		});

		// 切断処理
		socket.on("disconnect", (reason) => {
			console.log(`🔌 Socket.IO client disconnected: ${socket.id}, reason: ${reason}, userId: ${socket.data.userId}`);
		});

		// エラーハンドリング
		socket.on("error", (error) => {
			console.error(`❌ Socket.IO error for ${socket.id}:`, error);
		});
	});

	console.log("✅ Socket.IO server initialized");
	res.status(200).json({ success: true, message: "Socket.IO server initialized" });
}