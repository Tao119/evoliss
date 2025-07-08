"use client";

import plusIcon from "@/assets/image/plus_white.svg";
import { Button } from "@/components/button";
import { IconButton } from "@/components/iconButton";
import dayjs from "dayjs";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

interface TimeSlot {
	id?: number;
	coachId: number;
	dateTime: string;
}

interface ScheduleManagementCalendarProps {
	timeSlots: TimeSlot[];
	setTimeSlots: Dispatch<SetStateAction<TimeSlot[]>>;
	coachId: number;
}

const ScheduleManagementCalendar: React.FC<ScheduleManagementCalendarProps> = ({
	timeSlots,
	setTimeSlots,
	coachId,
}) => {
	const [currentMonth, setCurrentMonth] = useState(dayjs());

	const generateMonthDates = () => {
		const startOfMonth = currentMonth.startOf("month");
		const endOfMonth = currentMonth.endOf("month");
		const dates = [];

		for (
			let date = startOfMonth;
			date.isBefore(endOfMonth) || date.isSame(endOfMonth, "day");
			date = date.add(1, "day")
		) {
			dates.push(date);
		}

		return dates;
	};

	const monthDates = generateMonthDates();

	const getTimeSlotsForDate = (date: dayjs.Dayjs) => {
		const dateStr = date.format("YYYY-MM-DD");
		return timeSlots
			.filter((slot) => slot.dateTime.startsWith(dateStr))
			.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
	};

	const addTimeSlot = (date: dayjs.Dayjs, time = "09:00") => {
		const dateTime = `${date.format("YYYY-MM-DD")} ${time}`;
		const newSlot: TimeSlot = {
			coachId,
			dateTime,
		};
		setTimeSlots((prev) => [...prev, newSlot]);
	};

	const removeTimeSlot = (dateTime: string) => {
		setTimeSlots((prev) => prev.filter((slot) => slot.dateTime !== dateTime));
	};

	const updateTimeSlot = (oldDateTime: string, newTime: string) => {
		const date = oldDateTime.split(" ")[0];
		const newDateTime = `${date} ${newTime}`;

		setTimeSlots((prev) =>
			prev.map((slot) =>
				slot.dateTime === oldDateTime
					? { ...slot, dateTime: newDateTime }
					: slot,
			),
		);
	};

	const hasTimeSlots = (date: dayjs.Dayjs) => {
		return getTimeSlotsForDate(date).length > 0;
	};

	return (
		<div className="p-schedule-calendar">
			<div className="p-schedule-calendar__header">
				<h2 className="p-schedule-calendar__title">マイカレンダー</h2>
			</div>

			<div className="p-schedule-calendar__month-nav">
				<div className="p-schedule-calendar__current-month">
					{currentMonth.format("M月")}
				</div>
				<div className="p-schedule-calendar__nav-buttons">
					<Button
						className="p-schedule-calendar__nav-button"
						onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
					>
						{"<"}
					</Button>
					<Button
						className="p-schedule-calendar__nav-button"
						onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
					>
						{">"}
					</Button>
				</div>
			</div>

			<div className="p-schedule-calendar__grid">
				{["日", "月", "火", "水", "木", "金", "土"].map((day, idx) => (
					<div key={day} className="p-schedule-calendar__day-header">
						{day}
					</div>
				))}

				{Array.from({ length: currentMonth.startOf("month").day() }).map(
					(_, idx) => (
						<div
							key={`empty-${idx}`}
							className="p-schedule-calendar__date -null"
						></div>
					),
				)}

				{monthDates.map((date, idx) => (
					<div
						key={date.format("YYYY-MM-DD")}
						className={`p-schedule-calendar__date ${
							date && hasTimeSlots(date) ? "-has-schedule" : ""
						}`}
					>
						{date.date()}
					</div>
				))}
			</div>

			<div className="p-schedule-calendar__daily-schedule">
				{monthDates.map((date) => {
					const dateSlots = getTimeSlotsForDate(date);
					const dayName = date.format("M月D日 (dd)");

					return (
						<div
							key={date.format("YYYY-MM-DD")}
							className="p-schedule-calendar__day-row"
						>
							<div className="p-schedule-calendar__day-label">{dayName}</div>
							<div className="p-schedule-calendar__time-inputs">
								{dateSlots.map((slot, timeIdx) => {
									const time = slot.dateTime.split(" ")[1]; // "HH:mm" 部分を取得
									return (
										<div
											key={timeIdx}
											className="p-schedule-calendar__time-slot"
										>
											<input
												type="time"
												value={time}
												onChange={(e) =>
													updateTimeSlot(slot.dateTime, e.target.value)
												}
												className="p-schedule-calendar__time-input"
											/>
											<button
												onClick={() => removeTimeSlot(slot.dateTime)}
												className="p-schedule-calendar__remove-time"
											>
												×
											</button>
										</div>
									);
								})}
								<button
									onClick={() => addTimeSlot(date)}
									className="p-schedule-calendar__add-time"
								>
									+
								</button>
							</div>
						</div>
					);
				})}
			</div>

			<div className="p-schedule-calendar__submit">
				<Button className="p-schedule-calendar__submit-button">登録する</Button>
			</div>
		</div>
	);
};

export default ScheduleManagementCalendar;
