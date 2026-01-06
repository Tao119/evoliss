"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface SocketContextType {
	socket: Socket | null;
	isConnected: boolean;
	send: (event: string, data: any) => void;
}

const socketSingleton = (() => {
	let instance: Socket | null = null;
	let initPromise: Promise<Socket> | null = null;

	const initializeServer = async () => {
		try {
			const serverUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
			const response = await fetch(`${serverUrl}/api/socket`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			console.log("🔧 Socket.IO server initialization response:", await response.json());
		} catch (error) {
			console.warn("⚠️ Failed to initialize Socket.IO server:", error);
		}
	};

	return {
		getInstance: () => {
			if (instance && instance.connected) {
				return Promise.resolve(instance);
			}

			if (initPromise) {
				return initPromise;
			}

			initPromise = (async () => {
				console.log("🌐 Creating new Socket.IO connection...");

				// サーバーの初期化を確実にする
				await initializeServer();

				const serverUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
				instance = io(serverUrl, {
					path: "/api/socket",
					transports: ["polling", "websocket"], // pollingを優先
					upgrade: true,
					rememberUpgrade: false, // 本番環境では無効化
					timeout: 30000, // タイムアウトを延長
					forceNew: false,
					reconnection: true,
					reconnectionAttempts: 10, // 再接続試行回数を増加
					reconnectionDelay: 2000,
					reconnectionDelayMax: 10000,
					// 本番環境用の追加設定
					autoConnect: true,
					withCredentials: true
				});

				instance.on("connect", () => {
					console.log("✅ Socket.IO connected");
				});

				instance.on("disconnect", (reason) => {
					console.log("🔌 Socket.IO disconnected:", reason);
				});

				instance.on("connect_error", (error) => {
					console.error("❌ Socket.IO connection error:", error);
				});

				instance.on("reconnect", (attemptNumber) => {
					console.log("🔄 Socket.IO reconnected after", attemptNumber, "attempts");
				});

				instance.on("reconnect_error", (error) => {
					console.error("❌ Socket.IO reconnection error:", error);
				});

				// カスタムイベントリスナー
				instance.on("newMessage", (data) => {
					console.log("📨 New message received:", data);
					window.dispatchEvent(new CustomEvent('socket-message', { detail: { type: 'newMessage', data } }));
				});

				instance.on("messagesRead", (data) => {
					console.log("👁️ Messages read:", data);
					window.dispatchEvent(new CustomEvent('socket-message', { detail: { type: 'messagesRead', data } }));
				});

				instance.on("newNotification", (data) => {
					console.log("🔔 New notification:", data);
					window.dispatchEvent(new CustomEvent('socket-message', { detail: { type: 'newNotification', data } }));
				});

				return instance;
			})();

			return initPromise;
		},
		send: (event: string, data: any) => {
			socketSingleton.getInstance().then(socketInstance => {
				if (socketInstance && socketInstance.connected) {
					socketInstance.emit(event, data);
					console.log(`📤 Socket.IO event sent: ${event}`, data);
				} else {
					console.warn("⚠️ Socket.IO not connected, event not sent:", event, data);
				}
			});
		}
	};
})();

export const useSocket = (): SocketContextType => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		const initSocket = async () => {
			try {
				const socketInstance = await socketSingleton.getInstance();
				setSocket(socketInstance);

				const updateConnectionStatus = () => {
					setIsConnected(socketInstance?.connected ?? false);
				};

				// 接続状態を定期的にチェック
				const interval = setInterval(updateConnectionStatus, 1000);
				updateConnectionStatus();

				return () => {
					clearInterval(interval);
				};
			} catch (error) {
				console.error("Failed to initialize socket:", error);
			}
		};

		initSocket();
	}, []);

	return {
		socket,
		isConnected,
		send: socketSingleton.send
	};
};
