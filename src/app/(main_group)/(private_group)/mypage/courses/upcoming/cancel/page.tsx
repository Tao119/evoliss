"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import defaultImage from "@/assets/image/user_icon.svg";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { requestDB } from "@/services/axios";
import { formatMinutesToTime } from "@/services/formatMinutes";
import type { Course, Reservation } from "@/type/models";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import "dayjs/locale/ja";
import { CourseCardReschedule } from "../reschedule/courseCardReschedule";
import { BackButton } from "@/components/backbutton";
import { useSocket } from "@/hooks/useSocket";

dayjs.locale("ja");

const Page = () => {
	const router = useRouter();
	const searchParams = useSearchParams()!;
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const reservationIdStr = searchParams.get("reservationId");
	const reservationId = Number.parseInt(reservationIdStr as string);

	const [reservationData, setReservationData] = useState<Reservation>();
	const [courseData, setCourseData] = useState<Course>();
	const [isLoading, setIsLoading] = useState(true);
	const { socket, isConnected } = useSocket();

	useEffect(() => {
		if (!reservationId || isNaN(reservationId) || !userData) {
			router.push("/mypage/courses/upcoming");
			return;
		}

		fetchReservationAndCourse();
		animation.startAnimation();
	}, [reservationId, userData]);

	useEffect(() => {
		if (reservationData && courseData && !isLoading) {
			animation.endAnimation();
		}
	}, [reservationData, courseData, isLoading]);

	const fetchReservationAndCourse = async () => {
		try {
			// 予約情報を取得
			const response = await requestDB("reservation", "readReservationById", {
				id: reservationId,
			});

			const reservation: Reservation = response.data;

			if (!reservation) {
				router.push("/mypage/courses/upcoming");
				return;
			}

			// ユーザーIDの確認
			if (reservation.customerId !== userData?.id) {
				router.push("/mypage/courses/upcoming");
				return;
			}

			// キャンセルに期限はなし

			setReservationData(reservation);

			// コース情報を取得
			const courseResponse = await requestDB("course", "readCourseById", {
				id: reservation.courseId,
			});
			if (courseResponse.success) {
				setCourseData(courseResponse.data);
			}

			setIsLoading(false);
		} catch (error) {
			console.error("Error fetching data:", error);
			router.push("/mypage/courses/upcoming");
		}
	};

	const handleCancel = async () => {
		if (!confirm("本当にキャンセルしますか？\nこの操作は取り消せません。")) {
			return;
		}

		try {
			animation.startAnimation();

			const response = await requestDB("reservation", "cancelReservation", {
				id: reservationId,
				customerId: userData!.id,
			});

			if (response.success) {
				// キャンセルのメッセージを送信
				if (reservationData?.roomId) {
					// 予約日時
					const firstSlot = reservationData.timeSlots?.[0];
					const dateTime = firstSlot
						? dayjs(firstSlot.dateTime).format("YYYY年MM月DD日（ddd）HH:mm")
						: "不明";

					const messageText = `【キャンセルのお知らせ】\n「${courseData?.title || "講座"}」がキャンセルされました。\n\n予約日時: ${dateTime}`;

					try {
						// メッセージを送信
						const messageResponse = await requestDB("message", "sendMessage", {
							senderId: userData!.id,
							roomId: reservationData.roomId,
							content: messageText,
						});

						if (messageResponse.success && socket && isConnected) {
							// Socketでも送信
							socket.emit("sendMessage", {
								roomKey: reservationData.room?.roomKey,
								data: messageResponse.data,
							});
						}
					} catch (error) {
						console.error("メッセージ送信エラー:", error);
					}
				}

				router.push("/mypage/courses/upcoming/cancel/success?reservationId=" + reservationId);
			} else {
				alert("キャンセルに失敗しました");
			}
		} catch (error) {
			console.error("Cancel error:", error);
			alert("キャンセルに失敗しました");
		} finally {
			animation.endAnimation();
		}
	};

	if (!reservationData || !courseData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">キャンセル確認</div>
				<Border />
			</>
		);
	}

	return (
		<>
			<BackButton className="p-mypage__back" back={() => router.push("/mypage/courses/upcoming")} />
			<div className="p-mypage__title">キャンセル確認</div>
			<Border />

			<div className="p-cancel">

				<CourseCardReschedule reservation={reservationData} course={courseData} />
				<div className="p-cancel__warning">
					<div className="p-cancel__warning-text">
						本当にキャンセルして<br />よろしいですか？<br /><br />
						※既にお支払い済みの場合も、<br />返金はございません。<br />
						ご了承の上、キャンセルをお願いします。
					</div>
				</div>




				<div className="p-cancel__buttons u-mt48">
					<Button
						className="p-cancel__button -danger"
						onClick={handleCancel}
					>
						キャンセルする
					</Button>
				</div>
			</div>
		</>
	);
};

export default Page;
