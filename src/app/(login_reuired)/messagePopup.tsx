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
import { MessageRoom, Message } from "@/type/models";
import { ImageBox } from "@/components/imageBox";
import rightIcon from "@/assets/image/arrow2_right.svg";
import defaultIcon from "@/assets/image/user-icon.png";

interface Props {
  setShowMessagePopup: Dispatch<SetStateAction<boolean>>;
}
const MessagePopup = ({ setShowMessagePopup }: Props) => {
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
    setShowMessagePopup(false);
    router.push(`/message/${roomKey}`);
  };

  return (
    <div className="p-message">
      <div className="p-message__list">
        {rooms
          .sort(
            (a, b) =>
              Math.max(
                ...b.messages.map((m) => new Date(m.sentAt).getTime() || 0)
              ) -
              Math.max(
                ...a.messages.map((m) => new Date(m.sentAt).getTime() || 0)
              )
          )
          .map((room) => {
            const hasUnread = room.messages.some(
              (msg) => !msg.isRead && msg.senderId != userData.id
            );
            return (
              <div
                key={room.id}
                className={`p-message__room ${hasUnread ? "-unread" : ""}`}
                onClick={() => openRoom(room.roomKey)}
              >
                <ImageBox
                  className="p-message__icon"
                  round
                  objectFit="cover"
                  src={
                    (room.customerId == userData.id
                      ? room.course.coach.icon
                      : room.customer.icon) ?? defaultIcon
                  }
                />
                <div className="p-message__info">
                  <div className="p-message__info-title">
                    {`${
                      room.customerId == userData.id
                        ? room.course.coach.name
                        : room.customerId
                    } (${room.course.title})`}
                  </div>

                  <div className={`p-message__latest`}>
                    {room.messages.length > 0 &&
                      room.messages[room.messages.length - 1].content}
                  </div>
                </div>
                <ImageBox className="p-message__right" src={rightIcon} />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default MessagePopup;
