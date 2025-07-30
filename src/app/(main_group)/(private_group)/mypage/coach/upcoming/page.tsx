"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import Border from "@/components/border";
import { Pagination } from "@/components/pagination";
import { requestDB } from "@/services/axios";
import { reservationStatus } from "@/type/models";
import type { Reservation } from "@/type/models";
import "dayjs/locale/ja";
import { CourseCardCoachUpcoming } from "./courseCardCoachUpcoming";

dayjs.locale("ja");

const CoachUpcomingPage = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const itemsPerPage = 5;

	useEffect(() => {
		animation.startAnimation();
		fetchReservations();
	}, []);

	useEffect(() => {
		if (!isLoading && reservations.length >= 0) {
			animation.endAnimation();
		}
	}, [isLoading, reservations]);

	const fetchReservations = async () => {
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

			// 開講予定の予約をフィルタリング
			const upcomingReservations = allReservations.filter((reservation) => {

				// ステータスがConfirmed、Paid、またはキャンセル系
				const validStatus = reservation.status === reservationStatus.Confirmed ||
					reservation.status === reservationStatus.Paid ||
					reservation.status === reservationStatus.CancelRequestedByCoach ||
					reservation.status === reservationStatus.Canceled ||
					reservation.status === reservationStatus.CanceledByCoach;

				return validStatus;
			}).sort((a, b) => {
				// courseTimeでソート（キャンセル済み講座も含むため）
				if (a.courseTime && b.courseTime) {
					// courseTimeは "YYYY/MM/DD HH:mm~HH:mm" 形式
					// 日付部分を抽出して比較
					const aDateStr = a.courseTime.split(' ')[0] + ' ' + a.courseTime.split(' ')[1].split('~')[0];
					const bDateStr = b.courseTime.split(' ')[0] + ' ' + b.courseTime.split(' ')[1].split('~')[0];
					const aDate = new Date(aDateStr.replace(/\//g, '-'));
					const bDate = new Date(bDateStr.replace(/\//g, '-'));
					return aDate.getTime() - bDate.getTime();
				}
				// courseTimeがない場合はtimeSlotsでソート（互換性のため）
				if (!a.courseTime && a.timeSlots && a.timeSlots.length > 0 &&
					!b.courseTime && b.timeSlots && b.timeSlots.length > 0) {
					const aDate = new Date(a.timeSlots[0].dateTime);
					const bDate = new Date(b.timeSlots[0].dateTime);
					return aDate.getTime() - bDate.getTime();
				}
				// 片方にcourseTimeがある場合
				return 0;
			});

			setReservations(upcomingReservations);
		} catch (error) {
			console.error("Error fetching reservations:", error);
		} finally {
			setIsLoading(false);
		}
	};

	if (!userData) {
		return (
			<>
				<div className="p-mypage__title">開講予定の講座</div>
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
	const displayCount = Math.min(endIndex, totalItems) - startIndex;

	return (
		<>
			<div className="p-mypage__title">開講予定の講座</div>
			<Border />

			{reservations.length > 0 ? (
				<>
					<div className="p-mypage__courses-list">
						{currentItems.map((reservation) => (
							<CourseCardCoachUpcoming
								key={reservation.id}
								reservation={reservation}
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
				<div className="p-mypage__empty">開講予定の講座はありません</div>
			)}
		</>
	);
};

export default CoachUpcomingPage;