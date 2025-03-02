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
import { MessageRoom, Message, PurchaseMessage } from "@/type/models";
import { ImageBox } from "@/components/imageBox";
import rightIcon from "@/assets/image/arrow_right.svg";
import defaultIcon from "@/assets/image/user_icon.svg";
import dayjs from "dayjs";

interface Props {
  setShowMessagePopup: Dispatch<SetStateAction<boolean>>;
}

const MessagePopup = ({ setShowMessagePopup }: Props) => {
  const { userData } = useContext(UserDataContext)!;
  const router = useRouter();
  const animation = useContext(AnimationContext)!;

  const onReady = userData;

  const getLatestTimestamp = (room: MessageRoom) => {
    return Math.max(
      ...room.messages.map((m) => new Date(m.sentAt).getTime() || 0),
      ...room.purchaseMessages.map((m) => new Date(m.sentAt).getTime() || 0)
    );
  };

  const rooms = useMemo(() => {
    return [
      ...(userData?.messageRooms ?? []),
      ...(userData?.courses ?? []).flatMap((c) => c.messageRooms),
    ].sort((a, b) => getLatestTimestamp(b) - getLatestTimestamp(a));
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
        {rooms.map((room) => {
          const hasUnread =
            room.messages.some(
              (msg) => !msg.isRead && msg.senderId !== userData.id
            ) ||
            room.purchaseMessages.some(
              (msg) => !msg.isRead && msg.senderId !== userData.id
            );

          const latestMessage = [...room.messages, ...room.purchaseMessages]
            .sort(
              (a, b) =>
                new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
            )
            .pop();

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
                      : room.customer.name
                  } (${room.course.title})`}
                </div>

                <div className="p-message__latest">
                  {latestMessage &&
                    ("content" in latestMessage
                      ? latestMessage.content
                      : `購入した講座 ${latestMessage.schedule.course.title}`)}
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
