"use client";

import { useEffect, useState } from "react";

export interface SocketContextType {
	socket: WebSocket | null;
	isConnected: boolean;
	send: (data: any) => void;
}

const socketSingleton = (() => {
	let instance: WebSocket | null = null;

	return {
		getInstance: () => {
			if (!instance || instance.readyState === WebSocket.CLOSED) {
				console.log("🌐 Creating new WebSocket connection...");

				const wsUrl = process.env.NEXT_PUBLIC_APP_URL?.replace('https://', 'wss://').replace('http://', 'ws://') ?? "ws://localhost:3000";
				instance = new WebSocket(`${wsUrl}/api/websocket`);

				instance.onopen = () => {
					console.log("✅ WebSocket connected");
				};

				instance.onclose = (event) => {
					console.log("🔌 WebSocket disconnected:", event.code, event.reason);
					// 自動再接続
					setTimeout(() => {
						if (instance?.readyState === WebSocket.CLOSED) {
							instance = null;
							socketSingleton.getInstance();
						}
					}, 3000);
				};

				instance.onerror = (error) => {
					console.error("❌ WebSocket error:", error);
				};

				instance.onmessage = (event) => {
					try {
						const data = JSON.parse(event.data);
						console.log("📨 WebSocket message received:", data);
						// カスタムイベントを発火してコンポーネントに通知
						window.dispatchEvent(new CustomEvent('websocket-message', { detail: data }));
					} catch (error) {
						console.error("❌ Failed to parse WebSocket message:", error);
					}
				};
			}
			return instance;
		},
		send: (data: any) => {
			const ws = socketSingleton.getInstance();
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify(data));
			} else {
				console.warn("⚠️ WebSocket not connected, message not sent:", data);
			}
		}
	};
})();

export const useSocket = (): SocketContextType => {
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		const socketInstance = socketSingleton.getInstance();
		setSocket(socketInstance);

		const updateConnectionStatus = () => {
			setIsConnected(socketInstance?.readyState === WebSocket.OPEN);
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
