"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { useContext, useEffect, useState, useCallback } from "react";
// import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { requestDB } from "@/services/axios";
import type { TimeSlot } from "@/type/models";
import "dayjs/locale/ja";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrBefore);
dayjs.locale("ja");

interface DayTimeSlot {
	id?: number;
	startTime: string;
	endTime: string;
	hasReservation: boolean;
	ids?: number[]; // マージされたスロットのIDリスト
}

interface DayTimeSlots {
	date: string;
	timeSlots: DayTimeSlot[];
	originalTimeSlots: DayTimeSlot[]; // 元のデータを保持
}

const MyCalendarRegisterPage = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	// const router = useRouter();
	const [currentMonth, setCurrentMonth] = useState(dayjs());
	const [existingTimeSlots, setExistingTimeSlots] = useState<TimeSlot[]>([]);
	const [monthTimeSlots, setMonthTimeSlots] = useState<DayTimeSlots[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// 月表示を初期化する関数
	const initializeMonthView = useCallback((slots: TimeSlot[]) => {
		const daysInMonth = currentMonth.daysInMonth();
		const monthDays: DayTimeSlots[] = [];

		for (let day = 1; day <= daysInMonth; day++) {
			const date = currentMonth.date(day);
			const dateStr = date.format("YYYY-MM-DD");

			// その日のタイムスロットを取得
			const daySlots = slots
				.filter(slot => dayjs(slot.dateTime).format("YYYY-MM-DD") === dateStr)
				.map(slot => ({
					id: slot.id,
					startTime: dayjs(slot.dateTime).format("HH:mm"),
					endTime: dayjs(slot.dateTime).add(30, "minute").format("HH:mm"),
					hasReservation: slot.reservationId != null
				}));

			daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

			// 連続するスロットをマージ（予約の有無に関わらず）
			const mergedSlots: DayTimeSlot[] = [];
			let currentGroup: DayTimeSlot | null = null;
			let groupIds: number[] = [];

			daySlots.forEach((slot) => {
				if (currentGroup === null) {
					// 新しいグループを開始
					currentGroup = { ...slot };
					if (slot.id) groupIds.push(slot.id);
				} else if (currentGroup.endTime === slot.startTime &&
					currentGroup.hasReservation === slot.hasReservation) {
					// 連続していて、かつ予約状態が同じ場合はマージ
					currentGroup.endTime = slot.endTime;
					if (slot.id) groupIds.push(slot.id);
				} else {
					// 連続していないか、予約状態が異なる場合は新しいグループ
					if (groupIds.length > 0 && currentGroup) {
						currentGroup.id = groupIds[0];
						currentGroup.ids = [...groupIds];
					}
					if (currentGroup) {
						mergedSlots.push(currentGroup);
					}
					currentGroup = { ...slot };
					groupIds = slot.id ? [slot.id] : [];
				}
			});

			// 最後のグループを追加
			if (currentGroup !== null) {
				const finalGroup: DayTimeSlot = currentGroup;
				if (groupIds.length > 0) {
					finalGroup.id = groupIds[0];
					finalGroup.ids = [...groupIds];
				}
				mergedSlots.push(finalGroup);
			}

			monthDays.push({
				date: dateStr,
				timeSlots: mergedSlots,
				originalTimeSlots: [...mergedSlots] // 元のデータを保存
			});
		}

		setMonthTimeSlots(monthDays);
	}, [currentMonth]);

	const fetchTimeSlots = useCallback(async () => {
		if (!userData || !userData.id) return;
		try {
			setIsLoading(true);
			const response = await requestDB("coach", "readTimeSlotsByCoachId", {
				coachId: userData.id,
			});

			if (response.success && response.data) {
				setExistingTimeSlots(response.data);
				initializeMonthView(response.data);
			}
		} catch (error) {
			console.error("Error fetching time slots:", error);
		} finally {
			setIsLoading(false);
			animation.endAnimation();
		}
	}, [userData, initializeMonthView]);

	const handleSave = async () => {
		if (!userData) return;

		try {
			setIsSaving(true);

			// 新規作成するタイムスロットを収集
			const timeSlotsToCreate: string[] = [];

			// 現在の月のスロットIDを集める（マージされたグループのIDも含む）
			const allExistingIds: number[] = [];
			existingTimeSlots
				.filter(slot => {
					const slotMonth = dayjs(slot.dateTime).format("YYYY-MM");
					const currentMonthStr = currentMonth.format("YYYY-MM");
					return slotMonth === currentMonthStr;
				})
				.forEach(slot => {
					allExistingIds.push(slot.id);
				});

			// 画面上に表示されているスロットのIDを集める
			const remainingSlotIds: number[] = [];

			monthTimeSlots.forEach(daySlots => {
				daySlots.timeSlots.forEach(slot => {
					if (slot.startTime && slot.endTime) {
						const startTime = dayjs(`${daySlots.date} ${slot.startTime}`);
						const endTime = dayjs(`${daySlots.date} ${slot.endTime}`);

						if (slot.id) {
							// 既存のスロットの場合
							// そのスロットがカバーする範囲の全IDを集める
							if (slot.ids && slot.ids.length > 0) {
								// マージされたスロットの場合、全てのIDを追加
								slot.ids.forEach(id => remainingSlotIds.push(id));
							} else {
								// 単一のスロットの場合
								existingTimeSlots
									.filter(existingSlot => {
										const slotDateTime = dayjs(existingSlot.dateTime);
										return slotDateTime.format("YYYY-MM-DD") === daySlots.date &&
											slotDateTime.format("HH:mm") >= slot.startTime &&
											slotDateTime.format("HH:mm") < slot.endTime;
									})
									.forEach(existingSlot => {
										remainingSlotIds.push(existingSlot.id);
									});
							}
						} else {
							// 新規スロットの場合
							// 30分ごとにタイムスロットを生成
							let current = startTime;
							while (current.isBefore(endTime)) {
								timeSlotsToCreate.push(current.format("YYYY-MM-DD HH:mm"));
								current = current.add(30, "minute");
							}
						}
					}
				});
			});

			// 削除対象のスロットIDを収集（予約がないものだけ）
			const slotsToDelete: number[] = [];
			allExistingIds.forEach(id => {
				const slot = existingTimeSlots.find(s => s.id === id);
				if (slot && !slot.reservationId && !remainingSlotIds.includes(id)) {
					slotsToDelete.push(id);
				}
			});

			const response = await requestDB("coach", "updateTimeSlotsMonthly", {
				coachId: userData.id,
				timeSlots: timeSlotsToCreate,
				deleteSlotIds: slotsToDelete,
				month: currentMonth.format("YYYY-MM")
			});

			if (response.success) {
				alert("タイムスロットを更新しました");
				await fetchUserData(true);
				fetchTimeSlots(); // 再読み込み
			} else {
				alert("更新に失敗しました");
			}
		} catch (error) {
			console.error("Error saving time slots:", error);
			alert("エラーが発生しました");
		} finally {
			setIsSaving(false);
		}
	};

	useEffect(() => {
		animation.startAnimation();
		fetchTimeSlots();
	}, [fetchTimeSlots]);

	const handlePrevMonth = () => {
		const prevMonth = currentMonth.subtract(1, "month");
		// 今月より前には戻れない
		if (prevMonth.isBefore(dayjs().startOf('month'))) {
			return;
		}
		setCurrentMonth(prevMonth);
	};

	const handleNextMonth = () => {
		setCurrentMonth(currentMonth.add(1, "month"));
	};

	const isPrevMonthDisabled = currentMonth.isSameOrBefore(dayjs().startOf('month'), "month");

	const addTimeSlot = (dayIndex: number) => {
		const newMonthTimeSlots = [...monthTimeSlots];
		newMonthTimeSlots[dayIndex].timeSlots.push({
			startTime: "",
			endTime: "",
			hasReservation: false
		});
		setMonthTimeSlots(newMonthTimeSlots);
	};

	const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
		const newMonthTimeSlots = [...monthTimeSlots];
		newMonthTimeSlots[dayIndex].timeSlots.splice(slotIndex, 1);
		setMonthTimeSlots(newMonthTimeSlots);
	};

	const updateTimeSlot = (dayIndex: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
		const newMonthTimeSlots = [...monthTimeSlots];
		newMonthTimeSlots[dayIndex].timeSlots[slotIndex][field] = value;

		// 開始時間を変更した場合、終了時間が開始時間以前ならリセット
		if (field === 'startTime' && value) {
			const slot = newMonthTimeSlots[dayIndex].timeSlots[slotIndex];
			if (slot.endTime && slot.endTime <= value) {
				slot.endTime = '';
			}
		}

		setMonthTimeSlots(newMonthTimeSlots);
	};


	if (!userData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">公開用カレンダー登録</div>
				<Border />
				<div className="p-mypage__loading">Loading...</div>
			</>
		);
	}

	const isCoach = userData.courses && userData.courses.length > 0;

	if (!isCoach) {
		return (
			<>
				<div className="p-mypage__title">公開用カレンダー登録</div>
				<Border />
				<div className="p-mypage__empty">コーチとして講座を開設すると、こちらでスケジュールを登録できます。</div>
			</>
		);
	}

	// カレンダーグリッドの日付配列を作成
	const generateCalendarDates = () => {
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

		return dates;
	};

	// 終日NGかどうかチェック
	const isDateEndNG = (date: dayjs.Dayjs) => {
		const dateStr = date.format('YYYY-MM-DD');
		const daySlots = monthTimeSlots.find(d => d.date === dateStr);
		return daySlots?.timeSlots.length === 0;
	};

	const calendarDates = generateCalendarDates();

	return (
		<>
			<div className="p-mypage__title">公開用カレンダー登録</div>
			<Border />

			<div className="p-calendar-register__note">
				コーチング可能な日程を登録してください。
			</div>

			<div className="p-calendar-register__month-selector">
				<Button
					className={`p-calendar__button ${isPrevMonthDisabled ? "-none" : "-prev"}`}
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

			{/* カレンダー表示 */}
			<div className="p-calendar">
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

					{calendarDates.map((dateObj, idx) => {
						const isEndNG = dateObj.isCurrentMonth && isDateEndNG(dateObj.date);
						const isSunday = idx % 7 === 0;
						const isSaturday = idx % 7 === 6;
						const isFirstColumn = idx % 7 === 0;

						// その日にスケジュールがあるかチェック
						const dateStr = dateObj.date.format('YYYY-MM-DD');
						const date = dayjs(dateObj.date);
						const isPast = date.isBefore(dayjs(), 'day') && dateObj.isCurrentMonth;
						const daySlots = monthTimeSlots.find(d => d.date === dateStr);
						const noSchedule = !isPast && (dateObj.isCurrentMonth && (!daySlots || daySlots.timeSlots.length === 0));

						return (
							<div
								key={idx}
								className={`p-calendar__date ${!dateObj.isCurrentMonth ? "-other-month" : ""
									} ${isEndNG ? "-end-ng" : ""} ${isSunday ? "-sunday" : isSaturday ? "-saturday" : ""
									} ${isFirstColumn ? "-first-column" : ""} ${noSchedule ? "-no-schedule" : ""}  ${isPast ? "-past" : ""}`}
							>
								<div className="p-calendar__date-text">{dateObj.date.date()}</div>
							</div>
						);
					})}
				</div>
			</div>


			<div className="p-calendar-register__days-list">
				{monthTimeSlots.map((daySlots, dayIndex) => {
					const date = dayjs(daySlots.date);
					const isPast = date.isBefore(dayjs(), 'day');
					// 今月の過去の日付かどうか
					const isPastInCurrentMonth = isPast && currentMonth.isSame(dayjs(), 'month');
					const dayOfWeek = date.format('ddd');
					const weekdayMap: { [key: string]: string } = {
						'Sun': '日',
						'Mon': '月',
						'Tue': '火',
						'Wed': '水',
						'Thu': '木',
						'Fri': '金',
						'Sat': '土'
					};
					const weekday = weekdayMap[dayOfWeek] || dayOfWeek;
					const hasReservation = daySlots.timeSlots.some(slot => slot.hasReservation);

					// 今月の過去日付は表示しない
					if (isPastInCurrentMonth) {
						return null;
					}

					return (
						<div key={daySlots.date} className="p-calendar-register__day-section">
							<div className="p-calendar-register__day-header">
								<div className="p-calendar-register__day-info">
									<span className="p-calendar-register__day-number">
										{date.format('D')}日
									</span>
									<span className={`p-calendar-register__day-weekday ${weekday === '日' ? '-sunday' :
										weekday === '土' ? '-saturday' : ''
										}`}>
										({weekday})
									</span>
								</div>
								{!isPastInCurrentMonth && (
									<label className="p-calendar-register__checkbox">
										<input
											type="checkbox"
											checked={daySlots.timeSlots.length === 0}
											onChange={(e) => {
												if (e.target.checked) {
													// 全てのスロットを削除（予約があるものを除く）
													const newSlots = daySlots.timeSlots.filter(slot => slot.hasReservation);
													const newMonthTimeSlots = [...monthTimeSlots];
													newMonthTimeSlots[dayIndex].timeSlots = newSlots;
													setMonthTimeSlots(newMonthTimeSlots);
												} else {
													// チェックを外した時の処理
													const newMonthTimeSlots = [...monthTimeSlots];
													if (daySlots.originalTimeSlots.length > 0) {
														// 元のデータがあれば復元
														newMonthTimeSlots[dayIndex].timeSlots = [...daySlots.originalTimeSlots];
													} else {
														// 元のデータがなければ新しい空のスロットを追加
														newMonthTimeSlots[dayIndex].timeSlots = [{
															startTime: "",
															endTime: "",
															hasReservation: false
														}];
													}
													setMonthTimeSlots(newMonthTimeSlots);
												}
											}}
											disabled={hasReservation}
										/>
										<span>終日NG</span>
									</label>
								)}
							</div>

							{!isPastInCurrentMonth && daySlots.timeSlots.length > 0 && (
								<div className="p-calendar-register__slots-container">
									{daySlots.timeSlots.map((slot, slotIndex) => {
										// 前のスロットの終了時間を取得
										const prevSlotEndTime = slotIndex > 0 ? daySlots.timeSlots[slotIndex - 1].endTime : null;
										// 次のスロットの開始時間を取得
										const nextSlotStartTime = slotIndex < daySlots.timeSlots.length - 1 ? daySlots.timeSlots[slotIndex + 1].startTime : null;

										// 利用可能な開始時間を計算
										const getAvailableStartTimes = () => {
											return Array.from({ length: 48 }, (_, i) => {
												const hour = Math.floor(i / 2);
												const minute = i % 2 === 0 ? '00' : '30';
												const time = `${hour.toString().padStart(2, '0')}:${minute}`;

												// 前のスロットの終了時間より後の時間のみ
												if (prevSlotEndTime && time < prevSlotEndTime) {
													return null;
												}
												// 次のスロットの開始時間より前の時間のみ
												if (nextSlotStartTime && time >= nextSlotStartTime) {
													return null;
												}
												// 終了時間より前の時間のみ
												if (slot.endTime && time >= slot.endTime) {
													return null;
												}
												return time;
											}).filter(time => time !== null);
										};

										// 利用可能な終了時間を計算
										const getAvailableEndTimes = () => {
											return Array.from({ length: 48 }, (_, i) => {
												const hour = Math.floor(i / 2);
												const minute = i % 2 === 0 ? '00' : '30';
												const time = `${hour.toString().padStart(2, '0')}:${minute}`;

												// 開始時間より後の時間のみ
												if (slot.startTime && time <= slot.startTime) {
													return null;
												}
												// 次のスロットの開始時間以前の時間のみ
												if (nextSlotStartTime && time > nextSlotStartTime) {
													return null;
												}
												return time;
											}).filter(time => time !== null);
										};

										return (
											<div key={slotIndex} className="p-calendar-register__slot-row">
												<select
													value={slot.startTime}
													onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)}
													className="p-calendar-register__time-select"
													disabled={slot.hasReservation}
												>
													<option value=""></option>
													{getAvailableStartTimes().map(time => (
														<option key={time} value={time}>{time}</option>
													))}
												</select>
												<span className="p-calendar-register__time-separator">〜</span>
												<select
													value={slot.endTime}
													onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)}
													className="p-calendar-register__time-select"
													disabled={slot.hasReservation}
												>
													<option value=""></option>
													{getAvailableEndTimes().map(time => (
														<option key={time} value={time}>{time}</option>
													))}
												</select>
												{slot.hasReservation ? (
													<span className="p-calendar-register__reserved-label">予約済み</span>
												) : (
													<button
														type="button"
														onClick={() => removeTimeSlot(dayIndex, slotIndex)}
														className="p-calendar-register__remove-button"
													>
														+
													</button>
												)}
											</div>
										);
									})}
									{!daySlots.timeSlots[daySlots.timeSlots.length - 1]?.hasReservation && (
										<button
											type="button"
											onClick={() => addTimeSlot(dayIndex)}
											className="p-calendar-register__add-button"
										>
											+
										</button>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>


			<div className="p-calendar-register__actions">
				<Button
					className="p-mypage__button -primary"
					onClick={handleSave}
					disabled={isSaving}
				>
					{isSaving ? '保存中...' : '保存する'}
				</Button>
			</div>
		</>
	);
};

export default MyCalendarRegisterPage;
