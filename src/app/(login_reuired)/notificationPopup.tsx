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
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { useSocket } from "@/hooks/useSocket";
// import { Notification } from "@/type/models";
import { ImageBox } from "@/components/imageBox";
import rightIcon from "@/assets/image/arrow2_right.svg";
import defaultIcon from "@/assets/image/user-icon.png";

interface Props {
  setShowNotificationPopup: Dispatch<SetStateAction<boolean>>;
}
const NotificationPopup = ({ setShowNotificationPopup }: Props) => {
  const { userData } = useContext(UserDataContext)!;
  const router = useRouter();
  const animation = useContext(AnimationContext)!;

  const onReady = userData;

  const rooms = useMemo(() => {
    console.log(
      [
        ...(userData?.messageRooms ?? []),
        ...(userData?.courses ?? []).flatMap((c) => c.messageRooms),
      ].sort(
        (a, b) =>
          Math.max(
            ...b.messages.map((m) => new Date(m.sentAt).getTime() || 0)
          ) -
          Math.max(...a.messages.map((m) => new Date(m.sentAt).getTime() || 0))
      )
    );
    return [
      ...(userData?.messageRooms ?? []),
      ...(userData?.courses ?? []).flatMap((c) => c.messageRooms),
    ].sort(
      (a, b) =>
        Math.max(...b.messages.map((m) => new Date(m.sentAt).getTime() || 0)) -
        Math.max(...a.messages.map((m) => new Date(m.sentAt).getTime() || 0))
    );
  }, [userData]);

  useEffect(() => {
    animation.startAnimation();
  }, [userData]);

  useEffect(() => {
    if (onReady) {
      animation.endAnimation();
    }
  }, [onReady]);

  if (!onReady) {
    return <div>Loading...</div>;
  }

  const openRoom = (roomKey: string) => {
    setShowNotificationPopup(false);
    router.push(`/message/${roomKey}`);
  };

  return (
    <div className="p-message">
      <div className="p-message__list">通知一覧</div>
    </div>
  );
};

export default NotificationPopup;
