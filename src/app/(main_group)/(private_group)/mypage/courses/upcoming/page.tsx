"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import Border from "@/components/border";
import { requestDB } from "@/services/axios";
import { CourseCardUpcoming } from "./courseCardUpcoming";

const CoursesUpcomingPage = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		animation.startAnimation();
	}, []);

	useEffect(() => {
		if (userData) {
			setIsLoading(false);
			animation.endAnimation();
		}
	}, [userData]);

	if (!userData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">受講予定の講座</div>
				<Border />
			</>
		);
	}

	const upcomingReservations = userData.reservations.filter(
		(reservation) =>
			new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() > new Date().getTime()
	);

	const handleCancel = async (reservationId: number) => {
		if (!confirm("本当にキャンセルしますか？")) {
			return;
		}

		animation.startAnimation();
		try {
			const response = await requestDB("reservation", "cancelReservation", {
				reservationId,
			});
			if (response.success) {
				alert("予約をキャンセルしました");
				// ページをリロードして最新のデータを取得
				window.location.reload();
			} else {
				alert("キャンセルに失敗しました");
			}
		} catch (error) {
			alert("キャンセルに失敗しました");
		}
		animation.endAnimation();
	};

	return (
		<>
			<div className="p-mypage__title">受講予定の講座</div>
			<Border />

			{upcomingReservations.length > 0 ? (
				<div className="p-mypage__courses-list">
					{upcomingReservations.map((reservation) => {
						// const props = createCourseCardProps.forReservation(reservation);
						// if (props.type !== "upcoming") return null;

						return (
							<CourseCardUpcoming
								key={reservation.id}
								onMessage={() => {
									if (reservation.room?.roomKey) {
										window.location.href = `/mypage/message/${reservation.room.roomKey}`;
									} else {
										// roomKeyがない場合はメッセージ一覧へ
										window.location.href = "/mypage/message";
									}
								}}
								onReschedule={() => {
									window.location.href = `/courses/course/${reservation.courseId}/reschedule?reservationId=${reservation.id}`;
								}}
							/>
						);
					})}
				</div>
			) : (
				<div className="p-mypage__empty">受講予定の講座はありません</div>
			)}
		</>
	);
};

export default CoursesUpcomingPage;