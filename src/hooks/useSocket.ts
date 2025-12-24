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
						transports: ["polling"], // pollingのみを使用
						upgrade: false, // WebSocketアップグレードを無効化
						reconnection: true,
						reconnectionAttempts: 10,
						reconnectionDelay: 1000,
						reconnectionDelayMax: 5000,
						timeout: 20000,
						forceNew: false,
					},
				);

				instance.on("connect", () => {
					console.log(`✅ Connected to Socket.io server ${instance?.id}`);
					console.log(`🔗 Transport: ${instance?.io.engine.transport.name}`);
				});

				instance.on("disconnect", (reason) => {
					console.log("🔌 Disconnected from Socket.io server:", reason);
				});

				instance.on("connect_error", (error) => {
					console.error("❌ Socket.io connection error:", error);
				});

				instance.on("reconnect", (attemptNumber) => {
					console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
				});

				instance.on("reconnect_error", (error) => {
					console.error("❌ Reconnection error:", error);
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
