"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { UserDataContext } from "@/app/contextProvider";
import { requestDB } from "@/services/axios";
import { useSocket } from "./useSocket";

// Constants
const POLLING_INTERVAL_MS = 30000;
const NOTIFICATIONS_LIMIT = 10;
const DEFAULT_FALLBACK_PATH = "/mypage";
const LOCALE = "ja-JP";

// Types - Renamed to avoid conflict with Browser Notification API
export interface AppNotification {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    relatedId: number | null;
    createdAt: string;
    roomKey?: string;
}

export type NotificationType =
    | "message"
    | "purchase"
    | "reminder"
    | "reschedule"
    | "cancel";

interface NotificationState {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;
    hasMore: boolean;
}

interface UseNotificationsReturn extends NotificationState {
    fetchNotifications: (reset?: boolean) => Promise<void>;
    markAsRead: (notificationId: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    loadMore: () => void;
}

const fetchRoomKey = async (roomId: number): Promise<string | null> => {
    try {
        const response = await fetch(`/api/message/room/${roomId}`);
        const roomData = await response.json();
        return roomData.success && roomData.data?.roomKey
            ? roomData.data.roomKey
            : null;
    } catch {
        return null;
    }
};

const enrichMessageNotifications = async (notifications: AppNotification[]): Promise<AppNotification[]> => {
    return Promise.all(
        notifications.map(async (notification) => {
            if (notification.type === "message" && notification.relatedId && !notification.roomKey) {
                const roomKey = await fetchRoomKey(notification.relatedId);
                return roomKey ? { ...notification, roomKey } : notification;
            }
            return notification;
        })
    );
};

export const useNotifications = (): UseNotificationsReturn => {
    const context = useContext(UserDataContext);
    if (!context) {
        throw new Error("useNotifications must be used within UserDataContext");
    }
    const { userData } = context;
    const { socket, isConnected } = useSocket();

    const [state, setState] = useState<NotificationState>({
        notifications: [],
        unreadCount: 0,
        loading: false,
        hasMore: true,
    });
    const [offset, setOffset] = useState(0);

    // Use ref to track loading state for stale closure prevention
    const loadingRef = useRef(false);
    const userDataRef = useRef(userData);
    const offsetRef = useRef(offset);

    // Keep refs in sync
    useEffect(() => {
        userDataRef.current = userData;
    }, [userData]);

    useEffect(() => {
        offsetRef.current = offset;
    }, [offset]);

    const fetchNotifications = useCallback(async (reset = false) => {
        if (!userDataRef.current || loadingRef.current) return;

        loadingRef.current = true;
        setState(prev => ({ ...prev, loading: true }));

        const currentOffset = reset ? 0 : offsetRef.current;

        try {
            const response = await requestDB("notification", "readNotificationsByUserId", {
                userId: userDataRef.current.id,
                limit: NOTIFICATIONS_LIMIT,
                offset: currentOffset,
            });

            if (response.success) {
                const enrichedNotifications = await enrichMessageNotifications(response.data);

                setState(prev => ({
                    ...prev,
                    notifications: reset
                        ? enrichedNotifications
                        : [...prev.notifications, ...enrichedNotifications],
                    hasMore: enrichedNotifications.length === NOTIFICATIONS_LIMIT,
                    unreadCount: reset
                        ? enrichedNotifications.filter((n: AppNotification) => !n.isRead).length
                        : prev.unreadCount,
                    loading: false,
                }));

                setOffset(reset ? NOTIFICATIONS_LIMIT : currentOffset + NOTIFICATIONS_LIMIT);
            } else {
                setState(prev => ({ ...prev, loading: false }));
            }
        } catch {
            setState(prev => ({ ...prev, loading: false }));
        } finally {
            loadingRef.current = false;
        }
    }, []);

    const markAsRead = useCallback(async (notificationId: number) => {
        try {
            await requestDB("notification", "markNotificationAsRead", {
                id: notificationId,
            });

            setState(prev => ({
                ...prev,
                notifications: prev.notifications.map(n =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, prev.unreadCount - 1),
            }));
        } catch {
            // Silent fail - notification will remain as unread
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        const currentUserData = userDataRef.current;
        if (!currentUserData) return;

        try {
            await requestDB("notification", "markAllNotificationsAsRead", {
                userId: currentUserData.id,
            });

            setState(prev => ({
                ...prev,
                notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0,
            }));
        } catch {
            // Silent fail
        }
    }, []);

    const loadMore = useCallback(() => {
        if (!loadingRef.current && state.hasMore) {
            fetchNotifications(false);
        }
    }, [state.hasMore, fetchNotifications]);

    // Initial fetch and polling
    useEffect(() => {
        if (!userData) return;

        fetchNotifications(true);
        const interval = setInterval(() => fetchNotifications(true), POLLING_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [userData, fetchNotifications]);

    // Socket.IO realtime notifications
    useEffect(() => {
        if (!socket || !userData || !isConnected) return;

        socket.emit("registerUser", { userId: userData.id });

        const handleNewNotification = (notificationData: AppNotification) => {
            setState(prev => ({
                ...prev,
                notifications: [notificationData, ...prev.notifications.slice(0, NOTIFICATIONS_LIMIT - 1)],
                unreadCount: prev.unreadCount + 1,
            }));

            // Browser notification
            if (typeof window !== "undefined") {
                const BrowserNotification = window.Notification;
                if (BrowserNotification && BrowserNotification.permission === "granted") {
                    new BrowserNotification(notificationData.title, {
                        body: notificationData.message,
                        icon: "/favicon.ico",
                    });
                }
            }
        };

        socket.on("newNotification", handleNewNotification);

        return () => {
            socket.off("newNotification", handleNewNotification);
        };
    }, [socket, userData, isConnected]);

    // Request browser notification permission
    useEffect(() => {
        if (userData && typeof window !== "undefined") {
            const BrowserNotification = window.Notification;
            if (BrowserNotification && BrowserNotification.permission === "default") {
                BrowserNotification.requestPermission();
            }
        }
    }, [userData]);

    return {
        ...state,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        loadMore,
    };
};

// Helper function to get navigation path for notification type
export const getNotificationPath = async (notification: AppNotification): Promise<string> => {
    const pathMap: Record<NotificationType, string> = {
        purchase: "/mypage/coach/upcoming",
        reminder: "/mypage/courses/upcoming",
        reschedule: "/mypage/courses/upcoming",
        cancel: "/mypage/courses/upcoming",
        message: "/mypage/message",
    };

    if (notification.type === "message") {
        if (notification.roomKey) {
            return `/mypage/message/${notification.roomKey}`;
        }
        if (notification.relatedId) {
            const roomKey = await fetchRoomKey(notification.relatedId);
            if (roomKey) {
                return `/mypage/message/${roomKey}`;
            }
        }
        return "/mypage/message";
    }

    if (notification.relatedId && pathMap[notification.type]) {
        return pathMap[notification.type];
    }

    return DEFAULT_FALLBACK_PATH;
};

// Export locale constant for consistent formatting
export { LOCALE };
