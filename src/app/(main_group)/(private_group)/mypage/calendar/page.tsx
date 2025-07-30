"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { requestDB } from "@/services/axios";
import { CourseCardCoachUpcoming } from "../coach/upcoming/courseCardCoachUpcoming";
import type { Reservation } from "@/type/models";
import { reservationStatus } from "@/type/models";
import "dayjs/locale/ja";
import { CourseCardCoachCompleted } from "../coach/completed/courseCardCoachCompleted";

dayjs.locale("ja");

const MyCalendarPage = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const [currentMonth, setCurrentMonth] = useState(dayjs());
	const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
	const [coachReservations, setCoachReservations] = useState<Reservation[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchReservations = useCallback(async () => {
		if (!userData) return;

		try {
			setIsLoading(true);

			// コーチとしての予約を取得
			const coachReservations: Reservation[] = [];
			for (const course of userData.courses) {
				const response = await requestDB("reservation", "readReservationsByCourseId", {
					courseId: course.id,
				});

				if (response.success && response.data) {
					coachReservations.push(...response.data);
				}
			}
			setCoachReservations(coachReservations);

		} catch (error) {
			console.error("Error fetching reservations:", error);
		} finally {
			setIsLoading(false);
			animation.endAnimation();
		}
	}, [userData, animation]);

	useEffect(() => {
		animation.startAnimation();
		if (userData) {
			fetchReservations();
		}
	}, [userData, animation, fetchReservations]);

	// 選択された日付の予約を取得
	const getReservationsForDate = (dateStr: string) => {
		return coachReservations.filter((reservation) => {
			// ステータスチェック（全ての状態を含む）
			const validStatus =
				reservation.status === reservationStatus.Confirmed ||
				reservation.status === reservationStatus.Paid ||
				reservation.status === reservationStatus.Done ||
				reservation.status === reservationStatus.Reviewed ||
				reservation.status === reservationStatus.Canceled ||
				reservation.status === reservationStatus.CanceledByCoach ||
				reservation.status === reservationStatus.CancelRequestedByCoach;

			if (!validStatus) return false;

			// 日付チェック
			if (reservation.courseTime) {
				const courseDateStr = reservation.courseTime.split(' ')[0];
				const courseDate = dayjs(courseDateStr, 'YYYY/MM/DD');
				return courseDate.format('YYYY-MM-DD') === dateStr;
			} else if (reservation.timeSlots && reservation.timeSlots.length > 0) {
				return reservation.timeSlots.some(slot =>
					dayjs(slot.dateTime).format('YYYY-MM-DD') === dateStr
				);
			}

			return false;
		});
	};

	// カレンダーに表示する予約があるかチェック
	const hasReservations = (date: dayjs.Dayjs) => {
		const dateStr = date.format('YYYY-MM-DD');
		return getReservationsForDate(dateStr).length > 0;
	};

	// 選択された日付の予約
	const selectedDateReservations = getReservationsForDate(selectedDate);

	if (!userData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">マイカレンダー</div>
				<Border />
				<div className="p-mypage__loading">Loading...</div>
			</>
		);
	}

	const isCoach = userData.courses && userData.courses.length > 0;

	// カレンダーグリッドの日付配列を作成
	const daysInMonth = currentMonth.daysInMonth();
	const firstDayOfMonth = currentMonth.startOf("month").day();
	const lastDayOfMonth = currentMonth.endOf("month").day();

	// 前月の末日の日付を取得
	const prevMonth = currentMonth.subtract(1, "month");
	const prevMonthDays = prevMonth.daysInMonth();

	// 次月の日付を取得
	const nextMonth = currentMonth.add(1, "month");

	// カレンダーグリッドの日付配列を作成
	const dates: Array<{ date: dayjs.Dayjs; isCurrentMonth: boolean }> = [];

	// 前月の日付を追加
	for (let i = firstDayOfMonth - 1; i >= 0; i--) {
		dates.push({
			date: prevMonth.date(prevMonthDays - i),
			isCurrentMonth: false,
		});
	}

	// 当月の日付を追加
	for (let i = 1; i <= daysInMonth; i++) {
		dates.push({
			date: currentMonth.date(i),
			isCurrentMonth: true,
		});
	}

	// 次月の日付を追加（最終日を含む週の土曜日まで）
	const remainingDaysInWeek = 6 - lastDayOfMonth;
	for (let i = 1; i <= remainingDaysInWeek; i++) {
		dates.push({
			date: nextMonth.date(i),
			isCurrentMonth: false,
		});
	}

	const handlePrevMonth = () => {
		const prevMonth = currentMonth.subtract(1, "month");
		// 今月より前には戻れない
		if (prevMonth.isBefore(dayjs().startOf('month'))) {
			return;
		}
		setCurrentMonth(prevMonth);

		if (dayjs().isSame(prevMonth, "month")) {
			setSelectedDate(dayjs().format("YYYY-MM-DD"));
		} else {
			setSelectedDate(prevMonth.format("YYYY-MM-01"));
		}
	};

	const handleNextMonth = () => {
		const nextMonth = currentMonth.add(1, "month");
		setCurrentMonth(nextMonth);

		if (dayjs().isSame(nextMonth, "month")) {
			setSelectedDate(dayjs().format("YYYY-MM-DD"));
		} else {
			setSelectedDate(nextMonth.format("YYYY-MM-01"));
		}
	};

	const handleDateClick = (dateObj: {
		date: dayjs.Dayjs;
		isCurrentMonth: boolean;
	}) => {
		if (!dateObj.isCurrentMonth) {
			setCurrentMonth(dateObj.date.startOf("month"));
		}
		setSelectedDate(dateObj.date.format("YYYY-MM-DD"));
	};

	// コーチでない場合
	if (!isCoach) {
		return (
			<>
				<div className="p-mypage__title">マイカレンダー</div>
				<Border />
				<div className="p-mypage__empty">コーチとして講座を開設すると、こちらに予約が表示されます。</div>
			</>
		);
	}

	return (
		<>
			<div className="p-mypage__title">マイカレンダー</div>
			<Border />

			<div className="p-mypage__calendar-actions">
				<Button
					className="p-mypage__button -primary"
					onClick={() => router.push('/mypage/calendar/register')}
				>
					公開用カレンダー登録
				</Button>
			</div>

			<div className="p-calendar">
				<div className="p-calendar__header">
					<Button
						className={`p-calendar__button ${currentMonth.isSame(dayjs(), 'month') ? "-none" : "-prev"
							}`}
						onClick={handlePrevMonth}
						disabled={currentMonth.isSame(dayjs(), 'month')}
					></Button>
					<div className="p-calendar__current-month">
						{currentMonth.format("M月")}
					</div>
					<Button
						className="p-calendar__button -next"
						onClick={handleNextMonth}
					></Button>
				</div>

				<div className="p-calendar__grid">
					{["日", "月", "火", "水", "木", "金", "土"].map((day, idx) => (
						<div
							key={day}
							className={`p-calendar__day ${idx === 0 ? "-sunday -first-column" : idx === 6 ? "-saturday" : ""}`}
						>
							{day}
						</div>
					))}

					{dates.map((dateObj, idx) => {
						const isSelected = dateObj.date.format("YYYY-MM-DD") === selectedDate;
						const hasSchedule = hasReservations(dateObj.date);
						const isSunday = idx % 7 === 0;
						const isSaturday = idx % 7 === 6;
						const isFirstColumn = idx % 7 === 0;
						const isToday = dateObj.date.isSame(dayjs(), 'day');
						// 今月の1日より前かどうか
						const isBeforeCurrentMonth = dateObj.date.isBefore(dayjs().startOf('month'), 'day');

						return (
							<div
								key={idx}
								className={`p-calendar__date ${isSelected ? "-active" : ""} ${!dateObj.isCurrentMonth ? "-other-month" : ""
									} ${dateObj.isCurrentMonth && hasSchedule ? "-available" : ""} ${dateObj.isCurrentMonth && !hasSchedule && !isBeforeCurrentMonth ? "-no-schedule" : ""
									} ${isSunday ? "-sunday" : isSaturday ? "-saturday" : ""
									} ${isFirstColumn ? "-first-column" : ""} ${isToday ? "-today" : ""
									} ${isBeforeCurrentMonth ? "-past" : ""}`}
								onClick={() => !isBeforeCurrentMonth && handleDateClick(dateObj)}
							>
								<div className="p-calendar__date-text">{dateObj.date.date()}</div>
								{dateObj.isCurrentMonth && hasSchedule && !isBeforeCurrentMonth && (
									<div className="p-calendar__date-indicator"></div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			<div className="p-mypage__reservations-list">
				{selectedDateReservations.length > 0 ? (
					selectedDateReservations.map((reservation) => (
						<div key={reservation.id} className="p-mypage__reservation-item">

							{(() => {
								// コーチ側の判定ロジック
								let isPast = false;
								let isCompleted = false;

								// ステータスで判定
								if (reservation.status === reservationStatus.Done || 
									reservation.status === reservationStatus.Reviewed) {
									isCompleted = true;
								} else if (reservation.status === reservationStatus.CanceledByCoach) {
									// CanceledByCoachは常にcompletedに表示
									isCompleted = true;
								} else if (reservation.status === reservationStatus.Confirmed) {
									// Confirmedステータスの場合は時間で判定
									if (reservation.courseTime) {
										const [datePart, timePart] = reservation.courseTime.split(' ');
										const endTime = timePart.split('~')[1];
										const endDateTime = dayjs(`${datePart} ${endTime}`);
										isPast = endDateTime.isBefore(dayjs());
									} else if (reservation.timeSlots?.length > 0) {
										const lastSlot = reservation.timeSlots[reservation.timeSlots.length - 1];
										const endDateTime = dayjs(lastSlot.dateTime).add(30, 'minute');
										isPast = endDateTime.isBefore(dayjs());
									}
									isCompleted = isPast;
								}

								return isCompleted ? (
									<CourseCardCoachCompleted
										reservation={reservation}
										userId={userData.id}
									/>
								) : (
									<CourseCardCoachUpcoming
										reservation={reservation}
									/>
								);
							})()}
						</div>
					))
				) : null}
			</div>
		</>
	);
};

export default MyCalendarPage;
