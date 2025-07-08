"use client";

import type { TimeSlot } from "@/type/models";
import dayjs from "dayjs";

interface BookingSlotProps {
	availableTimeSlots: TimeSlot[];
	startTime?: string; // "HH:mm" format
	duration?: number; // minutes
}

const BookingSlot: React.FC<BookingSlotProps> = ({
	availableTimeSlots,
	startTime,
	duration,
}) => {
	const getAvailableTimeRange = () => {
		if (availableTimeSlots.length === 0) return { min: "00:00", max: "23:59" };

		const times = availableTimeSlots.map((slot) =>
			dayjs(slot.dateTime).format("HH:mm"),
		);
		times.sort();

		return {
			min: times[0],
			max: dayjs(availableTimeSlots[availableTimeSlots.length - 1].dateTime)
				.add(30, "minute")
				.format("HH:mm"),
		};
	};

	const { min, max } = getAvailableTimeRange();

	const centerTime = duration
		? dayjs(`2000-01-01 ${startTime}`).add(duration / 2, "minute")
		: undefined;
	const centerTimeNum =
		(centerTime?.hour() ?? 0) + (centerTime?.minute() ?? 0) / 60;

	// 時間が利用可能かチェック
	const isTimeAvailable = (checkTime: string) => {
		return availableTimeSlots.some((slot) => {
			const slotTime = dayjs(slot.dateTime).format("HH:mm");
			const slotEndTime = dayjs(slot.dateTime)
				.add(30, "minute")
				.format("HH:mm");
			return checkTime >= slotTime && checkTime < slotEndTime;
		});
	};

	// 時間バーの描画用データを生成
	const generateTimeBarData = () => {
		const startHour = 0;
		const endHour = 24;
		const totalMinutes = (endHour - startHour) * 60;

		const segments = [];
		for (let i = 0; i < totalMinutes; i += 30) {
			const currentTime = dayjs().hour(startHour).minute(0).add(i, "minute");
			const timeStr = currentTime.format("HH:mm");
			const isAvailable = isTimeAvailable(timeStr);
			if (startTime && duration) {
				const endTime = dayjs(`2000-01-01 ${startTime}`)
					.add(duration, "minute")
					.format("HH:mm");

				segments.push({
					time: timeStr,
					isAvailable,
					isSelected: timeStr >= startTime && timeStr < endTime,
				});
			} else {
				segments.push({
					time: timeStr,
					isAvailable,
					isSelected: false,
				});
			}
		}

		return segments;
	};

	const timeBarData = generateTimeBarData();

	return (
		<div className="p-booking-slot">
			<div className="p-booking-slot__timeline">
				<div className="p-booking-slot__time-labels">
					<span>0時</span>
					<span>6時</span>
					<span>12時</span>
					<span>18時</span>
					<span>24時</span>
				</div>
				<div className="p-booking-slot__bar">
					{timeBarData.map((segment, idx) => (
						<div
							key={idx}
							className={`p-booking-slot__segment ${
								segment.isAvailable ? "-available" : "-unavailable"
							} ${segment.isSelected ? "-selected" : ""}`}
							style={{
								width: `${100 / timeBarData.length}%`,
							}}
						/>
					))}
				</div>
				{startTime && duration && (
					<div
						style={{
							left: `${(100 * centerTimeNum) / 24}%`,
						}}
						className="p-booking-slot__selected-label"
					>
						選択中
					</div>
				)}
			</div>
		</div>
	);
};

export default BookingSlot;
