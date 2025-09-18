import defaultImage from "@/assets/image/user_icon.svg";
import { ImageBox } from "@/components/imageBox";
import type { Course } from "@/type/models";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/ja";

dayjs.locale("ja");

interface Props {
	course: Course;
	children?: React.ReactNode;
}

export const CourseCardList: React.FC<Props> = ({ course, children }) => {
	const router = useRouter();

	return (
		<>

			<div className="p-course-card" onClick={() => router.push(`/courses/course/${course.id}`)}>
				<div
					className="p-course-card__item -low"
				// onClick={() => router.push(`/courses/course/${course.id}`)}
				>
					<div className="p-course-card__left -center"
					>

						<ImageBox
							className="p-course-card__image"
							src={course.image ?? defaultImage}
							objectFit="cover"
						/>

					</div>
					<div className="p-course-card__right"
						style={{
							justifyContent: "center"
							, gap: "10px",
							alignItems: "center"
						}}>
						<div className="p-course-card__game">{course.game?.name}</div>
						<div className="p-course-card__title">{course.title}</div>
						<div className={`p-course-card__box -text ${course.isPublic ? "u-bg-lb" : "u-bg-gy"} u-mt16`}>{course.isPublic ? "公開中" : "非公開"}</div>
						<div
							className={`p-course-card__button`}
							onClick={(e) => {
								e.stopPropagation()
								router.push(`/mypage/coach/list/edit?courseId=${course.id}`)
							}}>
							<div className="p-course-card__tag-text">編集する</div>
						</div>
					</div>
				</div>
				{children}
			</div ></>
	);
};
