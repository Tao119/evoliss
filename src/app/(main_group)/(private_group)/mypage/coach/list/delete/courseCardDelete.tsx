import defaultImage from "@/assets/image/picture-icon.svg";
import { ImageBox } from "@/components/imageBox";
import type { Course } from "@/type/models";
// import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/ja";

dayjs.locale("ja");

interface Props {
	course: Course;
	children?: React.ReactNode;
}

export const CourseCardDelete: React.FC<Props> = ({ course, children }) => {
	// const router = useRouter();

	return (
		<>

			<div className="p-course-card">
				<div
					className="p-course-card__item -low"
				// onClick={() => router.push(`/courses/course/${course.id}`)}
				>
					<div className="p-course-card__center"
					><div className="p-course-card__game">{course.game?.name}</div>


						<ImageBox
							className="p-course-card__image"
							src={course.image ?? defaultImage}
							objectFit="cover"
						/>
						<div className="p-course-card__title u-tx-ce">{course.title}</div>

					</div>
				</div>
				{children}
			</div></>
	);
};
