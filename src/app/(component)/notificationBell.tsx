"use client";

import { useContext, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserDataContext, useHeader } from "../contextProvider";
import {
    useNotifications,
    getNotificationPath,
    AppNotification,
    LOCALE,
} from "@/hooks/useNotifications";

const NotificationIcon = () => (
    <svg
        className="c-notification-bell__icon"
        width="46"
        height="41"
        viewBox="0 0 46 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path
            d="M23.3795 7.1059C28.9277 7.1059 33.4321 11.6103 33.4321 17.1585V31.1232H13.3269V17.1585C13.3269 11.6103 17.8313 7.1059 23.3795 7.1059Z"
            strokeMiterlimit="10"
        />
        <path d="M8 31.1233H38.759" strokeMiterlimit="10" />
        <path
            d="M23.3795 7.10589V4"
            strokeMiterlimit="10"
            strokeLinecap="round"
        />
        <path
            d="M27.1655 33.7255C27.1655 35.8164 25.4706 37.5114 23.3796 37.5114C21.2887 37.5114 19.5938 35.8164 19.5938 33.7255H27.1655Z"
            strokeMiterlimit="10"
        />
    </svg>
);

interface NotificationItemProps {
    notification: AppNotification;
    onClick: (notification: AppNotification) => void;
}

const NotificationItem = ({ notification, onClick }: NotificationItemProps) => (
    <button
        type="button"
        className={`c-notification-bell__item ${!notification.isRead ? "-unread" : ""}`}
        onClick={() => onClick(notification)}
        aria-label={`${notification.title}: ${notification.message}`}
    >
        <div className="c-notification-bell__item-title">{notification.title}</div>
        <div className="c-notification-bell__item-message">{notification.message}</div>
        <div className="c-notification-bell__item-time">
            {new Date(notification.createdAt).toLocaleString(LOCALE)}
        </div>
    </button>
);

const DEFAULT_FALLBACK_PATH = "/mypage";

export const NotificationBell = () => {
    const context = useContext(UserDataContext);
    const userData = context?.userData;
    const router = useRouter();
    const pathname = usePathname();
    const { isTopPanelVisible } = useHeader();

    const {
        notifications,
        unreadCount,
        loading,
        hasMore,
        markAsRead,
        markAllAsRead,
        loadMore,
    } = useNotifications();

    const [showDropdown, setShowDropdown] = useState(false);

    const isHomePage = pathname === "/";
    const shouldUseWhiteIcon = isHomePage && isTopPanelVisible;

    const handleNotificationClick = useCallback(
        async (notification: AppNotification) => {
            try {
                if (!notification.isRead) {
                    await markAsRead(notification.id);
                }

                const path = await getNotificationPath(notification);
                router.push(path);
            } catch {
                router.push(DEFAULT_FALLBACK_PATH);
            } finally {
                setShowDropdown(false);
            }
        },
        [markAsRead, router]
    );

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const toggleDropdown = () => {
        setShowDropdown(prev => !prev);
    };

    const closeDropdown = () => {
        setShowDropdown(false);
    };

    if (!userData) return null;

    return (
        <div className={`c-notification-bell ${shouldUseWhiteIcon ? "-white" : ""}`}>
            <button
                type="button"
                className="c-notification-bell__icon-wrapper"
                onClick={toggleDropdown}
                aria-label={`通知 ${unreadCount > 0 ? `(${unreadCount}件の未読)` : ""}`}
                aria-expanded={showDropdown}
                aria-haspopup="true"
            >
                <NotificationIcon />
                {unreadCount > 0 && (
                    <span className="c-notification-bell__badge" aria-hidden="true">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div
                        className="c-notification-bell__overlay"
                        onClick={closeDropdown}
                        aria-hidden="true"
                    />
                    <div
                        className="c-notification-bell__dropdown"
                        role="menu"
                        aria-label="通知一覧"
                    >
                        <div className="c-notification-bell__header">
                            <h3>通知</h3>
                            {unreadCount > 0 && (
                                <button type="button" onClick={handleMarkAllAsRead}>
                                    すべて既読
                                </button>
                            )}
                        </div>

                        <div className="c-notification-bell__list" role="list">
                            {notifications.length === 0 ? (
                                <div className="c-notification-bell__empty">
                                    通知はありません
                                </div>
                            ) : (
                                <>
                                    {notifications.map(notification => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onClick={handleNotificationClick}
                                        />
                                    ))}

                                    {hasMore && (
                                        <div className="c-notification-bell__load-more">
                                            <button
                                                type="button"
                                                onClick={loadMore}
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
