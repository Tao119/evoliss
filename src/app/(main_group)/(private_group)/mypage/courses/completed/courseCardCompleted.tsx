import defaultImage from "@/assets/image/user_icon.svg";
import { ImageBox } from "@/components/imageBox";
import { reservationStatus, type Course, type Reservation } from "@/type/models";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { Filter } from "@/components/filter";
import { useState, useContext, useEffect } from "react";
import { requestDB } from "@/services/axios";
import { UserDataContext } from "@/app/contextProvider";
import star1 from "@/assets/image/star_1.png";
import star2 from "@/assets/image/star_2.png";
import star3 from "@/assets/image/star_3.png";
import star4 from "@/assets/image/star_4.png";
import star5 from "@/assets/image/star_5.png";

dayjs.locale("ja");

interface Props {
	course?: Course;
	reservation: Reservation;
	children?: React.ReactNode;
}

export const CourseCardCompleted: React.FC<Props> = ({ course, reservation, children }) => {
	const router = useRouter();
	const { fetchUserData } = useContext(UserDataContext)!;
	const [rating, setRating] = useState<number>(5);
	const [isProcessing, setIsProcessing] = useState(false);
	const [hasReviewed, setHasReviewed] = useState(false);

	const stars = [
		star1, star2, star3, star4, star5
	]

	let dateTime = null;
	// courseTimeがある場合はそれを使用、ない場合はtimeSlotsから取得（互換性のため）
	if (reservation.courseTime) {
		// courseTimeは "YYYY/MM/DD HH:mm~HH:mm" 形式
		const [datePart, timePart] = reservation.courseTime.split(' ');
		const [startTime, endTime] = timePart.split('~');
		const dateObj = dayjs(datePart + ' ' + startTime);

		dateTime = {
			date: dateObj.format("M月D日（ddd）"),
			startTime: startTime,
			endTime: endTime
		};
	} else if (reservation?.timeSlots && reservation.timeSlots.length > 0) {
		// 互換性のために残しておく
		const firstSlot = reservation.timeSlots[0];
		const lastSlot = reservation.timeSlots[reservation.timeSlots.length - 1];
		dateTime = {
			date: dayjs(firstSlot.dateTime).format("M月D日（ddd）"),
			startTime: dayjs(firstSlot.dateTime).format("HH:mm"),
			endTime: dayjs(lastSlot.dateTime).add(30, "minute").format("HH:mm")
		};
	}

	useEffect(() => {
		if (reservation.status === reservationStatus.Reviewed) {
			setHasReviewed(true);
		}
	}, [reservation.status]);

	const displayCourse = course || reservation?.course;
	if (!displayCourse) return null;

	let canReschedule = false;
	const firstSlot = reservation.timeSlots?.[0];
	if (firstSlot) {
		const daysUntilClass = Math.floor(
			(new Date(firstSlot.dateTime).getTime() - new Date().getTime()) /
			(1000 * 60 * 60 * 24)
		);
		canReschedule = daysUntilClass >= 5;
	}

	const sendReview = async () => {
		if (!rating) {
			alert("評価を選択してください");
			return;
		}

		if (reservation.status !== reservationStatus.Done) {
			alert("講義が終了していません");
			return;
		}


		if (hasReviewed || isProcessing) {
			return;
		}

		if (!confirm("レビューを送信しますか？")) { return }

		setIsProcessing(true);
		try {
			const response = await requestDB("review", "createReview", {
				customerId: reservation.customerId,
				courseId: reservation.courseId,
				reservationId: reservation.id,
				rating,
			});

			if (response.success && response.data?.success) {
				alert("レビューを送信しました");
				setHasReviewed(true);
				// UserDataを更新
				if (fetchUserData) {
					fetchUserData();
				}
			} else {
				alert(response.message || "レビューの送信に失敗しました");
			}
		} catch (error) {
			console.error("Error sending review:", error);
			alert("エラーが発生しました");
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<>

			<div className="p-course-card">
				<div className="p-course-card__coach">
					<div className="p-course-card__coach">
						<ImageBox
							className="p-course-card__coach-icon"
							src={course?.coach.icon ?? defaultImage}
							objectFit="cover"
							round
						/>
						<div className="p-course-card__coach-name">
							{course?.coach.name}
						</div>
					</div>
				</div>
				<div
					className="p-course-card__item -high"
					style={{ cursor: "default" }}
				// onClick={() => router.push(`/courses/course/${displayCourse.id}`)}
				>
					<div className="p-course-card__left"
						style={{ gap: "10px" }}>
						<div className="p-course-card__game">{displayCourse.game?.name}</div>
						<ImageBox
							className="p-course-card__image"
							src={displayCourse.image ?? defaultImage}
							objectFit="cover"
						/>
						<div className="p-course-card__title" style={{ fontSize: "14px" }}>{displayCourse.title}</div>
					</div>
					<div className="p-course-card__right"
						style={{
							justifyContent: "center"
							, gap: "10px",
							alignItems: "center"
						}}>

						<div className="p-course-card__date">{dateTime?.date}</div>
						<div className="p-course-card__time">
							{dateTime?.startTime} ~ {dateTime?.endTime}
						</div>
						<div className="p-course-card__tags">
							<div
								className={`p-course-card__box -text u-bg-gy`}>
								<div className="p-course-card__tag-text">
									{
										reservation.status === reservationStatus.Done ? "講義終了" :
											reservation.status === reservationStatus.Reviewed ? "講義終了" :
												reservation.status === reservationStatus.CanceledByCoach ? "コーチ側キャンセル済" :
													"キャンセル済"}
								</div>
							</div>

							{reservation.status === reservationStatus.Done && !hasReviewed && (
								<>
									<Filter
										className={`p-course-card__box -filter`}
										selectedValue={rating}
										center
										onChange={(v: number) => { setRating(v) }}
										options={[
											{ value: 5, label: star5 },
											{ value: 4, label: star4 },
											{ value: 3, label: star3 },
											{ value: 2, label: star2 },
											{ value: 1, label: star1 },
										]}
									/>

									<div
										className={`p-course-card__button ${isProcessing ? '-disabled' : ''}`}
										onClick={sendReview}>
										<div className="p-course-card__tag-text">
											{isProcessing ? "送信中..." : "レビュー★を送信"}
										</div>
									</div>
								</>
							)}

							{reservation.status === reservationStatus.Reviewed && (
								<>
									{reservation.review?.rating &&
										<ImageBox className="p-course-card__review-image" src={
											stars[reservation.review?.rating - 1]
										} />
									}
									<div className="p-course-card__review-text">レビューを送信しました！</div>
								</>
							)}
						</div>
					</div>
					{children}
				</div>
			</div></>
	);
};
