"use client";

import {
	AnimationContext,
	SocketContext,
	UserDataContext,
} from "@/app/contextProvider";
import defaultIcon from "@/assets/image/user_icon.svg";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { MultilineInput } from "@/components/multilineInput";
import StarRating from "@/components/starRating";
import { requestDB } from "@/services/axios";
import { type Message, type MessageRoom } from "@/type/models";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";

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

	const sortedMessages = roomData?.messages?.sort((a, b) => 
		dayjs(a.sentAt).valueOf() - dayjs(b.sentAt).valueOf()
	) || [];

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
		return <div></div>;
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
	const averageRating: number = 0;

	return (
		<div className="p-message-room l-page -fixed">
			<div className="p-message-room__title">
				{roomData.customerId == userData.id
					? roomData.coach?.name || "Coach"
					: roomData.customer?.name || "Customer"}{" "}
				Chat Room
			</div>

			<div className="p-message-room__coach">
				<ImageBox
					className="p-message-room__coach-icon"
					src={roomData.coach?.icon ?? defaultIcon}
					objectFit="cover"
					round
				/>
				<div className="p-message-room__coach-details">
					<div className="p-message-room__coach-name">
						{roomData.coach?.name || "Coach"}
					</div>
				</div>
			</div>
			<div className="p-message-room__messages" ref={chatFieldRef}>
				{sortedMessages.map((message) => (
					<div
						key={message.id}
						className={`p-message-room__message ${
							message.senderId === userData.id ? "-sent" : "-received"
						}`}
					>
						<div className="p-message-room__content">
							{message.content}
						</div>
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
