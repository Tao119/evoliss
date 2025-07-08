"use client";

import { UserDataContext } from "@/app/contextProvider";
import { useContext } from "react";
import dayjs from "dayjs";
import Border from "@/components/border";

const CoachUpcomingPage = () => {
	const { userData } = useContext(UserDataContext)!;

	if (!userData) {
		return (
			<>
				<div className="p-mypage__title">開講予定の講座</div>
				<Border />
				<div className="p-mypage__loading">Loading...</div>
			</>
		);
	}

	const upcomingSessions = userData.courses.flatMap((course) =>
		course.reservations.filter(
			(reservation) =>
				new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() > new Date().getTime()
		)
	);

	return (
		<>
			<div className="p-mypage__title">開講予定の講座</div>
			<Border />

			{upcomingSessions.length > 0 ? (
				<div className="p-mypage__section">
					{upcomingSessions.map((reservation) => (
						<div key={reservation.id} className="p-mypage__session-item">
							<div className="p-mypage__course-title">
								{reservation.course?.title || "タイトルなし"}
							</div>
							<div className="p-mypage__course-date">
								{reservation.timeSlots?.[0]?.dateTime
									? dayjs(reservation.timeSlots[0].dateTime).format("YYYY/MM/DD HH:mm")
									: "日時未定"
								}
							</div>
							<div className="p-mypage__customer-name">
								受講者: {reservation.customer?.name || "未定"}
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="p-mypage__empty">開講予定の講座はありません</div>
			)}
		</>
	);
};

export default CoachUpcomingPage;