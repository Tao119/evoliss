"use client";

import { useContext, useEffect, useState } from "react";
import { UserDataContext } from "../contextProvider";
import { requestDB } from "@/services/axios";
import { ImageBox } from "@/components/imageBox";
import notificationIcon from "@/assets/image/notification.svg";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    relatedId: number | null;
    createdAt: string;
}

export const NotificationBell = () => {
    const { userData } = useContext(UserDataContext)!;
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const router = useRouter();
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (userData) {
            fetchNotifications(true);
            // 30秒ごとに通知を更新
            const interval = setInterval(() => fetchNotifications(true), 30000);
            return () => clearInterval(interval);
        }
    }, [userData]);

    // Socket.IOからのリアルタイム通知を受信
    useEffect(() => {
        if (!socket || !userData || !isConnected) return;

        // ユーザーを通知用に登録
        socket.emit("registerUser", { userId: userData.id });
        console.log(`👤 Registered user ${userData.id} for notifications`);

        const handleNewNotification = (notificationData: any) => {
            console.log("🔔 Received realtime notification:", notificationData);

            // 通知リストを更新
            setNotifications(prev => [notificationData, ...prev.slice(0, 9)]);
            setUnreadCount(prev => prev + 1);

            // ブラウザ通知を表示（権限がある場合）
            if (Notification.permission === "granted") {
                new Notification(notificationData.title, {
                    body: notificationData.message,
                    icon: "/favicon.ico",
                });
            }
        };

        socket.on("newNotification", handleNewNotification);

        return () => {
            socket.off("newNotification", handleNewNotification);
        };
    }, [socket, userData, isConnected]);

    // ブラウザ通知の許可を要求
    useEffect(() => {
        if (userData && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, [userData]);

    const fetchNotifications = async (reset = false) => {
        if (!userData || loading) return;

        setLoading(true);
        const currentOffset = reset ? 0 : offset;

        try {
            const response = await requestDB("notification", "readNotificationsByUserId", {
                userId: userData.id,
                limit: 10,
                offset: currentOffset,
            });

            if (response.success) {
                const newNotifications = response.data;

                if (reset) {
                    setNotifications(newNotifications);
                    setOffset(10);
                } else {
                    setNotifications(prev => [...prev, ...newNotifications]);
                    setOffset(prev => prev + 10);
                }

                setHasMore(newNotifications.length === 10);

                if (reset) {
                    const unread = newNotifications.filter((n: Notification) => !n.isRead).length;
                    setUnreadCount(unread);
                }
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // 未読の場合は既読にする
        if (!notification.isRead) {
            try {
                await requestDB("notification", "markNotificationAsRead", {
                    id: notification.id,
                });

                // ローカル状態を更新
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notification.id ? { ...n, isRead: true } : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        }

        // 通知タイプに応じて遷移
        if (notification.type === "message" && notification.relatedId) {
            // メッセージ通知の場合、roomIdからroomKeyを取得してメッセージページに遷移
            try {
                const response = await fetch(`/api/message/room/${notification.relatedId}`);
                const roomData = await response.json();

                if (roomData.success && roomData.data) {
                    router.push(`/mypage/message/${roomData.data.roomKey}`);
                } else {
                    router.push("/mypage/message");
                }
            } catch (error) {
                console.error("Failed to get room key:", error);
                router.push("/mypage/message");
            }
        } else if (notification.type === "purchase" && notification.relatedId) {
            router.push("/mypage/coach/upcoming");
        } else if (notification.type === "reminder" && notification.relatedId) {
            router.push("/mypage/courses/upcoming");
        } else if (notification.type === "reschedule" && notification.relatedId) {
            router.push("/mypage/courses/upcoming");
        } else if (notification.type === "cancel" && notification.relatedId) {
            router.push("/mypage/courses/upcoming");
        } else {
            // デフォルトはマイページ
            router.push("/mypage");
        }

        setShowDropdown(false);
    };

    const markAllAsRead = async () => {
        try {
            await requestDB("notification", "markAllNotificationsAsRead", {
                userId: userData?.id,
            });

            // ローカル状態を更新
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const loadMoreNotifications = () => {
        if (!loading && hasMore) {
            fetchNotifications(false);
        }
    };

    if (!userData) return null;

    return (
        <div className="c-notification-bell">
            <div
                className="c-notification-bell__icon-wrapper"
                onClick={() => setShowDropdown(!showDropdown)}
            >
                <ImageBox
                    src={notificationIcon}
                    className="c-notification-bell__icon"
                />
                {unreadCount > 0 && (
                    <span className="c-notification-bell__badge">{unreadCount}</span>
                )}
            </div>

            {showDropdown && (
                <>
                    <div
                        className="c-notification-bell__overlay"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="c-notification-bell__dropdown">
                        <div className="c-notification-bell__header">
                            <h3>通知</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead}>すべて既読</button>
                            )}
                        </div>

                        <div className="c-notification-bell__list">
                            {notifications.length === 0 ? (
                                <div className="c-notification-bell__empty">
                                    通知はありません
                                </div>
                            ) : (
                                <>
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`c-notification-bell__item ${!notification.isRead ? "-unread" : ""
                                                }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="c-notification-bell__item-title">
                                                {notification.title}
                                            </div>
                                            <div className="c-notification-bell__item-message">
                                                {notification.message}
                                            </div>
                                            <div className="c-notification-bell__item-time">
                                                {new Date(notification.createdAt).toLocaleString("ja-JP")}
                                            </div>
                                        </div>
                                    ))}

                                    {hasMore && (
                                        <div className="c-notification-bell__load-more">
                                            <button
                                                onClick={loadMoreNotifications}
                                                disabled={loading}
                                                className="c-notification-bell__load-more-btn"
                                            >
                                                {loading ? "読み込み中..." : "もっと読み込む"}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
