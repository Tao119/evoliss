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

	return {
		getInstance: () => {
			if (!instance || !instance.connected) {
				console.log("🌐 Creating new Socket.IO connection...");

				const serverUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
				instance = io(serverUrl, {
					path: "/api/socket",
					transports: ["websocket", "polling"],
					upgrade: true,
					rememberUpgrade: true,
					timeout: 20000,
					forceNew: false,
					reconnection: true,
					reconnectionAttempts: 5,
					reconnectionDelay: 1000,
					reconnectionDelayMax: 5000
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
			}
			return instance;
		},
		send: (event: string, data: any) => {
			const socket = socketSingleton.getInstance();
			if (socket && socket.connected) {
				socket.emit(event, data);
				console.log(`📤 Socket.IO event sent: ${event}`, data);
			} else {
				console.warn("⚠️ Socket.IO not connected, event not sent:", event, data);
			}
		}
	};
})();

export const useSocket = (): SocketContextType => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		const socketInstance = socketSingleton.getInstance();
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
	}, []);

	return {
		socket,
		isConnected,
		send: socketSingleton.send
	};
};
