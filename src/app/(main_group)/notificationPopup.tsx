"use client";

import {
  useEffect,
  useState,
  useContext,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { requestDB } from "@/services/axios";
import {
  AnimationContext,
  BreakPointContext,
  UserDataContext,
} from "@/app/contextProvider";
import { ImageBox } from "@/components/imageBox";
import rightIcon from "@/assets/image/arrow_right.svg";
import defaultIcon from "@/assets/image/user_icon.svg";

import closeImage from "@/assets/image/cross.svg";
import { IconButton } from "@/components/iconButton";
interface Props {
  setShowNotificationPopup: Dispatch<SetStateAction<boolean>>;
}

const NotificationPopup = ({ setShowNotificationPopup }: Props) => {
  const { userData } = useContext(UserDataContext)!;
  const router = useRouter();
  const animation = useContext(AnimationContext)!;
  const { breakpoint, orLower } = useContext(BreakPointContext)!;
  const [notifications, setNotifications] = useState(
    userData?.notification || []
  );

  const pollingInterval = 10000; // 10秒ごとに通知を取得

  useEffect(() => {
    animation.startAnimation();
    fetchNotifications();

    // 一定時間ごとに通知データを取得
    const interval = setInterval(fetchNotifications, pollingInterval);

    return () => clearInterval(interval); // コンポーネントのアンマウント時にクリーンアップ
  }, []);

  useEffect(() => {
    if (userData) {
      animation.endAnimation();
    }
  }, [userData]);

  const fetchNotifications = async () => {
    if (!userData) return;

    try {
      const response = await requestDB(
        "notification",
        "getNotificationsByUserId",
        {
          userId: userData.id,
        }
      );

      if (response.success) {
        setNotifications(response.data);
      } else {
        console.error("通知データの取得に失敗しました");
      }
    } catch (error) {
      console.error("通知の取得エラー:", error);
    }
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-notification">
      {orLower("sp") && (
        <IconButton
          src={closeImage}
          onClick={() => setShowNotificationPopup(false)}
          className="p-notification__close"
        />
      )}
      <div className="p-notification__list">
        {notifications
          ?.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .map((n) => (
            <div
              key={n.id}
              className={`p-notification__notification`}
              onClick={() =>
                n.room?.roomKey
                  ? router.push(`/messages/${n.room.roomKey}`)
                  : null
              }
            >
              <ImageBox
                className="p-notification__icon"
                round
                objectFit="cover"
                src={n.sender?.icon ?? defaultIcon}
              />
              <div className="p-notification__content">{n.content}</div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default NotificationPopup;
