"use client";

import { useContext, useEffect, useState, useRef, useMemo } from "react";
import { SocketContext, UserDataContext } from "../contextProvider";
import Sidebar from "./sideBar";
import { SearchBox } from "@/app/(login_reuired)/(component)/searchbox";
import { Message } from "@/type/models";
import MessagePopup from "./messagePopup";
import { OverLay } from "@/components/overlay";
import NotificationPopup from "./notificationPopup";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchUserData, userData } = useContext(UserDataContext)!;
  const { socket } = useContext(SocketContext)!;

  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const hasNewMessageRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasNewMessage = useMemo(() => {
    console.log("changed");
    console.log(
      userData?.messageRooms?.some((r) =>
        r?.messages?.some((m) => !m.isRead && m.senderId != userData.id)
      ) ||
        userData?.courses?.some((c) =>
          c?.messageRooms?.some((r) =>
            r?.messages?.some((m) => !m.isRead && m.senderId != userData.id)
          )
        )
    );
    return Boolean(
      userData?.messageRooms?.some((r) =>
        r?.messages?.some((m) => !m.isRead && m.senderId != userData.id)
      ) ||
        userData?.courses?.some((c) =>
          c?.messageRooms?.some((r) =>
            r?.messages?.some((m) => !m.isRead && m.senderId != userData.id)
          )
        )
    );
  }, [userData]);
  useEffect(() => {
    if (!socket || !userData) return;

    const newRooms = new Set(joinedRooms);

    userData.messageRooms?.forEach((room) => {
      if (!newRooms.has(room.roomKey)) {
        console.log(`🔗 Joining room: ${room.roomKey}`);
        socket.emit("joinRoom", { roomKey: room.roomKey });
        newRooms.add(room.roomKey);
      }
    });

    userData.courses?.forEach((course) => {
      course.messageRooms?.forEach((room) => {
        if (!newRooms.has(room.roomKey)) {
          console.log(`🔗 Joining room: ${room.roomKey}`);
          socket.emit("joinRoom", { roomKey: room.roomKey });
          newRooms.add(room.roomKey);
        }
      });
    });

    setJoinedRooms(Array.from(newRooms));
  }, [socket, userData]);

  useEffect(() => {
    if (!socket) return;

    const messageHandler = (newMessage: Message) => {
      if (!hasNewMessageRef.current) {
        hasNewMessageRef.current = true;
        fetchUserData();
      }
    };

    socket.on("newMessage", messageHandler);

    return () => {
      socket.off("newMessage", messageHandler);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleMessagesRead = ({ roomKey }: { roomKey: string }) => {
      if (hasNewMessageRef.current) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          hasNewMessageRef.current = false;
          fetchUserData();
        }, 500);
      }
    };

    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, userData]);

  return (
    <>
      <Sidebar
        newMessage={hasNewMessage}
        setShowMessagePopup={setShowMessagePopup}
        setShowNotificationPopup={setShowNotificationPopup}
        showMessagePopup={showMessagePopup}
        showNotificationPopup={showNotificationPopup}
      />
      {showMessagePopup && (
        <>
          <OverLay
            className="l-message-overlay u-tr"
            onClick={() => setShowMessagePopup(false)}
          />
          <MessagePopup setShowMessagePopup={setShowMessagePopup} />
        </>
      )}
      {showNotificationPopup && (
        <>
          <OverLay
            className="l-message-overlay u-tr"
            onClick={() => setShowNotificationPopup(false)}
          />
          <NotificationPopup
            setShowNotificationPopup={setShowNotificationPopup}
          />
        </>
      )}
      <div className="l-content">
        <SearchBox name="Research" className="l-search-box" />
        <div className="l-top">{children}</div>
      </div>
    </>
  );
}
