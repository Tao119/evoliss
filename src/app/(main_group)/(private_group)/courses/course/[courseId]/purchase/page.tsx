"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import { requestDB } from "@/services/axios";
import type { Course } from "@/type/models";
import dayjs from "dayjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const Page = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const [courseData, setCourseData] = useState<Course>();
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const { gameId, courseId } = useParams()!;
	const searchParams = useSearchParams()!;

	const dateTimeParam = searchParams.get("dateTime"); // "YYYY-MM-DD HH:mm" format
	const durationParam = searchParams.get("duration");

	const courseIdNumber = Number.parseInt(courseId as string);
	const duration = durationParam ? Number.parseInt(durationParam) : 0;

	const onReady = userData && courseData && dateTimeParam && duration;

	useEffect(() => {
		fetchCourse();
		animation.startAnimation();
	}, []);

	useEffect(() => {
		if (onReady) {
			animation.endAnimation();
		}
	}, [onReady]);

	useEffect(() => {
		if (onReady) {
			const availableSlots = courseData.coach.timeSlots.filter((slot) => {
				const slotDate = slot.dateTime.split(" ")[0];
				const selectedDate = dateTimeParam.split(" ")[0];
				return (
					slotDate === selectedDate && dayjs(slot.dateTime).isAfter(dayjs())
				);
			});

			const requiredSlots = duration / 30;
			const selectedStartTime = dayjs(dateTimeParam);

			let isValidSchedule = true;
			for (let i = 0; i < requiredSlots; i++) {
				const checkTime = selectedStartTime.add(i * 30, "minute");
				const hasSlot = availableSlots.some(
					(slot) =>
						dayjs(slot.dateTime).isSame(checkTime, "minute") &&
						!slot.reservation,
				);
				if (!hasSlot) {
					isValidSchedule = false;
					break;
				}
			}

			if (!isValidSchedule) {
				alert("選択された時間は既に予約済みか利用できません");
				router.push(`/courses/course/${courseId}`);
				return;
			}
		}
	}, [onReady, dateTimeParam, duration]);

	const fetchCourse = async () => {
		try {
			const response = await requestDB("course", "readCourseById", {
				id: courseIdNumber,
			});
			if (response.success) {
				setCourseData(response.data);
			} else {
				animation.endAnimation();
				alert("コース情報の取得中にエラーが発生しました");
			}
		} catch (error) {
			console.error("Error fetching courses:", error);
			animation.endAnimation();
			alert("コース情報の取得中にエラーが発生しました");
		}
	};

	if (!onReady) {
		return <div></div>;
	}

	const handlePurchase = async () => {
		if (!dateTimeParam || !duration) {
			alert("必要な情報が不足しています");
			return;
		}

		try {
			const response = await fetch("/api/create-checkout-session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: courseData.price,
					userId: userData.id,
					courseId: courseIdNumber,
					courseName: courseData.title,
					startDateTime: dateTimeParam,
					duration: duration,
					coachId: courseData.coachId,
				}),
			});

			const data = await response.json();
			if (data.ok) {
				window.location.href = data.sessionUrl;
			} else {
				alert(`決済エラーが発生しました: ${data.message}`);
			}
		} catch (error) {
			console.error("Purchase error:", error);
			alert("決済処理中にエラーが発生しました");
		}
	};

	const handleBack = () => {
		router.push(`/courses/course/${courseId}`);
	};

	const endDateTime = dayjs(dateTimeParam).add(duration, "minute");

	return (
		<div className="p-courses-purchase l-page">
			<div className="p-courses-purchase__title">選択した講座</div>
			<div className="p-courses-purchase__course">
				<div className="p-courses-purchase__info">
					<div className="p-courses-purchase__info-title">
						{courseData.title}
					</div>
					<div className="p-courses-purchase__info-coach">
						講師: {courseData.coach.name}
					</div>
					<div className="p-courses-purchase__info-game">
						ゲーム: {courseData.game.name}
					</div>
				</div>
				<div className="p-courses-purchase__details">
					<div className="p-courses-purchase__info-duration">{duration}分</div>
					<div className="p-courses-purchase__info-price">
						￥{courseData.price.toLocaleString("ja-JP")}
					</div>
				</div>
			</div>

			<div className="p-courses-purchase__title">受講する日程</div>
			<div className="p-courses-purchase__schedule">
				<div className="p-courses-purchase__date">
					{dayjs(dateTimeParam).format("YYYY年M月D日")}
				</div>
				<div className="p-courses-purchase__time">
					{dayjs(dateTimeParam).format("HH:mm")} ～{" "}
					{endDateTime.format("HH:mm")}
				</div>
			</div>

			<div className="p-courses-purchase__actions">
				<Button
					className="p-courses-purchase__back-button"
					onClick={handleBack}
				>
					戻る
				</Button>
				<Button className="p-courses-purchase__submit" onClick={handlePurchase}>
					購入を確定する
				</Button>
			</div>
		</div>
	);
};

export default Page;
