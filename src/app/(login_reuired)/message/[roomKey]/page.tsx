"use client";

import { useEffect, useState, useContext, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { requestDB } from "@/services/axios";
import {
  AnimationContext,
  SocketContext,
  UserDataContext,
} from "@/app/contextProvider";
import { Message, MessageRoom } from "@/type/models";
import { MultilineInput } from "@/components/multilineInput";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import defaultIcon from "@/assets/image/user-icon.png";
import StarRating from "@/components/starRating";

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

  useEffect(() => {
    if (!socket || !roomKey || !userData) return;

    const markMessagesAsRead = () => {
      socket.emit("markAsRead", { userId: userData.id, roomKey });
      console.log(`📨 Marked messages as read in ${roomKey}`);
    };

    markMessagesAsRead();

    const messageHandler = (newMessage: Message) => {
      console.log(`📨 Received newMessage in ${roomKey}`, newMessage);

      setRoomData((prevRoomData) => {
        if (
          prevRoomData &&
          !prevRoomData.messages.some((msg) => msg.id === newMessage.id)
        ) {
          return {
            ...prevRoomData,
            messages: [...prevRoomData.messages, newMessage],
          };
        }
        return prevRoomData;
      });

      markMessagesAsRead();

      // ✅ `hasFetchedUserRef` を使って過剰な `fetchUserData()` の呼び出しを防ぐ
      if (!hasFetchedUserRef.current) {
        hasFetchedUserRef.current = true;
        setTimeout(() => {
          fetchUserData();
          hasFetchedUserRef.current = false;
        }, 1000); // ✅ 1秒遅延で `fetchUserData()` を呼び出し、連続リクエストを抑制
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

    socket.emit("sendMessage", {
      userId: userData.id,
      roomKey: roomKey as string,
      content,
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
    <div className="p-message-room">
      <div className="p-message-room__title">メッセージ</div>
      <div className="p-message-room__coach">
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
        {roomData?.messages?.map((msg) => (
          <div
            key={msg.id}
            className={`p-message-room__message ${
              msg.senderId === userData.id ? "-sent" : "-received"
            }`}
          >
            <div className="p-message-room__content">{msg.content}</div>
          </div>
        ))}
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
