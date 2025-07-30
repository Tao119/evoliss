import defaultImage from "@/assets/image/picture-icon.svg";
import { ImageBox } from "@/components/imageBox";
import { reservationStatus, type Course, type Reservation } from "@/type/models";
// import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/ja";
// import { Filter } from "@/components/filter";
import { ReactNode, useState, useContext } from "react";
import { UserDataContext } from "@/app/contextProvider";
import { requestDB } from "@/services/axios";
import star1 from "@/assets/image/star_1.png";
import star2 from "@/assets/image/star_2.png";
import star3 from "@/assets/image/star_3.png";
import star4 from "@/assets/image/star_4.png";
import star5 from "@/assets/image/star_5.png";

dayjs.locale("ja");

interface Props {
	course?: Course;
	reservation: Reservation;
	userId: number
	children?: React.ReactNode;
	onStatusUpdate?: () => void
}

export const CourseCardCoachCompleted: React.FC<Props> = ({ course, reservation, children, onStatusUpdate }) => {
	// const router = useRouter();
	// const [rating, setRating] = useState<number>()
	const [isLoading, setIsLoading] = useState(false);
	const [hasClicked, setHasClicked] = useState(false);
	const { fetchUserData } = useContext(UserDataContext)!;

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

	const displayCourse = course || reservation?.course;
	if (!displayCourse) return null;

	// let canReschedule = false;
	// const firstSlot = reservation.timeSlots?.[0];
	// if (firstSlot) {
	// 	const daysUntilClass = Math.floor(
	// 		(new Date(firstSlot.dateTime).getTime() - new Date().getTime()) /
	// 		(1000 * 60 * 60 * 24)
	// 	);
	// 	canReschedule = daysUntilClass >= 5;
	// }

	const doneCourse = async () => {
		if (hasClicked || isLoading) return;

		if (!confirm("講義を終了しますか？\n\nこの操作は取り消せません。")) {
			return;
		}

		setIsLoading(true);
		setHasClicked(true);

		try {
			const response = await requestDB("reservation", "doneCourse", {
				id: reservation.id,
			});

			if (response.success && response.data?.success) {
				alert("講義を終了しました。");
				// UserDataを更新
				await fetchUserData();
				// 親コンポーネントに通知
				if (onStatusUpdate) {
					onStatusUpdate();
				}
			} else {
				alert(response.data?.error || response.message || "エラーが発生しました。");
				setHasClicked(false);
			}
		} catch (error) {
			console.error("Error completing course:", error);
			const errorMessage = error instanceof Error ? error.message : "エラーが発生しました。";
			alert(errorMessage);
			setHasClicked(false);
		} finally {
			setIsLoading(false);
		}
	}


	return (
		<>

			<div className="p-course-card">
				<div className="p-course-card__coach">
					<div className="p-course-card__coach-name">
						生徒：{reservation.customer.name || "Unknown"}
					</div>
					<ImageBox
						className="p-course-card__coach-icon"
						src={reservation.customer.icon ?? defaultImage}
						objectFit="cover"
						round
					/>
				</div>
				<div
					className="p-course-card__item -low"
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
						{(() => {
							switch (reservation.status) {
								default:
									return null as ReactNode;
								case reservationStatus.Confirmed:
									return <div
										className={`p-course-card__box -text u-wh -button ${hasClicked ? 'u-bg-gy' : 'u-bg-pr'}`}
										style={{
											cursor: hasClicked ? 'not-allowed' : 'pointer',
											opacity: isLoading ? 0.7 : 1
										}}
									>
										<div className="p-course-card__tag-text" onClick={doneCourse}>
											{isLoading ? '処理中...' : hasClicked ? '講義終了' : '講義終了'}
										</div>
									</div>
								case reservationStatus.Done:
									return <div className="p-course-card__box -text u-bg-gy u-wh">
										<div className="p-course-card__tag-text">
											講義終了
										</div>
									</div>
								case reservationStatus.Canceled:
									return <div className="p-course-card__box -text u-bg-re u-wh">
										<div className="p-course-card__tag-text">
											ユーザーキャンセル済
										</div>
									</div>
								case reservationStatus.Reviewed:
									return <div className="p-course-card__box -text u-bg-gy u-wh">
										<div className="p-course-card__tag-text">
											講義終了
										</div>
									</div>
								case reservationStatus.CanceledByCoach:
									return <div className="p-course-card__box -text u-bg-bk u-wh">
										<div className="p-course-card__tag-text">
											コーチ側キャンセル済
										</div>
									</div>
							}
						})()}
						{reservation.status === reservationStatus.Reviewed ?
							<>
								{reservation.review?.rating &&
									<ImageBox className="p-course-card__review-image" src={
										stars[reservation.review?.rating - 1]
									} />
								}
								<div className="p-course-card__review-text" >
									レビューされました！
								</div>
							</> :
							reservation.status === reservationStatus.Done ?
								<div className="p-course-card__review-text" >
									レビュー待ち
								</div> : null}
					</div>
					{children}
				</div>
			</div></>
	);
};
