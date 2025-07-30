"use client";

import CourseBookingCalendar from "@/app/(component)/courseBookingCalendar";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import defaultImage from "@/assets/image/picture-icon.svg";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { requestDB } from "@/services/axios";
import { formatMinutesToTime } from "@/services/formatMinutes";
import type { Course, Reservation, TimeSlot } from "@/type/models";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import "dayjs/locale/ja";
import { CourseCardReschedule } from "./courseCardReschedule";
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
	const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
	const [chosenSchedule, setChosenSchedule] = useState<string>();
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
		if (courseData?.coach?.id) {
			fetchAvailableTimeSlots(courseData.coach.id);
		}
	}, [courseData]);

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

			// キャンセル済みの確認
			if (reservation.status === 3) { // Canceled = 3
				alert("キャンセル済みの予約は日程変更できません");
				router.push("/mypage/courses/upcoming");
				return;
			}

			// 過去の予約の確認
			const firstSlot = reservation.timeSlots?.[0];
			if (firstSlot) {
				const now = new Date().getTime();
				const classTime = new Date(firstSlot.dateTime).getTime();

				// 過去の予約
				if (classTime < now) {
					alert("過去の予約は日程変更できません");
					router.push("/mypage/courses/completed");
					return;
				}

				// 5日前までの変更か確認
				const daysUntilClass = Math.floor(
					(classTime - now) / (1000 * 60 * 60 * 24)
				);
				if (daysUntilClass < 5) {
					alert("日程変更期限を過ぎています（5日前まで）");
					router.push("/mypage/courses/upcoming");
					return;
				}
			}

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

	const fetchAvailableTimeSlots = async (coachId: number) => {
		try {
			const response = await requestDB("coach", "readAvailableTimeSlots", {
				coachId: coachId,
			});
			if (response.success) {
				const now = dayjs().format("YYYY-MM-DD HH:mm");
				const filteredSlots = response.data.filter(
					(slot: TimeSlot) => slot.dateTime > now && !slot.reservation,
				);
				setAvailableTimeSlots(filteredSlots);
			} else {
				setAvailableTimeSlots([]);
			}
		} catch (error) {
			console.error("Error fetching available time slots:", error);
			setAvailableTimeSlots([]);
		}
	};

	const handleReschedule = async () => {
		if (!chosenSchedule || !courseData) {
			return;
		}
		if (!confirm(`本当にこのスケジュールに変更しますか？`)) return

		try {
			animation.startAnimation();

			const timeSlotIds = getSelectedTimeSlotIds(
				chosenSchedule,
				courseData.duration,
			);

			if (timeSlotIds.length === 0) {
				alert("選択された時間の情報が見つかりません");
				return;
			}

			const requiredSlots = courseData.duration / 30;
			if (timeSlotIds.length !== requiredSlots) {
				alert("選択された時間が利用できません。他の時間を選択してください。");
				return;
			}

			const response = await requestDB("reservation", "rescheduleReservation", {
				id: reservationId,
				customerId: userData!.id,
				newTimeSlotIds: timeSlotIds,
			});

			if (response.success) {
				// 日程変更のメッセージを送信
				if (reservationData?.roomId) {
					// 古い日時情報
					const oldFirstSlot = reservationData.timeSlots?.[0];
					const oldDateTime = oldFirstSlot
						? dayjs(oldFirstSlot.dateTime).format("YYYY年MM月DD日（ddd）HH:mm")
						: "不明";

					// 新しい日時情報
					const newDateTime = dayjs(chosenSchedule).format("YYYY年MM月DD日（ddd）HH:mm");

					const messageText = `【日程変更のお知らせ】\n「${courseData?.title || "講座"}」の日程が変更されました。\n\n変更前: ${oldDateTime}\n変更後: ${newDateTime}\n\nご確認をお願いいたします。`;

					try {
						// メッセージを送信
						const messageResponse = await requestDB("message", "sendMessage", {
							senderId: userData!.id,
							roomId: reservationData.roomId,
							content: messageText,
						});

						if (messageResponse.success && socket && isConnected) {
							socket.emit("sendMessage", {
								roomKey: reservationData.room?.roomKey,
								data: messageResponse.data,
							});
						}
					} catch (error) {
						console.error("メッセージ送信エラー:", error);
					}
				}

				router.push("/mypage/courses/upcoming/reschedule/success?reservationId=" + reservationId);
			} else {
				alert("日程変更に失敗しました");
			}
		} catch (error) {
			console.error("Reschedule error:", error);
			alert("日程変更に失敗しました");
		} finally {
			animation.endAnimation();
		}
	};

	const getSelectedTimeSlotIds = (
		selectedDateTime: string,
		duration: number,
	): number[] => {
		if (!selectedDateTime || !availableTimeSlots.length) return [];

		const requiredSlots = duration / 30;
		const startTime = dayjs(selectedDateTime);
		const timeSlotIds: number[] = [];

		for (let i = 0; i < requiredSlots; i++) {
			const checkTime = startTime.add(i * 30, "minute");
			const matchingSlot = availableTimeSlots.find((slot) =>
				dayjs(slot.dateTime).isSame(checkTime, "minute"),
			);

			if (matchingSlot) {
				timeSlotIds.push(matchingSlot.id);
			}
		}

		return timeSlotIds;
	};

	if (!reservationData || !courseData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">日程変更</div>
				<Border />
			</>
		);
	}

	return (
		<>
			<BackButton className="p-mypage__back" back={() => router.push("/mypage/courses/upcoming")} />
			<div className="p-mypage__title">日程変更</div>
			<Border />

			<div className="p-reschedule">
				<CourseCardReschedule reservation={reservationData} course={courseData} />
				<div className="p-reschedule__calendar u-mt48 u-mb48">
					<CourseBookingCalendar
						availableTimeSlots={availableTimeSlots}
						duration={courseData.duration}
						chosenSchedule={chosenSchedule}
						setChosenSchedule={setChosenSchedule}
					/>
				</div>

				<Button
					className={`p-reschedule__button u-mt48 ${!chosenSchedule ? "-disabled" : ""}`}
					onClick={handleReschedule}
					disabled={!chosenSchedule}
				>
					このスケジュールに変更する
				</Button>
			</div>
		</>
	);
};

export default Page;
