import defaultImage from "@/assets/image/picture-icon.svg"; // 差し替え
import tagImage from "@/assets/image/tag.svg"; // 差し替え
import { ImageBox } from "@/components/imageBox";
import StarRating from "@/components/starRating";
import { User } from "@/type/models";
import { useRouter } from "next/navigation";

interface Props {
  coach: User;
}

export const CoachCard: React.FC<Props> = ({ coach }) => {
  const router = useRouter();
  const averageRating: number =
    coach.courses &&
    coach.courses.length > 0 &&
    coach.courses.reduce(
      (totalCount, course) =>
        totalCount + (course.reviews ? course.reviews.length : 0),
      0
    ) != 0
      ? coach.courses.reduce(
          (totalScore, course) =>
            totalScore +
            (course.reviews
              ? course.reviews.reduce((sum, review) => sum + review.rating, 0)
              : 0),
          0
        ) /
        coach.courses.reduce(
          (totalCount, course) =>
            totalCount + (course.reviews ? course.reviews.length : 0),
          0
        )
      : 0;

  return (
    <div
      key={coach.id}
      className="p-about__coach-item"
      onClick={() => router.push(`/courses/coach/${coach.id}`)}
    >
      <div className="p-about__coach-upper">
        <ImageBox
          className="p-about__coach-icon"
          src={coach.icon ?? defaultImage}
          objectFit="cover"
          round
        />
        <div className="p-about__coach-details">
          <div className="p-about__coach-name">{coach.name}</div>
          <div className="p-about__coach-rating">
            <StarRating
              score={averageRating}
              showsScore={false}
              className="p-about__coach-stars"
            />
            <div className="p-about__coach-rating-text">
              (
              {coach.courses.reduce(
                (total, course) => total + (course.reviews?.length || 0),
                0
              )}
              )
            </div>
          </div>
        </div>
      </div>
      <div className="p-about__coach-games">
        <ImageBox className="p-about__coach-tag-icon" src={tagImage} />
        <div className="p-about__coach-game-list">
          {coach.userGames.slice(0, 4).map((game) => (
            <div key={game.id} className="p-about__coach-game">
              {game.game.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
