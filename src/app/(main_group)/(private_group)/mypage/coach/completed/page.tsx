"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { useContext, useEffect, useState, useCallback } from "react";
// import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import Border from "@/components/border";
import { Pagination } from "@/components/pagination";
import { requestDB } from "@/services/axios";
import { reservationStatus } from "@/type/models";
import type { Reservation } from "@/type/models";
import "dayjs/locale/ja";
import { CourseCardCoachCompleted } from "./courseCardCoachCompleted";

dayjs.locale("ja");

const CoachCompletedPage = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	// const router = useRouter();
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const itemsPerPage = 5;

	const fetchReservations = useCallback(async () => {
		if (!userData) return;

		try {
			setIsLoading(true);
			// コーチの全ての予約を取得
			const allReservations: Reservation[] = [];

			for (const course of userData.courses) {
				const response = await requestDB("reservation", "readReservationsByCourseId", {
					courseId: course.id,
				});

				if (response.success && response.data) {
					allReservations.push(...response.data);
				}
			}

			// 開講済みの予約をフィルタリング
			const completedReservations = allReservations.filter((reservation) => {
				if (!reservation.timeSlots || reservation.timeSlots.length === 0) return false;

				// CancelRequestedByCoachは予定ページに表示するため除外
				if (reservation.status === reservationStatus.CancelRequestedByCoach) {
					return false;
				}

				// 最後のタイムスロットが過去の日時
				const lastSlot = reservation.timeSlots[reservation.timeSlots.length - 1];
				const isCompleted = new Date(lastSlot.dateTime).getTime() + 30 * 60 * 1000 < new Date().getTime();

				// ステータスがConfirmed, Done, Reviewed、またはCanceledByCoach
				const validStatus =
					reservation.status === reservationStatus.Confirmed ||
					reservation.status === reservationStatus.Done ||
					reservation.status === reservationStatus.Reviewed


				return isCompleted && validStatus;
			}).sort((a, b) => {
				// 日時順でソート（新しい順）
				const aDate = new Date(a.timeSlots[a.timeSlots.length - 1].dateTime);
				const bDate = new Date(b.timeSlots[b.timeSlots.length - 1].dateTime);
				return bDate.getTime() - aDate.getTime();
			});

			setReservations(completedReservations);
		} catch (error) {
			console.error("Error fetching reservations:", error);
		} finally {
			setIsLoading(false);
		}
	}, [userData]);

	useEffect(() => {
		animation.startAnimation();
		fetchReservations();
	}, [animation, fetchReservations]);

	useEffect(() => {
		if (!isLoading && reservations.length >= 0) {
			animation.endAnimation();
		}
	}, [isLoading, reservations, animation]);



	const handleStatusUpdate = () => {
		// ステータス更新後にデータを再取得
		fetchReservations();
	};

	if (!userData) {
		return (
			<>
				<div className="p-mypage__title">開講済みの講座</div>
				<Border />
				<div className="p-mypage__loading">Loading...</div>
			</>
		);
	}

	// ページネーション用のデータ計算
	const totalItems = reservations.length;
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentItems = reservations.slice(startIndex, endIndex);

	return (
		<>
			<div className="p-mypage__title">開講済みの講座</div>
			<Border />

			{reservations.length > 0 ? (
				<>
					<div className="p-mypage__courses-list">
						{currentItems.map((reservation) => (
							<CourseCardCoachCompleted
								key={reservation.id}
								reservation={reservation}
								onStatusUpdate={handleStatusUpdate}
								userId={userData.id}
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
				<div className="p-mypage__empty">開講済みの講座はありません</div>
			)}
		</>
	);
};

export default CoachCompletedPage;