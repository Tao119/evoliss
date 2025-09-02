"use client";

import type { TimeSlot } from "@/type/models";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

// dayjs プラグインを有効化
dayjs.extend(isSameOrAfter);

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

	getAvailableTimeRange();

	const centerTime = startTime && duration
		? dayjs(`2000-01-01 ${startTime}`).add(duration / 2, "minute")
		: undefined;
	const centerTimeNum = centerTime
		? centerTime.hour() + centerTime.minute() / 60
		: 0;

	// 時間が利用可能かチェック
	const isTimeAvailable = (checkTime: string) => {
		return availableTimeSlots.some((slot) => {
			const slotTime = dayjs(slot.dateTime).format("HH:mm");
			return slotTime === checkTime;
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

			let isSelected = false;
			if (startTime && duration) {
				const startDayjs = dayjs(`2000-01-01 ${startTime}`);
				const endDayjs = startDayjs.add(duration, "minute");
				const currentDayjs = dayjs(`2000-01-01 ${timeStr}`);

				isSelected = currentDayjs.isSameOrAfter(startDayjs) &&
					currentDayjs.isBefore(endDayjs);
			}

			segments.push({
				time: timeStr,
				isAvailable,
				isSelected,
			});
		}

		return segments;
	};

	// グラデーション用のスタイルを生成
	const generateGradientStyle = () => {
		if (timeBarData.length === 0) return {};

		const gradientStops: string[] = [];
		let lastColor = '';

		timeBarData.forEach((segment, idx) => {
			const position = (idx / timeBarData.length) * 100;
			const nextPosition = ((idx + 1) / timeBarData.length) * 100;

			let color = '#666666'; // dark-gray
			if (segment.isSelected) {
				color = '#ffa500'; // orange
			} else if (segment.isAvailable) {
				color = '#999999'; // gray
			}

			if (idx === 0 || color !== lastColor) {
				if (idx > 0) {
					gradientStops.push(`${lastColor} ${position}%`);
				}
				gradientStops.push(`${color} ${position}%`);
			}

			if (idx === timeBarData.length - 1) {
				gradientStops.push(`${color} ${nextPosition}%`);
			}

			lastColor = color;
		});

		return {
			background: `linear-gradient(to right, ${gradientStops.join(', ')})`
		};
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
				<div className="p-booking-slot__bar" style={generateGradientStyle()}>
					{/* グラデーションで表示するため、個別のセグメントは不要
					<div className="p-booking-slot__segments">
						{timeBarData.map((segment, idx) => (
							<div
								key={idx}
								className={`p-booking-slot__segment ${
									segment.isAvailable ? "-available" : "-unavailable"
								} ${segment.isSelected ? "-selected" : ""}`}
								style={{
									width: `calc(${100 / timeBarData.length}% + 1px)`,
								}}
							/>
						))}
					</div>
					*/}
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
