"use client";

import {
	AnimationContext,
	BreakPointContext,
	UserDataContext,
} from "@/app/contextProvider";
import rightIcon from "@/assets/image/arrow_right.svg";
import defaultIcon from "@/assets/image/user_icon.svg";
import { IconButton } from "@/components/iconButton";
import { ImageBox } from "@/components/imageBox";
import { Switcher } from "@/components/switcher";
import { requestDB } from "@/services/axios";
import { Message, type MessageRoom } from "@/type/models";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import {
	type Dispatch,
	type SetStateAction,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import closeImage from "@/assets/image/cross.svg";

interface Props {
	setShowMessagePopup: Dispatch<SetStateAction<boolean>>;
}

const MessagePopup = ({ setShowMessagePopup }: Props) => {
	const { userData } = useContext(UserDataContext)!;
	const { breakpoint, orLower } = useContext(BreakPointContext)!;
	const router = useRouter();
	const animation = useContext(AnimationContext)!;
	enum MessageBoxType {
		General = 0,
		Customer = 1,
	}

	const [messageBoxType, setMessageBoxType] = useState(MessageBoxType.General);

	const onReady = userData;

	const getLatestTimestamp = (room: MessageRoom) => {
		return Math.max(
			...room.messages.map((m) => new Date(m.sentAt).getTime() || 0),
		);
	};

	const rooms = useMemo(() => {
		return [
			...(userData?.customerMessageRooms ?? []),
			...(userData?.coachMessageRooms ?? []),
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
		return <div></div>;
	}

	const openRoom = (roomKey: string) => {
		setShowMessagePopup(false);
		router.push(`/message/${roomKey}`);
	};

	return (
		<div className="p-message">
			{orLower("sp") && (
				<IconButton
					src={closeImage}
					onClick={() => setShowMessagePopup(false)}
					className="p-message__close"
				/>
			)}
			<Switcher
				className="p-message__switcher"
				contents={[
					{ label: "一般", value: MessageBoxType.General },
					{ label: "購入者", value: MessageBoxType.Customer },
				]}
				onChange={(value) => setMessageBoxType(value)}
			/>
			<div className="p-message__list">
				{rooms
					.map((room) => {
						const hasUnread =
							room.messages.some(
								(msg) => !msg.isRead && msg.senderId !== userData.id,
							);

						const latestMessage = room.messages
							.sort(
								(a, b) =>
									new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
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
											? room.coach?.icon
											: room.customer?.icon) ?? defaultIcon
									}
								/>
								<div className="p-message__info">
									<div className="p-message__info-title">
										{room.customerId == userData.id
											? room.coach?.name || "Coach"
											: room.customer?.name || "Customer"}
									</div>

									<div className="p-message__latest">
										{latestMessage?.content || "No messages"}
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
