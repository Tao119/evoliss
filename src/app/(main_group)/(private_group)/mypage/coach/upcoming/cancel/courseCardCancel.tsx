import defaultImage from "@/assets/image/picture-icon.svg";
import { ImageBox } from "@/components/imageBox";
import type { Course, Reservation } from "@/type/models";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/ja";

dayjs.locale("ja");

interface Props {
	course?: Course;
	reservation: Reservation;
	children?: React.ReactNode;
	big?: boolean;
}

export const CourseCardCancel: React.FC<Props> = ({ course, reservation, children }) => {
	// const router = useRouter();

	let dateTime = null;
	if (reservation?.timeSlots && reservation.timeSlots.length > 0) {
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

	return (
		<>

			<div className="p-course-card">
				<div
					className="p-course-card__item -low"
					style={{ cursor: "default" }}
				// onClick={() => router.push(`/courses/course/${displayCourse.id}`)}
				>
					<div className="p-course-card__left"
						style={{ gap: "10px" }}>
						<div className="p-course-card__game">{displayCourse.game?.name ?? "登録なし"}</div>
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
					</div>
					{children}
				</div>
			</div></>
	);
};
