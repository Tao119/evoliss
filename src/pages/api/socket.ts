import type { Server as HttpServer } from "http";
import type { Socket as NetSocket } from "net";
import { requestDB } from "@/services/axios";
import type { NextApiRequest } from "next";
import type { NextApiResponse } from "next";
import { Server as SocketServer } from "socket.io";

export type NextApiResponseWithSocket = NextApiResponse & {
	socket: NetSocket & {
		server: HttpServer & {
			io?: SocketServer;
		};
	};
};

export default function handler(
	req: NextApiRequest,
	res: NextApiResponseWithSocket,
) {
	if (res.socket.server.io) {
		console.log("⚡ Socket.io is already running.");
		res.end();
		return;
	}

	console.log("🔌 Initializing Socket.io server...");

	const io = new SocketServer(res.socket.server, {
		path: "/api/socket",
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
		},
		transports: ["polling", "websocket"], // pollingを最初に許可
		allowUpgrades: true, // WebSocketへのアップグレードを許可
		pingTimeout: 60000, // ping タイムアウトを延長
		pingInterval: 25000, // ping 間隔を設定
		upgradeTimeout: 10000, // アップグレードタイムアウト
		maxHttpBufferSize: 1e6, // バッファサイズを設定
	});

	io.on("connection", (socket) => {
		console.log(`✅ A user connected: ${socket.id}`);

		socket.on("joinRoom", ({ roomKey, userId }) => {
			console.log(`📢 User ${socket.id} joined room: room-${roomKey}`);
			socket.join(`room-${roomKey}`);
			socket.join(`user-${userId}`);

			io.in(`room-${roomKey}`)
				.fetchSockets()
				.then((sockets) => {
					console.log(
						`👥 Users in room ${roomKey}:`,
						sockets.map((s) => s.id),
					);
				});
		});

		socket.on("sendMessage", async ({ data, roomKey }) => {
			try {
				io.in(`room-${roomKey}`)
					.fetchSockets()
					.then((sockets) => {
						console.log(
							`👀 Broadcasting newMessage to:`,
							sockets.map((s) => s.id),
						);
					});

				io.to(`room-${roomKey}`).emit("newMessage", data);
			} catch (error) {
				console.error("❌ Error sending message:", error);
			}
		});

		socket.on("markAsRead", async ({ userId, roomKey }) => {
			console.log("🟢 markAsRead received:", userId, roomKey);

			try {
				const result = await requestDB("message", "markMessagesAsRead", {
					userId,
					roomKey,
				});

				if (result.success) {
					console.log(`✅ Messages in room ${roomKey} marked as read`);
					io.to(`room-${roomKey}`).emit("messagesRead", { roomKey });
				} else {
					console.log("⚠️ Failed to mark messages as read");
				}
			} catch (error) {
				console.error("❌ Error marking messages as read:", error);
			}
		});

		socket.on("sendNotification", async ({ data, userId }) => {
			try {
				console.log(`🔔 Sending notification to user ${userId}`);

				io.to(`user-${userId}`).emit("newNotification", data);
			} catch (error) {
				console.error("❌ Error sending notification:", error);
			}
		});

		socket.on("disconnect", () => {
			console.log(`⚡ Client disconnected: ${socket.id}`);
		});
	});

	res.socket.server.io = io;
	res.end();
}
