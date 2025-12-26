import type { NextApiRequest } from "next";
import type { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import type { Socket as NetSocket } from "net";

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

	if (res.socket.server.io) {
		console.log("⚡ Socket.IO server is already running.");
		res.end();
		return;
	}

	console.log("🔌 Initializing Socket.IO server...");

	const io = new SocketIOServer(res.socket.server, {
		path: "/api/socket",
		addTrailingSlash: false,
		cors: {
			origin: ["https://evoliss.jp", "http://localhost:3000"],
			methods: ["GET", "POST"],
			credentials: true
		},
		transports: ["websocket", "polling"],
		allowEIO3: true
	});

	res.socket.server.io = io;

	io.on("connection", (socket) => {
		console.log(`✅ Socket.IO client connected: ${socket.id}`);

		// ルーム参加
		socket.on("joinRoom", ({ roomKey, userId }) => {
			socket.join(roomKey);
			socket.data.roomKey = roomKey;
			socket.data.userId = userId;
			console.log(`📢 User ${userId} joined room: ${roomKey}`);
		});

		// メッセージ送信
		socket.on("sendMessage", (data) => {
			const roomKey = socket.data.roomKey;
			if (roomKey) {
				socket.to(roomKey).emit("newMessage", data);
				console.log(`📨 Message sent to room ${roomKey}:`, data);
			}
		});

		// 既読マーク
		socket.on("markAsRead", ({ roomKey }) => {
			socket.to(roomKey).emit("messagesRead", { roomKey });
			console.log(`👁️ Messages marked as read in room: ${roomKey}`);
		});

		// 通知送信
		socket.on("sendNotification", ({ userId, data }) => {
			// 特定のユーザーに通知を送信
			io.sockets.sockets.forEach((clientSocket) => {
				if (clientSocket.data.userId === userId) {
					clientSocket.emit("newNotification", data);
				}
			});
			console.log(`🔔 Notification sent to user ${userId}:`, data);
		});

		// 切断処理
		socket.on("disconnect", (reason) => {
			console.log(`🔌 Socket.IO client disconnected: ${socket.id}, reason: ${reason}`);
		});

		// エラーハンドリング
		socket.on("error", (error) => {
			console.error(`❌ Socket.IO error for ${socket.id}:`, error);
		});
	});

	console.log("✅ Socket.IO server initialized");
	res.end();
}