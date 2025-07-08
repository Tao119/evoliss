"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import Border from "@/components/border";
import MessageBox from "./messageBox";
import { requestDB } from "@/services/axios";
import { useSocket } from "@/hooks/useSocket";
import type { MessageRoom } from "@/type/models";

const MessagePage = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [messageRooms, setMessageRooms] = useState<MessageRoom[]>([]);
	const { socket } = useSocket();

	useEffect(() => {
		animation.startAnimation();
		fetchMessageRooms();
	}, []);

	// ページがフォーカスされた時に最新のデータを取得
	useEffect(() => {
		const handleFocus = () => {
			fetchMessageRooms();
		};

		window.addEventListener('focus', handleFocus);
		return () => {
			window.removeEventListener('focus', handleFocus);
		};
	}, []);

	// Socket.ioでメッセージの更新を監視
	useEffect(() => {
		if (!socket || !userData) return;

		const handleNewMessage = () => {
			// 新しいメッセージが来たら一覧を更新
			fetchMessageRooms();
		};

		const handleMessagesRead = () => {
			// 既読状態が変更されたら一覧を更新
			fetchMessageRooms();
		};

		socket.on("newMessage", handleNewMessage);
		socket.on("messagesRead", handleMessagesRead);

		return () => {
			socket.off("newMessage", handleNewMessage);
			socket.off("messagesRead", handleMessagesRead);
		};
	}, [socket, userData]);

	const fetchMessageRooms = async () => {
		if (!userData) return;

		try {
			const allRooms = [
				...userData.customerMessageRooms,
				...userData.coachMessageRooms
			];

			// 各ルームの最新のメッセージ情報を取得
			const roomsWithLatestMessages = await Promise.all(
				allRooms.map(async (room) => {
					try {
						const response = await requestDB("message", "readMessageRoomByKey", {
							roomKey: room.roomKey
						});
						return response.data || room;
					} catch (error) {
						console.error("Failed to fetch room:", error);
						return room;
					}
				})
			);

			setMessageRooms(roomsWithLatestMessages);
			setIsLoading(false);
			animation.endAnimation();
		} catch (error) {
			console.error("Failed to fetch message rooms:", error);
			setIsLoading(false);
			animation.endAnimation();
		}
	};


	if (!userData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">メッセージボックス</div>
				<Border />
			</>
		);
	}

	return (
		<>
			<div className="p-mypage__title">メッセージボックス</div>
			<Border />

			{messageRooms.length > 0 ?
				messageRooms.map((room) => {
					const lastMessage = room.messages?.[room.messages.length - 1];
					const otherUser = room.coachId === userData.id ? room.customer : room.coach;

					const hasUnread = room.messages?.some(
						(message) => !message.isRead && message.senderId !== userData.id
					) || false;

					return (
						<div
							key={room.id}
							className="p-message__message-room"
							onClick={() => router.push(`/mypage/message/${room.roomKey}`)}
						>
							<MessageBox
								user={otherUser}
								latestMessage={lastMessage?.content}
								unread={hasUnread}
							/>
						</div>
					);
				})
				: (
					<div className="p-message__empty">メッセージがありません</div>
				)}
		</>
	);
};

export default MessagePage;