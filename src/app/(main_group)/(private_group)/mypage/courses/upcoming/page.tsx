"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import Border from "@/components/border";
import { requestDB } from "@/services/axios";
import { CourseCardUpcoming } from "./courseCardUpcoming";
import { Pagination } from "@/components/pagination";
import { reservationStatus } from "@/type/models";

const CoursesUpcomingPage = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const [isLoading, setIsLoading] = useState(true);
	const [reservations, setReservations] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	useEffect(() => {
		animation.startAnimation();
		if (userData) {
			fetchReservations();
		}
	}, [userData]);

	const fetchReservations = async () => {
		if (!userData) return;
		
		try {
			const response = await requestDB("reservation", "readReservationsByUserId", {
				userId: userData.id,
			});
			
			if (response.success && response.data) {
				setReservations(response.data);
			}
		} catch (error) {
			console.error("Error fetching reservations:", error);
		} finally {
			setIsLoading(false);
			animation.endAnimation();
		}
	};

	if (!userData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">受講予定の講座</div>
				<Border />
			</>
		);
	}

	// 受講予定の講座をフィルタリング
	const upcomingReservations = reservations.filter(
	(reservation) => {
	// ステータスがConfirmed、Paid、またはキャンセル系
	return reservation.status === reservationStatus.Confirmed ||
	reservation.status === reservationStatus.Paid ||
	reservation.status === reservationStatus.CancelRequestedByCoach ||
	reservation.status === reservationStatus.Canceled ||
	reservation.status === reservationStatus.CanceledByCoach;
	}
	).sort((a, b) => {
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

	console.log(upcomingReservations)

	// ページネーション用のデータ計算
	const totalItems = upcomingReservations.length;
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentItems = upcomingReservations.slice(startIndex, endIndex);

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
				<>
					<div className="p-mypage__courses-list">
						{currentItems.map((reservation) => {
							return (
								<CourseCardUpcoming
									key={reservation.id}
									reservation={reservation}
									course={reservation.course}
								/>
							);
						})}
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
				<div className="p-mypage__empty">受講予定の講座はありません</div>
			)}
		</>
	);
};

export default CoursesUpcomingPage;