import defaultIcon from "@/assets/image/user_icon.svg";
import defaultImage from "@/assets/image/picture-icon.svg"; // 差し替え
import tagImage from "@/assets/image/tag.svg"; // 差し替え
import { ImageBox } from "@/components/imageBox";
import StarRating from "@/components/starRating";
import { Course } from "@/type/models";
import { useRouter } from "next/navigation";

interface Props {
  course: Course;
  children?: React.ReactNode;
}

export const CourseCard: React.FC<Props> = ({ course, children }) => {
  const router = useRouter();
  const averageRating =
    course.reviews && course.reviews.length > 0
      ? course.reviews.reduce((acc, review) => acc + review.rating, 0) /
        course.reviews.length
      : 0;

  return (
    <div
      key={course.id}
      className="p-about__course-item"
      onClick={() => router.push(`/courses/course/${course.id}`)}
    >
      <div className="p-about__course-image-container">
        <ImageBox
          className="p-about__course-image"
          src={course.image ?? defaultImage}
          objectFit="cover"
        />
      </div>
      <div className="p-about__course-title">{course.title}</div>
      <div className="p-about__course-details">
        <div className="p-about__course-details-left">
          <div className="p-about__course-details-upper">
            <ImageBox
              className="p-about__course-user-icon"
              src={course.coach.icon ?? defaultIcon}
              objectFit="cover"
              round
            />
            <div className="p-about__course-user-name">{course.coach.name}</div>
          </div>
          <div className="p-about__course-rating">
            <StarRating
              score={averageRating}
              showsScore={false}
              className="p-about__course-stars"
            />
            <div className="p-about__course-rating-text">
              ({course.reviews ? course.reviews.length : 0})
            </div>
          </div>
        </div>
        <div className="p-about__course-games">
          <div className="p-about__course-tag">
            <ImageBox className="p-about__course-tag-icon" src={tagImage} />

            <div key={course.game.id} className="p-about__course-game">
              {course.game.name}
            </div>
          </div>
          <div className="p-about__course-value">価格　￥{course.price}</div>
        </div>
      </div>
      {children}
    </div>
  );
};
