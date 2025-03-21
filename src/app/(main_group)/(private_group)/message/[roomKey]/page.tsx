"use client";

import { useEffect, useState, useContext, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { requestDB } from "@/services/axios";
import {
  AnimationContext,
  SocketContext,
  UserDataContext,
} from "@/app/contextProvider";
import { Message, MessageRoom, PurchaseMessage } from "@/type/models";
import { MultilineInput } from "@/components/multilineInput";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import defaultIcon from "@/assets/image/user_icon.svg";
import StarRating from "@/components/starRating";
import dayjs from "dayjs";

const MessageRoomPage = () => {
  const { userData, fetchUserData } = useContext(UserDataContext)!;
  const { roomKey } = useParams()!;
  const [roomData, setRoomData] = useState<MessageRoom | null>(null);
  const [content, setContent] = useState("");
  const { socket } = useContext(SocketContext)!;
  const animation = useContext(AnimationContext)!;
  const router = useRouter();
  const hasFetchedUserRef = useRef(false);
  const chatFieldRef = useRef<HTMLDivElement>(null);

  const onReady = !!userData && !!roomData && !!socket;
  enum MessageType {
    "message",
    "purchase",
  }

  const sortedMessages: { msgType: MessageType; sentAt: Date; id: number }[] = [
    ...(roomData?.messages?.map((msg) => ({
      sentAt: msg.sentAt,
      id: msg.id,
      msgType: MessageType.message,
    })) || []),
    ...(roomData?.purchaseMessages?.map((msg) => ({
      sentAt: msg.sentAt,
      id: msg.id,
      msgType: MessageType.purchase,
    })) || []),
  ].sort((a, b) => dayjs(a.sentAt).valueOf() - dayjs(b.sentAt).valueOf());

  useEffect(() => {
    if (chatFieldRef.current) {
      chatFieldRef.current.scrollTop = chatFieldRef.current.scrollHeight;
    }
  }, [roomData]);

  useEffect(() => {
    if (!userData) return;
    animation.startAnimation();
    fetchRoomData();
  }, [userData]);

  const markMessagesAsRead = () => {
    if (!socket || !roomKey || !userData) return;
    socket.emit("markAsRead", { userId: userData.id, roomKey });
    console.log(`📨 Marked messages as read in ${roomKey}`);
  };
  useEffect(() => {
    if (!socket || !roomKey || !userData) return;

    const messageHandler = (newMessage: Message) => {
      console.log(`📨 Received newMessage in ${roomKey}`, newMessage);

      fetchRoomData();

      if (!hasFetchedUserRef.current) {
        hasFetchedUserRef.current = true;
        setTimeout(() => {
          fetchUserData();
          hasFetchedUserRef.current = false;
        }, 1000);
      }
    };

    socket.on("newMessage", messageHandler);

    return () => {
      socket.off("newMessage", messageHandler);
    };
  }, [socket, roomKey, userData]);

  const fetchRoomData = async () => {
    if (!userData) return;

    const confirm = await requestDB("message", "confirmUser", {
      userId: userData.id,
      roomKey: roomKey as string,
    });

    if (!confirm.success || !confirm.data) {
      router.push("/message");
      return;
    }

    const response = await requestDB("message", "readRoomByKey", {
      roomKey: roomKey as string,
    });

    if (response.success) {
      setRoomData((prevRoomData) => {
        if (JSON.stringify(prevRoomData) !== JSON.stringify(response.data)) {
          return response.data;
        }
        return prevRoomData;
      });
      markMessagesAsRead();
      animation.endAnimation();
    }
  };

  if (!onReady) {
    return <div>Loading...</div>;
  }

  const sendMessage = async () => {
    if (!content.trim() || !userData || !socket || !socket.connected) {
      console.log("⚠️ Cannot send message. Socket is not connected.");
      return;
    }
    const response = await requestDB("message", "sendMessage", {
      userId: userData.id,
      roomKey: roomKey as string,
      content,
    });

    socket.emit("sendMessage", {
      data: response.data,
      roomKey: roomKey as string,
    });

    const course = roomData.course;

    await requestDB("notification", "createNotification", {
      userId:
        course.coach.id != userData.id ? course.coach.id : roomData.customerId,
      content: `${userData.name}さんがメッセージを送信しました
「${content}」
        `,
      senderId: userData.id,
      roomId: roomData.id,
    });

    setTimeout(() => {
      if (!hasFetchedUserRef.current) {
        hasFetchedUserRef.current = true;
        fetchUserData();
        setTimeout(() => {
          hasFetchedUserRef.current = false;
        }, 1000);
      }
    }, 500);

    setContent("");
  };
  const averageRating: number =
    roomData.course.coach.courses &&
    roomData.course.coach.courses.length > 0 &&
    roomData.course.coach.courses.reduce(
      (totalCount, course) =>
        totalCount + (course.reviews ? course.reviews.length : 0),
      0
    ) != 0
      ? roomData.course.coach.courses.reduce(
          (totalScore, course) =>
            totalScore +
            (course.reviews
              ? course.reviews.reduce((sum, review) => sum + review.rating, 0)
              : 0),
          0
        ) /
        roomData.course.coach.courses.reduce(
          (totalCount, course) =>
            totalCount + (course.reviews ? course.reviews.length : 0),
          0
        )
      : 0;

  return (
    <div className="p-message-room l-page -fixed">
      <div className="p-message-room__title">
        {roomData.customerId == userData.id
          ? roomData.course.coach.name?.trim() != ""
            ? roomData.course.coach.name
            : "NO NAME"
          : roomData.customer.name?.trim() != ""
          ? roomData.customer.name
          : "NO NAME"}{" "}
        さんとのメッセージ
      </div>

      <div
        className="p-message-room__coach"
        onClick={() => router.push(`/courses/course/${roomData.course.id}`)}
      >
        <ImageBox
          className="p-message-room__coach-icon"
          src={roomData.course.coach.icon ?? defaultIcon}
          objectFit="cover"
          round
        />
        <div className="p-message-room__coach-details">
          <div className="p-message-room__coach-name">
            {`${roomData.course.coach.name} (${roomData.course.title})`}
          </div>
          <div className="p-message-room__coach-rating">
            <StarRating
              score={averageRating}
              showsScore={false}
              className="p-message-room__coach-stars"
            />
            <div className="p-message-room__coach-rating-text">
              (
              {roomData.course.coach.courses.reduce(
                (total, course) => total + (course.reviews?.length || 0),
                0
              )}
              )
            </div>
          </div>
        </div>
      </div>
      <div className="p-message-room__messages" ref={chatFieldRef}>
        {sortedMessages.map((msg) => {
          if (msg.msgType === MessageType.message) {
            const message = roomData.messages.find((m) => m.id == msg.id);
            return (
              <div
                key={msg.id}
                className={`p-message-room__message ${
                  message?.senderId === userData.id ? "-sent" : "-received"
                }`}
              >
                <div className="p-message-room__content">
                  {message?.content}
                </div>
              </div>
            );
          } else {
            const message = roomData.purchaseMessages.find(
              (m) => m.id == msg.id
            );
            return (
              <div
                key={msg.id}
                className={`p-message-room__purchase ${
                  message?.senderId === userData.id ? "-sent" : "-received"
                }`}
              >
                <div className="p-message-room__purchase-text">
                  購入した講座
                </div>
                <div className="p-message-room__purchase-title">
                  {message?.schedule.course.title}
                </div>
                <div className="p-message-room__purchase-time">
                  {dayjs(message?.schedule.startTime).format(
                    "YYYY年M月D日　HH:mm~"
                  )}
                </div>
                <div className="p-message-room__purchase-info">
                  <div className="p-message-room__purchase-coach">
                    {message?.schedule.course.coach.name}
                  </div>
                  <div className="p-message-room__purchase-duration">
                    {message?.schedule.course.duration}分
                  </div>
                  <div className="p-message-room__purchase-price">
                    ￥{message?.schedule.course.price.toLocaleString("ja-JP")}
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
      <MultilineInput
        className="p-message-room__input"
        placeholder="メッセージを入力"
        value={content}
        minHeight={80}
        maxHeight={80}
        onChange={(e) => setContent(e.target.value)}
        onEnter={sendMessage}
      ></MultilineInput>
      <Button
        inactive={content.trim() === ""}
        className={`p-message-room__submit ${
          content.trim() !== "" ? "-active" : ""
        }`}
        onClick={sendMessage}
      >
        送信
      </Button>
    </div>
  );
};

export default MessageRoomPage;
