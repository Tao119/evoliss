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
import { CourseCarousel } from "../CourseCarousel";
import type { MessageRoom, Message, Reservation } from "@/type/models";
import Border from "@/components/border";

import { MultilineInput } from "@/components/multilineInput";
import { useSocket } from "@/hooks/useSocket";
import { BackButton } from "@/components/backbutton";
import { ImageUploadArea } from "./ImageUploadArea";

dayjs.locale("ja");

const MessageRoomPage = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const { socket, isConnected, send } = useSocket();
	const { roomKey } = useParams() as { roomKey: string };
	const [message, setMessage] = useState("");
	const [room, setRoom] = useState<MessageRoom | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [currentReservationIndex, setCurrentReservationIndex] = useState(0);
	const [showImageUpload, setShowImageUpload] = useState(false);
	const imageUploadRef = useRef<HTMLInputElement>(null);

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

	// WebSocketのイベントリスナーを設定
	useEffect(() => {
		if (!userData || !roomKey || !room) return;

		console.log('Setting up WebSocket listeners for room:', room.id);

		const handleWebSocketMessage = (event: CustomEvent) => {
			const message = event.detail;
			console.log("WebSocket message received:", message);

			switch (message.type) {
				case 'newMessage':
					if (message.data && message.data.roomId === room.id) {
						console.log('Processing new message for room:', room.id, message.data);
						setMessages(prev => {
							const exists = prev.some((msg: Message) => msg.id === message.data.id);
							if (!exists) {
								console.log('Adding new message to state:', message.data);
								// 自分以外からのメッセージの場合、既読処理を実行
								if (message.data.senderId !== userData.id) {
									setTimeout(() => markMessagesAsRead(roomKey), 100);
								}
								return [...prev, message.data];
							}
							console.log('Message already exists, skipping');
							return prev;
						});
					} else {
						console.log('Message not for this room:', message.data?.roomId, 'vs', room.id);
					}
					break;

				case 'messagesRead':
					if (message.data && message.data.roomKey === roomKey) {
						console.log('Messages marked as read for room:', roomKey);
						setMessages(prev =>
							prev.map((msg: Message) => ({ ...msg, isRead: true }))
						);
					}
					break;
			}
		};

		// WebSocketメッセージリスナーを追加
		window.addEventListener('socket-message', handleWebSocketMessage as EventListener);

		// Socket.IOが接続されたらルームに参加
		if (socket && isConnected) {
			console.log('Joining room:', roomKey, 'for user:', userData.id);
			send("joinRoom", {
				roomKey,
				userId: userData.id,
			});
		}

		return () => {
			console.log('Cleaning up WebSocket listeners');
			window.removeEventListener('socket-message', handleWebSocketMessage as EventListener);
		};
	}, [socket, isConnected, userData, roomKey, room, send]);

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

			// 既読処理が成功したらWebSocketで通知
			if (response && response.success && send) {
				send("markAsRead", {
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
				// WebSocketでメッセージをブロードキャスト
				if (send) {
					console.log('Broadcasting message via WebSocket:', response.data);
					send("sendMessage", response.data);
				}
			} else {
				alert("メッセージの送信に失敗しました");
			}
		} catch (error) {
			alert("メッセージの送信に失敗しました");
		}
		animation.endAnimation();
	};

	const handleImageUpload = async (imageData: {
		url: string;
		size: number;
		type: string;
	}) => {
		if (!room) return;

		animation.startAnimation();
		try {
			const response = await requestDB("message", "sendMessage", {
				roomId: room.id,
				senderId: userData.id,
				content: "画像を送信しました",
				imageUrl: imageData.url,
				imageSize: imageData.size,
				imageType: imageData.type
			});

			if (response.success && response.data) {
				// 送信したメッセージを即座に追加
				setMessages(prev => [...prev, response.data]);
				// WebSocketでメッセージをブロードキャスト
				if (send) {
					console.log('Broadcasting image message via WebSocket:', response.data);
					send("sendMessage", response.data);
				}
				setShowImageUpload(false);
			} else {
				alert("画像の送信に失敗しました");
			}
		} catch (error) {
			alert("画像の送信に失敗しました");
		}
		animation.endAnimation();
	};

	const handleIndexChange = (newIndex: number) => {
		setCurrentReservationIndex(newIndex);
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
				<CourseCarousel
					reservations={reservations}
					currentIndex={currentReservationIndex}
					onIndexChange={handleIndexChange}
					isCoach={isCoach}
				/>
			)}

			<div className="p-message__input-area">
				{showImageUpload ? (
					<ImageUploadArea
						ref={imageUploadRef}
						onImageUpload={handleImageUpload}
						userId={userData.id}
					/>
				) : (
					<>
						<div className="p-message__input-outline">
							<MultilineInput
								className="p-message__input"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								minHeight={150}
								maxHeight={150}
								placeholder="メッセージを入力する"
							/>
						</div>
						<div className="p-message__button-group">
							<Button
								className="p-message__image-button"
								onClick={() => {
									setShowImageUpload(true);
									setTimeout(() => imageUploadRef.current?.click(), 0);
								}}
							>
								📷 画像
							</Button>
							<Button
								className="p-message__send-button"
								onClick={handleSendMessage}
								disabled={!message.trim()}
							>
								メッセージを送る
							</Button>
						</div>
					</>
				)}

				{showImageUpload && (
					<Button
						className="p-message__close-image-button"
						onClick={() => setShowImageUpload(false)}
					>
						キャンセル
					</Button>
				)}
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
									src={msg.sender?.icon || defaultIcon}
									round
									objectFit="cover"
								/>
								<div className="p-message__message-name">
									{msg.sender?.name}
								</div>
							</div>

							{msg.imageUrl ? (
								<div className="p-message__message-image-container">
									<img
										src={msg.imageUrl}
										alt="メッセージ画像"
										className="p-message__message-image"
										onClick={() => msg.imageUrl && window.open(msg.imageUrl, '_blank')}
									/>
									{msg.content && msg.content !== "画像を送信しました" && (
										<div className="p-message__message-image-caption">
											{msg.content}
										</div>
									)}
								</div>
							) : (
								<div className="p-message__message-text">
									{msg.content}
								</div>
							)}
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
