"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import Border from "@/components/border";

const CoursesCompletedPage = () => {
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
				<div className="p-mypage__title">受講済みの講座</div>
				<Border />
			</>
		);
	}

	const completedReservations = userData.reservations.filter(
		(reservation) =>
			new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() <= new Date().getTime()
	);

	return (
		<>
			<div className="p-mypage__title">受講済みの講座</div>
			<Border />

			{completedReservations.length > 0 ? (
				<div className="p-mypage__section">
					{completedReservations.map((reservation) => (
						<div key={reservation.id} className="p-mypage__reservation-item">
							<div className="p-mypage__course-title">
								{reservation.course?.title || "No Title"}
							</div>
							<div className="p-mypage__course-date">
								{reservation.timeSlots?.[0]?.dateTime
									? dayjs(reservation.timeSlots[0].dateTime).format("YYYY/MM/DD HH:mm")
									: "Date TBD"
								}
							</div>
							<div className="p-mypage__course-coach">
								Coach: {reservation.course?.coach?.name || "TBD"}
							</div>
							<div className="p-mypage__course-price">
								Price: {reservation.course?.price || 0} yen
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="p-mypage__empty">No completed courses</div>
			)}
		</>
	);
};

export default CoursesCompletedPage;