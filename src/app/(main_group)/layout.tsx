"use client";

import footerImage from "@/assets/image/footer.png";
import logoIcon from "@/assets/image/logo.png";
import { ImageBox } from "@/components/imageBox";
import { OverLay } from "@/components/overlay";
import useAnimation from "@/hooks/useAnimation";
import { requestDB } from "@/services/axios";
import { Course, type Game, Message, type User } from "@/type/models";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
	BreakPointContext,
	SocketContext,
	UserDataContext,
} from "../contextProvider";
// import NotificationPopup from "./notificationPopup";
import Header from "./header";
import MessagePopup from "./messagePopup";
import Sidebar from "./sideBar";

export default function GuestLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { fetchUserData, userData, userDataStatus } =
		useContext(UserDataContext)!;
	const { socket } = useContext(SocketContext)!;
	const { breakpoint, orLower } = useContext(BreakPointContext)!;

	const [joinedRooms, setJoinedRooms] = useState<string[]>([]);
	const [showMessagePopup, setShowMessagePopup] = useState(false);
	const [showSideBar, setShowSideBar] = useState(false);
	// const [showNotificationPopup, setShowNotificationPopup] = useState(false);

	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const [games, setGames] = useState<Game[]>();
	const [coaches, setCoaches] = useState<User[]>();

	const onReady = games && coaches && userData;

	const router = useRouter();
	const path = usePathname()!;
	const animation = useAnimation();


	const isHomePage = path.replace("/", "") === "";

	useEffect(() => {
		fetchGames();
		fetchCoaches();
	}, []);

	useEffect(() => {
		if (onReady) {
		}
	}, [onReady]);

	useEffect(() => {
		if (userData && !userData?.isInitialized && path != "/initialize") {
			animation.endAnimation();
			router.push(`/initialize?callback=${path}`);
		}
	}, [userData, path]);

	const hasNewMessage = useMemo(() => {
		return Boolean(
			userData?.customerMessageRooms?.some((r) =>
				r?.messages?.some((m) => !m.isRead && m.senderId != userData.id),
			) ||
			userData?.coachMessageRooms?.some((r) =>
				r?.messages?.some((m) => !m.isRead && m.senderId != userData.id),
			),
		);
	}, [userData]);

	const hasNewMessageRef = useRef(hasNewMessage);
	useEffect(() => {
		hasNewMessageRef.current = hasNewMessage;
	}, [hasNewMessage]);

	// const hasNewNotification = useMemo(() => {
	//   return Boolean(
	//     userData?.notification.some((n) => {
	//       return !n.isRead;
	//     })
	//   );
	// }, [userData]);

	// const hasNewNotificationRef = useRef(hasNewNotification);
	// useEffect(() => {
	//   console.log(`hasNewNotification:${hasNewNotification}`);
	//   hasNewNotificationRef.current = hasNewNotification;
	// }, [hasNewNotification]);

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

		userData.customerMessageRooms?.forEach((room) => {
			if (!newRooms.has(room.roomKey)) {
				console.log(`🔗 Joining room: ${room.roomKey}`);
				socket.emit("joinRoom", { roomKey: room.roomKey, userId: userData.id });
				newRooms.add(room.roomKey);
			}
		});

		userData.coachMessageRooms?.forEach((room) => {
			if (!newRooms.has(room.roomKey)) {
				console.log(`🔗 Joining room: ${room.roomKey}`);
				socket.emit("joinRoom", {
					roomKey: room.roomKey,
					userId: userData.id,
				});
				newRooms.add(room.roomKey);
			}
		});

		setJoinedRooms(Array.from(newRooms));
	}, [socket, userData]);

	useEffect(() => {
		if (!socket) return;

		const messageHandler = () => {
			console.log("new message!!");
			if (!hasNewMessageRef.current) {
				console.log("new message and update");
				hasNewMessageRef.current = true;
				fetchUserData();
			}
		};
		// const notificationHandler = () => {
		//   console.log("new notification!!");
		//   if (!hasNewNotificationRef.current) {
		//     console.log("new notification and update");
		//     hasNewNotificationRef.current = true;
		//     fetchUserData();
		//   }
		// };

		socket.on("newMessage", messageHandler);
		// socket.on("newNotification", notificationHandler);

		return () => {
			socket.off("newMessage", messageHandler);
			// socket.off("newNotification", notificationHandler);
		};
	}, [socket]);

	useEffect(() => {
		if (!socket) return;

		const handleMessagesRead = ({ roomKey }: { roomKey: string }) => {
			console.log("update start...", hasNewMessage);
			if (hasNewMessageRef.current) {
				console.log("updating..........!!!!!");
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
			{showSideBar ? (
				<>
					<Sidebar setShowSideBar={setShowSideBar} />
					<OverLay
						className="l-sidebar-overlay"
						onClick={() => setShowSideBar(false)}
					/>
				</>
			) : null}
			<Header setShowSideBar={setShowSideBar} />
			{showMessagePopup && (
				<>
					<OverLay
						className="l-message-overlay u-tr"
						onClick={() => setShowMessagePopup(false)}
					/>
					<MessagePopup setShowMessagePopup={setShowMessagePopup} />
				</>
			)}
			{/* {showNotificationPopup && (
        <>
          <OverLay
            className="l-message-overlay u-tr"
            onClick={() => {
              setShowNotificationPopup(false);
              fetchUserData();
            }}
          />
          <NotificationPopup
            setShowNotificationPopup={setShowNotificationPopup}
          />
        </>
      )} */}
			<div className={`l-content ${path == "/" ? "-home" : ""}`}>
				<div className="l-top">
					{children}
					<div className="l-footer">
						<ImageBox
							className="l-footer__image"
							src={footerImage}
							objectFit="cover"
						/>
						<div className="l-footer__content">
							<div className="l-footer__links">
								<div className="l-footer__column">
									<Link className="l-footer__link" href="/">
										TOP
									</Link>
									<div className="l-footer__separator"></div>
									<Link className="l-footer__link" href="/courses/coach">
										コーチから選ぶ
									</Link>
									<div className="l-footer__separator"></div>
									<Link className="l-footer__link" href="/courses">
										講座を探す
									</Link>
								</div>
								<div className="l-footer__column">
									{userData ? (
										<Link className="l-footer__link" href="/mypage">
											マイページ
										</Link>
									) : (
										<>
											<Link className="l-footer__link" href="/sign-in">
												ログイン
											</Link>
											<div className="l-footer__separator"></div>
											<Link className="l-footer__link" href="/sign-up">
												新規会員登録
											</Link>
										</>
									)}
								</div>
								<div className="l-footer__column">
									<Link className="l-footer__link" href="/terms">
										利用規約
									</Link>
									<div className="l-footer__separator"></div>
									<Link className="l-footer__link" href="/policy">
										プライバシーポリシー
									</Link>
								</div>
							</div>
							<div className="l-footer__copyright">
								© はるnチャンネル managed by EVOLISS
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
