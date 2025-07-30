"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
// import { MultilineInput } from "@/components/multilineInput";
import { requestDB } from "@/services/axios";
import { useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Border from "@/components/border";
import type { Reservation } from "@/type/models";
// import { getFormattedDate } from "@/services/formatDate";
import { CourseCardCancel } from "./courseCardCancel";
import { useSocket } from "@/hooks/useSocket";
import dayjs from "dayjs";
import "dayjs/locale/ja";

dayjs.locale("ja");

const CoachCancelRequestPage = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const searchParams = useSearchParams()!;
	const reservationId = searchParams.get("reservationId");
	const { socket, isConnected } = useSocket();

	const [reservation, setReservation] = useState<Reservation | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		animation.startAnimation();
		if (!reservationId) {
			alert("予約IDが指定されていません");
			router.push("/mypage/coach/upcoming");
			return;
		}
		fetchReservation();
	}, [reservationId]);

	useEffect(() => {
		if (reservation) {
			animation.endAnimation();
		}
	}, [reservation]);

	const fetchReservation = async () => {
		try {
			const response = await requestDB("reservation", "readReservationById", {
				id: Number.parseInt(reservationId!)
			});

			if (response.success && response.data) {
				if (response.data.course?.coachId !== userData?.id) {
					alert("この予約のキャンセル申請を行う権限がありません");
					router.push("/mypage/coach/upcoming");
					return;
				}
				setReservation(response.data);
			} else {
				alert("予約情報の取得に失敗しました");
				router.push("/mypage/coach/upcoming");
			}
		} catch (error) {
			console.error("Error fetching reservation:", error);
			alert("エラーが発生しました");
			router.push("/mypage/coach/upcoming");
		}
	};

	const handleSubmit = async () => {

		if (!confirm("本当にキャンセル申請を送信しますか？")) {
			return;
		}

		setIsProcessing(true);
		try {
			const response = await requestDB("reservation", "createRefund", {
				reservationId: Number.parseInt(reservationId!),
			});

			if (response.success) {
				// キャンセル申請のメッセージを送信
				if (reservation?.roomId) {
					// 予約日時
					const firstSlot = reservation.timeSlots?.[0];
					const dateTime = firstSlot
						? dayjs(firstSlot.dateTime).format("YYYY年MM月DD日（ddd）HH:mm")
						: "不明";

					const messageText = `【キャンセル申請のお知らせ】\n「${reservation.course?.title || "講座"}」のキャンセル申請が送信されました。\n\n予約日時: ${dateTime}\n\n※コーチよりキャンセル理由などの説明がある場合は、この後メッセージでお伝えします。\n※承認された場合、全額返金されます。`;

					try {
						// メッセージを送信
						const messageResponse = await requestDB("message", "sendMessage", {
							senderId: userData!.id,
							roomId: reservation.roomId,
							content: messageText,
						});

						if (messageResponse.success && socket && isConnected) {
							// Socketでも送信
							socket.emit("sendMessage", {
								roomKey: reservation.room?.roomKey,
								data: messageResponse.data,
							});
						}
					} catch (error) {
						console.error("メッセージ送信エラー:", error);
						// メッセージ送信に失敗してもキャンセル申請は続行
					}
				}

				// UserDataを再取得
				if (fetchUserData) {
					await fetchUserData();
				}
				router.push("/mypage/coach/upcoming/cancel/success");
			} else {
				alert("キャンセル申請の送信に失敗しました");
			}
		} catch (error) {
			console.error("Error submitting cancel request:", error);
			alert("エラーが発生しました");
		} finally {
			setIsProcessing(false);
		}
	};

	if (!userData || !reservation) {
		return (
			<>
				<div className="p-mypage__title">キャンセル申請</div>
				<Border />
			</>
		);
	}

	// const firstTimeSlot = reservation.timeSlots?.[0];
	// const lastTimeSlot = reservation.timeSlots?.[reservation.timeSlots.length - 1];

	return (
		<>
			<div className="p-mypage__title">キャンセル申請</div>
			<Border />

			<div className="p-cancel">
				<CourseCardCancel course={reservation.course} reservation={reservation} />
				<div className="p-cancel__warning">
					<div className="p-cancel__warning-text -big">
						本当にキャンセル申請して<br />
						よろしいですか？<br /><br /></div>
					<div className="p-cancel__warning-text">
						※ユーザーにメッセージで確認を取りましたか？<br />
						コーチ側からのキャンセルは全額返金されます。
					</div>
				</div>
				<div className="p-cancel__buttons">
					<Button
						className="p-cancel__submit"
						onClick={handleSubmit}
						disabled={isProcessing}
					>
						{isProcessing ? "送信中..." : "キャンセル申請する"}
					</Button>
				</div>
			</div>
		</>
	);
};

export default CoachCancelRequestPage;
