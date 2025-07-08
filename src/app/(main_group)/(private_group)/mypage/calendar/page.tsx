"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import Border from "@/components/border";

const CalendarPage = () => {
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
				<div className="p-mypage__title">コーチカレンダー</div>
				<Border />
			</>
		);
	}

	const upcomingReservations = userData.reservations.filter(
		(reservation) =>
			new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() >= new Date().getTime()
	);

	const pastReservations = userData.reservations.filter(
		(reservation) =>
			new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() < new Date().getTime()
	);

	return (
		<>
			<div className="p-mypage__title">コーチカレンダー</div>
			<Border />

			{upcomingReservations.length > 0 && (
				<div className="p-mypage__section">
					<div className="p-mypage__subtitle">Upcoming Sessions</div>
					<div className="p-mypage__reservations">
						{upcomingReservations.map((reservation) => (
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
							</div>
						))}
					</div>
				</div>
			)}

			{pastReservations.length > 0 && (
				<div className="p-mypage__section">
					<div className="p-mypage__subtitle">Completed Sessions</div>
					<div className="p-mypage__reservations">
						{pastReservations.map((reservation) => (
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
							</div>
						))}
					</div>
				</div>
			)}

			{upcomingReservations.length === 0 && pastReservations.length === 0 && (
				<div className="p-mypage__section">
					<div className="p-mypage__empty">No scheduled sessions</div>
				</div>
			)}
		</>
	);
};

export default CalendarPage;