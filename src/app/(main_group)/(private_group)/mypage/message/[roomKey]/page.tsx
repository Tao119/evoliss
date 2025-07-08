"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import { InputBox } from "@/components/inputBox";
import { requestDB } from "@/services/axios";
import { useContext, useState, useEffect, useRef } from "react";
import defaultIcon from "@/assets/image/user_icon.svg";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { ImageBox } from "@/components/imageBox";
import rightIcon from "@/assets/image/arrow2_right.svg";
import leftIcon from "@/assets/image/arrow2_left.svg";
import { CourseCardMessage } from "../courseCardMessage";
import type { MessageRoom, Message, Reservation } from "@/type/models";
import Border from "@/components/border";
import { IconButton } from "@/components/iconButton";
import { MultilineInput } from "@/components/multilineInput";
import { useSocket } from "@/hooks/useSocket";
import { BackButton } from "@/components/backbutton";

dayjs.locale("ja");

const MessageRoomPage = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const { socket, isConnected } = useSocket();
	const { roomKey } = useParams() as { roomKey: string };
	const [message, setMessage] = useState("");
	const [room, setRoom] = useState<MessageRoom | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [currentReservationIndex, setCurrentReservationIndex] = useState(0);
	const [isAnimating, setIsAnimating] = useState(false);
	const router = useRouter()

	// roomKeyからroom情報を取得
	useEffect(() => {
		fetchRoomData();
	}, [roomKey]);

	// ページがフォーカスを取り戻した時に既読処理を実行
	useEffect(() => {
		const handleFocus = () => {
			if (userData && roomKey && document.visibilityState === 'visible') {
				markMessagesAsRead(roomKey);
			}
		};

		document.addEventListener('visibilitychange', handleFocus);
		window.addEventListener('focus', handleFocus);

		return () => {
			document.removeEventListener('visibilitychange', handleFocus);
			window.removeEventListener('focus', handleFocus);
		};
	}, [userData, roomKey]);

	// Socket.ioのイベントリスナーを設定
	useEffect(() => {
		if (!socket || !userData || !roomKey || !room) return;

		console.log('Setting up socket listeners for room:', room.id);

		socket.emit("joinRoom", {
			roomKey,
			userId: userData.id,
		});

		const handleNewMessage = (data: any) => {
			console.log("New message received:", data);
			if (data && data.roomId === room.id) {
				setMessages(prev => {
					const exists = prev.some((msg: Message) => msg.id === data.id);
					if (!exists) {
						console.log('Adding new message to state');
						// 自分以外からのメッセージの場合、既読処理を実行
						if (data.senderId !== userData.id) {
							markMessagesAsRead(roomKey);
						}
						return [...prev, data];
					}
					return prev;
				});
			}
		};

		const handleMessagesRead = (data: any) => {
			if (data.roomKey === roomKey) {
				fetchMessages();
			}
		};

		socket.on("newMessage", handleNewMessage);
		socket.on("messagesRead", handleMessagesRead);

		return () => {
			console.log('Cleaning up socket listeners');
			socket.off("newMessage", handleNewMessage);
			socket.off("messagesRead", handleMessagesRead);
		};
	}, [socket, userData, roomKey, room]);


	const fetchRoomData = async () => {
		try {
			const response = await requestDB("message", "readMessageRoomByKey", {
				roomKey
			});

			if (response.success && response.data) {
				setRoom(response.data);
				setMessages(response.data.messages || []);

				// 既読処理
				if (userData && roomKey) {
					markMessagesAsRead(roomKey);
				}

				// 関連する予約を取得
				fetchReservations(response.data.coachId, response.data.customerId);
			}
		} catch (error) {
			console.error("Failed to fetch room data:", error);
		}
	};

	const fetchMessages = async () => {
		if (!room) return;

		try {
			const response = await requestDB("message", "readMessagesByRoomId", {
				roomId: room.id
			});

			if (response.success && response.data) {
				setMessages(response.data);
			}
		} catch (error) {
			console.error("Failed to fetch messages:", error);
		}
	};

	const fetchReservations = async (coachId: number, customerId: number) => {
		try {
			const response = await requestDB("reservation", "readReservationsByCoachAndCustomer", {
				coachId,
				customerId
			});

			if (response.success && response.data) {
				// 最新順にソート
				const sortedReservations = response.data.sort((a: Reservation, b: Reservation) => {
					const dateA = new Date(a.timeSlots?.[0]?.dateTime || 0).getTime();
					const dateB = new Date(b.timeSlots?.[0]?.dateTime || 0).getTime();
					return dateB - dateA;
				});
				setReservations(sortedReservations);
			}
		} catch (error) {
			console.error("Failed to fetch reservations:", error);
		}
	};

	const markMessagesAsRead = async (roomKey: string) => {
		if (!userData) return;
		try {
			const response = await requestDB("message", "markMessagesAsRead", {
				roomKey,
				userId: userData.id
			});
			
			// 既読処理が成功したらSocketで通知
			if (response && response.success && socket) {
				socket.emit("markAsRead", {
					userId: userData.id,
					roomKey
				});
			}
		} catch (error) {
			console.error("Failed to mark messages as read:", error);
		}
	};

	if (!userData || !room) {
		return (
			<>
				<div className="p-mypage__title">メッセージ</div>
				<Border />
				<div className="p-mypage__loading">読み込み中...</div>
			</>
		);
	}

	const handleSendMessage = async () => {
		if (!message.trim() || !room) return;

		animation.startAnimation();
		try {
			const response = await requestDB("message", "sendMessage", {
				roomId: room.id,
				senderId: userData.id,
				content: message
			});

			if (response.success && response.data) {
				setMessage("");
				// 送信したメッセージを即座に追加
				setMessages(prev => [...prev, response.data]);
				// Socket.ioでメッセージをブロードキャスト
				if (socket) {
					socket.emit("sendMessage", {
						data: response.data,
						roomKey,
					});
				}
			} else {
				alert("メッセージの送信に失敗しました");
			}
		} catch (error) {
			alert("メッセージの送信に失敗しました");
		}
		animation.endAnimation();
	};

	const handlePrevReservation = () => {
		if (isAnimating || reservations.length <= 1) return;

		setIsAnimating(true);
		const newIndex = currentReservationIndex > 0 ? currentReservationIndex - 1 : reservations.length - 1;
		setCurrentReservationIndex(newIndex);

		setTimeout(() => {
			setIsAnimating(false);
		}, 300);
	};

	const handleNextReservation = () => {
		if (isAnimating || reservations.length <= 1) return;

		setIsAnimating(true);
		const newIndex = currentReservationIndex < reservations.length - 1 ? currentReservationIndex + 1 : 0;
		setCurrentReservationIndex(newIndex);

		setTimeout(() => {
			setIsAnimating(false);
		}, 300);
	};

	const otherUser = room.coachId === userData.id ? room.customer : room.coach;
	const currentReservation = reservations[currentReservationIndex];
	const isCoach = room.coachId === userData.id;

	return (
		<>
			<BackButton className="p-mypage__back" back={() => router.push("/mypage/message")} />
			<div className="p-mypage__title">
				<ImageBox
					className="p-message__user-icon"
					src={otherUser?.icon || defaultIcon}
					round
					objectFit="cover"
				/>
				{otherUser?.name || "Unknown User"}
			</div>

			{reservations.length > 0 && currentReservation && (
				<>
					<div className="p-message__course-title">
						{isCoach ? '開講予定の講座' : '受講予定の講座'}
					</div>
					<div className="p-message__course">
						<IconButton className="p-message__course-button"
							onClick={handlePrevReservation}
							disabled={reservations.length <= 1 || isAnimating} src={leftIcon} />

						<div className="p-message__course-container">
							{reservations.map((reservation, index) => (
								<div
									key={reservation.id}
									className={`p-message__course-slide ${index === currentReservationIndex ? '-active' : ''
										}`}
								>
									<CourseCardMessage
										course={reservation.course}
										reservation={reservation}
									/>
								</div>
							))}
						</div>

						<IconButton
							className="p-message__course-button"
							onClick={handleNextReservation}
							disabled={reservations.length <= 1 || isAnimating}
							src={rightIcon} />
					</div>
				</>
			)}

			<div className="p-message__input-area">

				<div className="p-message__input-outline">
					<MultilineInput
						className="p-message__input"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						minHeight={150}
						maxHeight={150}
						placeholder="メッセージを入力する"
					/></div>
				<Button
					className="p-message__send-button"
					onClick={handleSendMessage}
					disabled={!message.trim()}
				>
					メッセージを送る
				</Button>
			</div>

			<div className="p-message__messages">
				{messages.sort((a, b) => {
					const dateA = new Date(a.sentAt).getTime();
					const dateB = new Date(b.sentAt).getTime();
					return dateB - dateA; // 降順（新しいメッセージが上）
				}).map((msg, index) => (
					<div
						key={index}
						className={`p-message__message ${msg.senderId === userData.id ? '-own' : '-other'
							}`}
					>

						<div className="p-message__message-content">
							<div className="p-message__message-user">
								<ImageBox
									className="p-message__message-icon"
									src={msg.sender.icon || defaultIcon}
									round
									objectFit="cover"
								/>
								<div className="p-message__message-name">
									{msg.sender.name}
								</div>
							</div>
							{msg.content}
						</div>
						<div className="p-message__message-time">
							{dayjs(msg.sentAt).format("MM/DD HH:mm")}
						</div>
					</div>
				))}
			</div>


		</>
	);
};

export default MessageRoomPage;
