import defaultImage from "@/assets/image/user_icon.svg";
import { ImageBox } from "@/components/imageBox";
import type { Course, Reservation } from "@/type/models";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { reservationStatus } from "@/type/models";

dayjs.locale("ja");

interface Props {
	course?: Course;
	reservation: Reservation;
	children?: React.ReactNode;
}

export const CourseCardUpcoming: React.FC<Props> = ({ course, reservation, children }) => {
	const router = useRouter();

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

	// キャンセル済みかどうかを判定
	const isCanceled = reservation.status === reservationStatus.Canceled ||
		reservation.status === reservationStatus.CanceledByCoach;

	let canReschedule = false;
	const firstSlot = reservation.timeSlots?.[0];
	if (firstSlot && !isCanceled) {
		const daysUntilClass = Math.floor(
			(new Date(firstSlot.dateTime).getTime() - new Date().getTime()) /
			(1000 * 60 * 60 * 24)
		);
		canReschedule = daysUntilClass >= 5;
	}

	return (
		<>
			<div className={`p-course-card ${isCanceled ? '-canceled' : ''}`}>
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
				<div
					className={`p-course-card__item -high ${isCanceled ? "-canceled" : ""}`}
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
						{!isCanceled && <div className="p-course-card__text">5日前まで日程変更可</div>}
						<div className="p-course-card__tags">
							{!isCanceled && (
								<>
									{reservation.status !== reservationStatus.CancelRequestedByCoach && <div
										className={`p-course-card__button ${!canReschedule ? '-grayed' : ''}`}
										onClick={() => canReschedule && router.push(`/mypage/courses/upcoming/reschedule?reservationId=${reservation.id}`)}>
										<div className="p-course-card__tag-text">日程を変更する</div>
									</div>
									}
									<div className="p-course-card__button"
										onClick={() => router.push(`/mypage/message/${reservation.room?.roomKey}`)}>
										<div className="p-course-card__tag-text">メッセージ</div>
									</div>

									{reservation.status !== reservationStatus.CancelRequestedByCoach ?
										<div
											className={`p-course-card__button -red`}
											onClick={() => router.push(`/mypage/courses/upcoming/cancel?reservationId=${reservation.id}`)}>
											<div className="p-course-card__tag-text">キャンセルする</div>
										</div>
										:
										<div
											className={`p-course-card__button -grayed`}
										>
											<div className="p-course-card__tag-text u-wt">コーチ<br />キャンセル申請中</div>
										</div>
									}
								</>
							)}
							{isCanceled && (
								<div className="p-course-card__text">
									{
										reservation.status === reservationStatus.Canceled ? '生徒キャンセル済み' :
											reservation.status === reservationStatus.CanceledByCoach ? 'コーチキャンセル済み' :
												''
									}
								</div>
							)}
						</div>
					</div>
					{children}
				</div>
			</div></>
	);
};
