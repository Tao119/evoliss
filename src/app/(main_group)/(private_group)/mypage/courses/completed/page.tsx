"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import Border from "@/components/border";
import { Pagination } from "@/components/pagination";
import "dayjs/locale/ja";
import { CourseCardCompleted } from "./courseCardCompleted";
import { reservationStatus } from "@/type/models";

dayjs.locale("ja");

const CoursesCompletedPage = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const [isLoading, setIsLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

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
		(reservation) => {
			if (reservation.status === reservationStatus.CancelRequestedByCoach) {
				return false;
			}

			return reservation.status === reservationStatus.Done ||
				reservation.status === reservationStatus.Reviewed
		}
	);

	const totalItems = completedReservations.length;
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentItems = completedReservations.slice(startIndex, endIndex);
	console.log(currentItems)

	return (
		<>
			<div className="p-mypage__title">受講済みの講座</div>
			<Border />

			{completedReservations.length > 0 ? (
				<>
					<div className="p-mypage__courses-list">
						{currentItems.map((reservation) => (
							<CourseCardCompleted
								key={reservation.id}
								reservation={reservation}
								course={reservation.course}
							/>
						))}
					</div>

					{totalItems > itemsPerPage && (
						<div className="p-mypage__pagination">
							<Pagination
								all={totalItems}
								total={itemsPerPage}
								page={currentPage}
								updatePage={setCurrentPage}
							/>
						</div>
					)}
				</>
			) : (
				<div className="p-mypage__empty">受講済みの講座はありません</div>
			)}
		</>
	);
};

export default CoursesCompletedPage;