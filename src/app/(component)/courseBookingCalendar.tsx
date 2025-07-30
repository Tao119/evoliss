"use client";

import { Button } from "@/components/button";
import type { TimeSlot } from "@/type/models";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import BookingSlot from "./bookingSlot";
import { Filter } from "@/components/filter";

interface BookingCalendarProps {
	availableTimeSlots: TimeSlot[];
	duration: number;
	chosenSchedule?: string;
	setChosenSchedule: (schedule: string | undefined) => void;
}

const CourseBookingCalendar: React.FC<BookingCalendarProps> = ({
	availableTimeSlots,
	duration,
	chosenSchedule,
	setChosenSchedule,
}) => {
	const [currentMonth, setCurrentMonth] = useState(dayjs());
	const [selectedDate, setSelectedDate] = useState(
		dayjs().format("YYYY-MM-DD")
	);

	const handlePrevMonth = () => {
		const prevMonth = currentMonth.subtract(1, "month");
		setCurrentMonth(prevMonth);

		if (dayjs().isSame(prevMonth, "month")) {
			setSelectedDate(dayjs().format("YYYY-MM-DD"));
			setChosenSchedule(undefined)
		} else {
			setSelectedDate(prevMonth.format("YYYY-MM-01"));
			setChosenSchedule(undefined)
		}
	};
	const handleNextMonth = () => {
		const nextMonth = currentMonth.add(1, "month");
		setCurrentMonth(nextMonth);

		if (dayjs().isSame(nextMonth, "month")) {
			setSelectedDate(dayjs().format("YYYY-MM-DD"));
			setChosenSchedule(undefined)
		} else {
			setSelectedDate(nextMonth.format("YYYY-MM-01"));
			setChosenSchedule(undefined)
		}
	};

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

	useEffect(() => {
		setChosenSchedule(undefined);
	}, [selectedDate, setChosenSchedule]);

	const availableSlots = availableTimeSlots
		.filter((slot) => {
			const slotDate = slot.dateTime.split(" ")[0];
			return slotDate === selectedDate && dayjs(slot.dateTime).isAfter(dayjs());
		})
		.sort((a, b) => a.dateTime.localeCompare(b.dateTime));

	const availableSchedules = availableSlots
		.filter((slot) => {
			const requiredSlots = duration / 30;
			const startTime = dayjs(slot.dateTime);

			for (let i = 0; i < requiredSlots; i++) {
				const checkTime = startTime.add(i * 30, "minute");
				const hasSlot = availableSlots.some((availableSlot) =>
					dayjs(availableSlot.dateTime).isSame(checkTime, "minute")
				);
				if (!hasSlot) {
					return false;
				}
			}
			return true;
		})
		.sort((a, b) => a.dateTime.localeCompare(b.dateTime));

	const hasAvailableSchedule = (date: dayjs.Dayjs) => {
		const dateStr = date.format("YYYY-MM-DD");
		return availableTimeSlots.some((slot) => {
			const slotDate = slot.dateTime.split(" ")[0];
			return slotDate === dateStr && dayjs(slot.dateTime).isAfter(dayjs());
		});
	};

	const handleTimeSlotClick = (dateTime: string) => {
		if (chosenSchedule === dateTime) {
			setChosenSchedule(undefined);
		} else {
			setChosenSchedule(dateTime);
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
		setChosenSchedule(undefined)
	};

	const getEndTime = (dateTime: string) => {
		return dayjs(dateTime).add(duration, "minute");
	};

	const isPrevMonthDisabled =
		currentMonth.isSame(dayjs(), "month") ||
		currentMonth.isBefore(dayjs(), "month");

	return (
		<div className="p-calendar">
			<div className="p-calendar__header">
				<Button
					className={`p-calendar__button ${isPrevMonthDisabled ? "-none" : "-prev"
						}`}
					onClick={handlePrevMonth}
					disabled={isPrevMonthDisabled}
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
						className={`p-calendar__day ${idx === 0 ? "-sunday -first-column" : idx === 6 ? "-saturday" : ""
							}`}
					>
						{day}
					</div>
				))}

				{dates.map((dateObj, idx) => {
					const isSelected = dateObj.date.format("YYYY-MM-DD") === selectedDate;
					const hasSchedule = hasAvailableSchedule(dateObj.date);
					const isSunday = idx % 7 === 0;
					const isSaturday = idx % 7 === 6;
					const isFirstColumn = idx % 7 === 0;

					return (
						<div
							key={idx}
							className={`p-calendar__date ${isSelected ? "-active" : ""} ${!dateObj.isCurrentMonth ? "-other-month" : ""
								} ${dateObj.isCurrentMonth && !hasSchedule ? "-no-schedule" : ""
								} ${dateObj.isCurrentMonth && hasSchedule ? "-available" : ""} ${isSunday ? "-sunday" : isSaturday ? "-saturday" : ""
								} ${isFirstColumn ? "-first-column" : ""}`}
							onClick={() => handleDateClick(dateObj)}
						>
							<div className="p-calendar__date-text">{dateObj.date.date()}</div>
						</div>
					);
				})}
			</div>

			<div className="p-calendar__time-slots">
				<div className="p-calendar__available-times">
					{availableSchedules.length > 0 ? (
						<div className="p-calendar__selector">
							<Filter
								center
								className="p-calendar__selector-item"
								selectedValue={chosenSchedule}
								onChange={(v: string) => handleTimeSlotClick(v)}
								includeDefault
								label="時間を選択"
								options={availableSchedules.map((slot) => ({
									value: slot.dateTime,
									label: dayjs(slot.dateTime).format("HH:mm"),
								}))
								}
							/>
							{"~"}
							<div className="p-calendar__selector-item">
								{chosenSchedule
									? getEndTime(chosenSchedule).format("HH:mm")
									: "時間を選択"}
							</div>
						</div>
					) : (
						<div className="p-calendar__no-slots">
							この日は予約可能な時間がありません
						</div>
					)}
				</div>

				<BookingSlot
					availableTimeSlots={availableSlots}
					startTime={
						chosenSchedule != undefined
							? dayjs(chosenSchedule).format("HH:mm")
							: undefined
					}
					duration={duration}
				/>
			</div>
		</div>
	);
};

export default CourseBookingCalendar;
