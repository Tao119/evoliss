import defaultImage from "@/assets/image/picture-icon.svg";
import tagImage from "@/assets/image/tag.svg";
import defaultIcon from "@/assets/image/user_icon.svg";
import { ImageBox } from "@/components/imageBox";
import { formatMinutesToTime } from "@/services/formatMinutes";
import type { Course } from "@/type/models";
import { useRouter } from "next/navigation";

interface Props {
	course: Course;
	children?: React.ReactNode;
	big?: boolean;
}

export const CourseCard: React.FC<Props> = ({ course, children, big }) => {
	const router = useRouter();
	const averageRating =
		course.reviews && course.reviews.length > 0
			? course.reviews.reduce((acc, review) => acc + review.rating, 0) /
				course.reviews.length
			: 0;

	return (
		<div className="p-course-card">
			{big && (
				<div className="p-course-card__coach">
					<div className="p-course-card__coach-name">
						コーチ：{course.coach.name}
					</div>
					<ImageBox
						className="p-course-card__coach-icon"
						src={course.coach.icon ?? defaultImage}
						objectFit="cover"
						round
					/>
				</div>
			)}
			<div
				className="p-course-card__item"
				onClick={() => router.push(`/courses/course/${course.id}`)}
			>
				<div className="p-course-card__left">
					<div className="p-course-card__game">{course.game.name}</div>
					<ImageBox
						className="p-course-card__image"
						src={course.image ?? defaultImage}
						objectFit="cover"
					/>
				</div>
				<div className="p-course-card__right">
					<div className="p-course-card__title">{course.title}</div>
					<div className="p-course-card__value">
						{course.price}円 / {formatMinutesToTime(course.duration)}
					</div>
					<div className="p-course-card__tags">
						{course.tagCourses.slice(0, 3).map((t, i) => (
							<div key={i} className="p-course-card__tag">
								<div className="p-course-card__tag-text">{t.tag.name}</div>
							</div>
						))}
					</div>
				</div>
				{children}
			</div>
		</div>
	);
};
