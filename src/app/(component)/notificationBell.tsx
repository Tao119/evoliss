"use client";

import { useContext, useEffect, useState } from "react";
import { UserDataContext } from "../contextProvider";
import { requestDB } from "@/services/axios";
import { ImageBox } from "@/components/imageBox";
import notificationIcon from "@/assets/image/notification.svg";
import { useRouter } from "next/navigation";

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
    const router = useRouter();

    useEffect(() => {
        if (userData) {
            fetchNotifications();
            // 30秒ごとに通知を更新
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [userData]);

    const fetchNotifications = async () => {
        if (!userData) return;

        try {
            const response = await requestDB("notification", "readNotificationsByUserId", {
                userId: userData.id,
                limit: 10,
            });

            if (response.success) {
                setNotifications(response.data);
                const unread = response.data.filter((n: Notification) => !n.isRead).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // 未読の場合は既読にする
        if (!notification.isRead) {
            try {
                await requestDB("notification", "markNotificationAsRead", {
                    id: notification.id,
                });
                fetchNotifications();
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        }

        // 通知タイプに応じて遷移
        if (notification.type === "purchase" && notification.relatedId) {
            router.push("/mypage/coach/upcoming");
        } else if (notification.type === "message" && notification.relatedId) {
            // relatedIdはroomIdなので、roomKeyを取得する必要がある
            router.push("/mypage/message");
        } else if (notification.type === "reminder" && notification.relatedId) {
            router.push("/mypage/courses/upcoming");
        }

        setShowDropdown(false);
    };

    const markAllAsRead = async () => {
        try {
            await requestDB("notification", "markAllNotificationsAsRead", {
                userId: userData?.id,
            });
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark all as read:", error);
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
                                notifications.map((notification) => (
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
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
