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
						transports: ["polling", "websocket"], // pollingを最初に試行
						upgrade: true, // pollingからwebsocketへのアップグレードを許可
						rememberUpgrade: true, // 成功したアップグレードを記憶
						reconnection: true,
						reconnectionAttempts: 10, // 再接続試行回数を増加
						reconnectionDelay: 1000, // 再接続間隔を短縮
						reconnectionDelayMax: 5000,
						timeout: 20000, // 接続タイムアウトを設定
						forceNew: false, // 既存の接続を再利用
					},
				);

				instance.on("connect", () => {
					console.log(`✅ Connected to WebSocket server ${instance?.id}`);
					console.log(`🔗 Transport: ${instance?.io.engine.transport.name}`);
				});

				instance.on("disconnect", (reason) => {
					console.log("🔌 Disconnected from WebSocket server:", reason);
				});

				instance.on("connect_error", (error) => {
					console.error("❌ WebSocket connection error:", error);
				});

				instance.on("reconnect", (attemptNumber) => {
					console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
				});

				instance.on("reconnect_error", (error) => {
					console.error("❌ Reconnection error:", error);
				});

				// トランスポートの変更を監視
				instance.io.engine.on("upgrade", () => {
					console.log(`⬆️ Upgraded to transport: ${instance?.io.engine.transport.name}`);
				});

				instance.io.engine.on("upgradeError", (error) => {
					console.error("❌ Transport upgrade error:", error);
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
