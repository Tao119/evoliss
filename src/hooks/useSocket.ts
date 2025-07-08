"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Socket, io } from "socket.io-client";

export interface SocketContextType {
	socket: Socket | null;
	isConnected: boolean;
}

const socketSingleton = (() => {
	let instance: Socket | null = null;

	return {
		getInstance: () => {
			if (!instance) {
				console.log("🌐 Creating new WebSocket instance...");

				instance = io(
					process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
					{
						path: "/api/socket",
						transports: ["websocket", "polling"],
						reconnection: true,
						reconnectionAttempts: 5,
						reconnectionDelay: 3000,
					},
				);

				instance.on("connect", () => {
					console.log(`✅ Connected to WebSocket server ${instance?.id}`);
				});

				instance.on("disconnect", (reason) => {
					console.log("🔌 Disconnected from WebSocket server:", reason);
				});
			}
			return instance;
		},
	};
})();

export const useSocket = (): SocketContextType => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		const ensureSocketServer = async () => {
			try {
				console.log("🌐 Ensuring Socket.io server is running...");
				await fetch("/api/socket"); // 🔥 これで最初にサーバーを起動
			} catch (error) {
				console.error("❌ Failed to ensure Socket.io server:", error);
			}
		};

		ensureSocketServer();
		const socketInstance = socketSingleton.getInstance();
		setSocket(socketInstance);
		setIsConnected(socketInstance?.connected ?? false);

		return () => {
			console.log("🔌 WebSocket remains active, no new instance created.");
		};
	}, []);

	return { socket, isConnected };
};
