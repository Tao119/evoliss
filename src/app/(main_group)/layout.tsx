"use client";

import { useContext, useEffect, useState, useRef, useMemo } from "react";
import Sidebar from "./sideBar";
import { SearchBox } from "@/app/(component)/searchbox";
import { Course, Game, Message, User } from "@/type/models";
import MessagePopup from "./messagePopup";
import { OverLay } from "@/components/overlay";
import { requestDB } from "@/services/axios";
import { ImageBox } from "@/components/imageBox";
import logoImage from "@/assets/image/logo.png";
import Link from "next/link";
import { SocketContext, UserDataContext } from "../contextProvider";
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

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasNewMessage = useMemo(() => {
    return Boolean(
      userData?.messageRooms?.some((r) =>
        r?.messages?.some((m) => !m.isRead && m.senderId != userData.id)
      ) ||
        userData?.courses?.some((c) =>
          c?.messageRooms?.some((r) =>
            r?.messages?.some((m) => !m.isRead && m.senderId != userData.id)
          )
        ) ||
        userData?.messageRooms?.some((r) =>
          r?.purchaseMessages?.some(
            (m) => !m.isRead && m.senderId != userData.id
          )
        ) ||
        userData?.courses?.some((c) =>
          c?.messageRooms?.some((r) =>
            r?.purchaseMessages?.some(
              (m) => !m.isRead && m.senderId != userData.id
            )
          )
        )
    );
  }, [userData]);

  const hasNewMessageRef = useRef(hasNewMessage);

  const [games, setGames] = useState<Game[]>();
  const [coaches, setCoaches] = useState<User[]>();

  const onReady = games && coaches && userData;

  useEffect(() => {
    fetchGames();
    fetchCoaches();
  }, []);

  useEffect(() => {
    if (onReady) {
    }
  }, [onReady]);
  useEffect(() => {
    hasNewMessageRef.current = hasNewMessage;
  }, [hasNewMessage]);

  const fetchGames = async () => {
    try {
      const response = await requestDB("game", "readTopGames");
      if (response.success) {
        setGames(response.data);
      } else {
        alert("ゲーム情報の取得中にエラーが発生しました");
      }
    } catch (error) {
      console.error("Error fetching games:", error);
    }
  };

  const fetchCoaches = async () => {
    try {
      const response = await requestDB("coach", "readTopCoaches");
      if (response.success) {
        setCoaches(response.data);
      } else {
        alert("コーチ情報の取得中にエラーが発生しました");
      }
    } catch (error) {
      console.error("Error fetching coaches:", error);
    }
  };

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
    console.log(hasNewMessageRef);
  }, [hasNewMessageRef]);

  useEffect(() => {
    if (!socket) return;

    const messageHandler = (newMessage: Message) => {
      console.log("new message!!");
      if (!hasNewMessageRef.current) {
        console.log("new message and update");
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
      console.log("updating..........!!!!!");
      if (hasNewMessageRef.current) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          hasNewMessageRef.current = false;
          console.log("updating..........");
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
        <div className="l-search-box__wrapper">
          <SearchBox name="Research" className="l-search-box" />
        </div>
        <div className="l-top">
          {children}
          <div className="l-footer">
            <div className="l-footer__title">@EVOLISS</div>
            <div className="l-footer__content">
              <div className="l-footer__column">
                <div className="l-footer__column-title">ホーム</div>
                <Link className="l-footer__column-item" href="/about">
                  EVOLISSとは
                </Link>
                <Link className="l-footer__column-item" href="/courses">
                  講座を探す
                </Link>
                <Link className="l-footer__column-item" href="/create">
                  コーチをしてみる
                </Link>
              </div>
              <div className="l-footer__column">
                <div className="l-footer__column-title">検索</div>
                <div className="l-footer__column-item">ゲーム一覧</div>
                {games?.slice(0, 3).map((g, i) => (
                  <Link
                    className="l-footer__column-item"
                    key={i}
                    href={`/courses/game/${g.id}`}
                  >
                    ・{g.name}
                  </Link>
                ))}
              </div>
              <div className="l-footer__column">
                <div className="l-footer__column-title"></div>
                <div className="l-footer__column-item">コーチ一覧</div>
                {coaches?.slice(0, 3).map((c, i) => (
                  <Link
                    className="l-footer__column-item"
                    key={i}
                    href={`/courses/coach/${c.id}`}
                  >
                    ・{c.name}
                  </Link>
                ))}
              </div>
              <div className="l-footer__icon">
                <ImageBox
                  round
                  objectFit="cover"
                  className="l-footer__icon-img"
                  src={logoImage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
