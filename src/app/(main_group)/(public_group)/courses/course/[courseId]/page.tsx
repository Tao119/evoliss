"use client";

import CourseBookingCalendar from "@/app/(component)/courseBookingCalendar";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import defaultImage from "@/assets/image/picture-icon.svg";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import StarRating from "@/components/starRating";
import { Axios, requestDB } from "@/services/axios";
import { formatMinutesToTime } from "@/services/formatMinutes";
import type { Course, TimeSlot } from "@/type/models";
import dayjs from "dayjs";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";

import youtubeIcon from "@/assets/image/youtube.svg";
import xIcon from "@/assets/image/x.svg";
import noteIcon from "@/assets/image/note.svg";
import Link from "next/link";
import { BackButton } from "@/components/backbutton";

const Page = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const [courseData, setCourseData] = useState<Course>();
	const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const path = usePathname()
	const { courseId } = useParams()!;
	const courseIdNumber = Number.parseInt(courseId as string);

	const [chosenSchedule, setChosenSchedule] = useState<string>();

	const onReady = courseData;

	useEffect(() => {
		fetchCourse();
		animation.startAnimation();
	}, []);

	useEffect(() => {
		if (courseData?.coach?.id) {
			fetchAvailableTimeSlots(courseData.coach.id);
		}
	}, [courseData]);


	useEffect(() => {
		if (onReady) {
			animation.endAnimation();
			// requestDB("access", "createAccess", {
			// 	userId: userData?.id,
			// 	courseId: courseIdNumber,
			// });
		}
	}, [onReady]);

	useEffect(() => {
		const intervalId = setInterval(() => {
			fetchCourse();
			if (courseData?.coach?.id) {
				fetchAvailableTimeSlots(courseData.coach.id);
			}
		}, 60 * 1000);

		return () => clearInterval(intervalId);
	}, [courseData?.coach?.id]);

	const fetchCourse = async () => {
		try {
			const response = await requestDB("course", "readCourseById", {
				id: courseIdNumber,
			});
			if (response.success) {
				// 非公開チェック
				if (!response.data.isPublic) {
					animation.endAnimation();
					alert("非公開の講座です");
					router.push("/courses");
					return;
				}
				console.log(response.data)
				setCourseData(response.data);
			} else {
				animation.endAnimation();
				alert("コース情報の取得中にエラーが発生しました");
			}
		} catch (error) {
			console.error("Error fetching courses:", error);
		}
	};

	const fetchAvailableTimeSlots = async (coachId: number) => {
		try {
			const response = await requestDB("coach", "readAvailableTimeSlots", {
				coachId: coachId,
			});
			if (response.success) {
				const now = dayjs().format("YYYY-MM-DD HH:mm");
				const filteredSlots = response.data.filter(
					(slot: TimeSlot) => slot.dateTime > now && !slot.reservation,
				);
				setAvailableTimeSlots(filteredSlots);
			} else {
				console.error("Failed to fetch available time slots");
				setAvailableTimeSlots([]);
			}
		} catch (error) {
			console.error("Error fetching available time slots:", error);
			setAvailableTimeSlots([]);
		}
	};

	if (!onReady) {
		return <div></div>;
	}

	const coach = courseData?.coach;

	const updateChosenSchedule = (schedule: string | undefined) => {
		setChosenSchedule(schedule);
	};

	const averageRating: number =
		coach?.courses &&
			coach.courses.length > 0 &&
			coach.courses.reduce(
				(totalCount, course) =>
					totalCount + (course.reviews ? course.reviews.length : 0),
				0,
			) != 0
			? coach.courses.reduce(
				(totalScore, course) =>
					totalScore +
					(course.reviews
						? course.reviews.reduce((sum, review) => sum + review.rating, 0)
						: 0),
				0,
			) /
			coach.courses.reduce(
				(totalCount, course) =>
					totalCount + (course.reviews ? course.reviews.length : 0),
				0,
			)
			: 0;


	const reviewNum = coach?.courses
		? coach.courses.reduce(
			(total, course) => total + (course.reviews?.length || 0),
			0,
		)
		: 0;

	const handleLogin = () => {
		if (userData) { return }
		router.push(`/sign-in?callback=${path}`)
	}

	const handlePurchase = async () => {
		if (!chosenSchedule) {
			return;
		}

		if (!userData) {
			handleLogin()
			return
		}

		try {
			const timeSlotIds = getSelectedTimeSlotIds(
				chosenSchedule,
				courseData.duration,
			);

			if (timeSlotIds.length === 0) {
				alert("選択された時間の情報が見つかりません");
				return;
			}

			const requiredSlots = courseData.duration / 30;
			if (timeSlotIds.length !== requiredSlots) {
				alert("選択された時間が利用できません。他の時間を選択してください。");
				return;
			}

			const response = await fetch("/api/create-checkout-session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: courseData.price,
					userId: userData.id,
					courseId: courseIdNumber,
					courseName: courseData.title,
					timeSlotIds: timeSlotIds,
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

	const getSelectedTimeSlotIds = (
		selectedDateTime: string,
		duration: number,
	): number[] => {
		if (!selectedDateTime || !availableTimeSlots.length) return [];

		const requiredSlots = duration / 30;
		const startTime = dayjs(selectedDateTime);
		const timeSlotIds: number[] = [];

		for (let i = 0; i < requiredSlots; i++) {
			const checkTime = startTime.add(i * 30, "minute");
			const matchingSlot = availableTimeSlots.find((slot) =>
				dayjs(slot.dateTime).isSame(checkTime, "minute"),
			);

			if (matchingSlot) {
				timeSlotIds.push(matchingSlot.id);
			}
		}

		return timeSlotIds;
	};

	return (
		<div className="p-courses l-page">
			<BackButton className="p-courses__back" back={() => {
				router.back();
				router.push("/courses");
			}} />
			{/* <div className="p-courses__navigation">
        <div
          className="p-courses__navigation-item -navi"
          onClick={() => router.push("/courses/coach")}
        >
          コーチ一覧
        </div>
        <div className="p-courses__navigation-item">{">"}</div>
        <div
          className="p-courses__navigation-item -navi"
          onClick={() => router.push(`/courses/coach/${coach.id}`)}
        >
          {coach.name}
        </div>
        <div className="p-courses__navigation-item">{">"}</div>
        <div className="p-courses__navigation-item">{courseData.title}</div>
      </div> */}
			<div className="p-courses__section">
				<div className="p-courses__title">講座詳細</div>
				<Border />
				<div className="p-courses__coach u-mt48">
					<ImageBox
						className="p-courses__coach-icon"
						src={coach.icon ?? defaultImage}
						round
						objectFit="cover"
					/>
					<div className="p-courses__coach-detail">
						<div className="p-courses__coach-name">{coach.name}</div>

						<div className="p-courses__coach-game u-mb24">
							{coach.game?.name ?? "登録なし"}
						</div>
						<div className="p-courses__coach-rating">
							<StarRating
								className="p-courses__coach-rating-star"
								score={averageRating}
							/>
							({reviewNum}件)
						</div>
						<div className="p-courses__coach-sns">
							{coach.youtube && (
								<Link href={coach.youtube} target="_blank" rel="noopener noreferrer">
									<ImageBox
										className="p-courses__coach-sns-icon"
										src={youtubeIcon}
										alt="YouTube"
									/>
								</Link>
							)}
							{coach.x && (
								<Link href={coach.x} target="_blank" rel="noopener noreferrer">
									<ImageBox
										className="p-courses__coach-sns-icon"
										src={xIcon}
										alt="X"
									/>
								</Link>
							)}
							{coach.note && (
								<Link href={coach.note} target="_blank" rel="noopener noreferrer">
									<ImageBox
										className="p-courses__coach-sns-icon"
										src={noteIcon}
										alt="note"
									/>
								</Link>
							)}
						</div>
					</div>
				</div>
			</div>
			<div className="p-course">
				<div className="p-course__content">
					<ImageBox
						src={courseData.image ?? defaultImage}
						className="p-course__image"
						objectFit="cover"
					/>
					<div className="p-course__game">
						{courseData.game?.name ?? "登録なし"}
					</div>
					<div className="p-course__title">{courseData.title}</div>
					<div className="p-course__price">
						{courseData.price}円 / {formatMinutesToTime(courseData.duration)}
					</div>
					<div className="p-course__tags">
						{courseData.tagCourses.slice(0, 3).map((t, i) => (
							<div key={i} className="p-course__tag">
								<div className="p-course__tag-text">{t.tag.name}</div>
							</div>
						))}
					</div>
					<div className="p-course__description u-mt36 u-mb48">
						{courseData.description}
					</div>

					<div className="p-course__section u-mb64">
						<CourseBookingCalendar
							availableTimeSlots={availableTimeSlots}
							duration={courseData.duration}
							chosenSchedule={chosenSchedule}
							setChosenSchedule={updateChosenSchedule}
						/>
					</div>
					{(!userData || userData.id != coach.id) && (
						// コース詳細ページのボタン部分
						<Button
							className={`p-course__info-button ${!chosenSchedule ? "-disabled" : ""
								}`}
							onClick={handlePurchase}
							disabled={!chosenSchedule}
						>
							このスケジュールで購入する
						</Button>
					)}
				</div>
			</div>
			{/* <div className="p-courses__title">{`おすすめの講座`}</div>
      <div className="p-courses__list -wrap">
        {recommendedCourseData.map((course) => (
          <CourseCard course={course} key={course.id} />
        ))}
      </div> */}
		</div>
	);
};

export default Page;
