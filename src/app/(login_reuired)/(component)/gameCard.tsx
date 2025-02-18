import defaultImage from "@/assets/image/picture-icon.svg"; // 差し替え
import { ImageBox } from "@/components/imageBox";
import { Game } from "@/type/models";
import { useRouter } from "next/navigation";

interface Props {
  game: Game;
}
export const GameCard: React.FC<Props> = ({ game }) => {
  const router = useRouter();
  return (
    <div
      key={game.id}
      className="p-about__game-item"
      onClick={() => router.push(`/courses/game/${game.id}`)}
    >
      <ImageBox
        className="p-about__game-image"
        src={game.image ?? defaultImage}
        objectFit="cover"
      />
      <div className="p-about__game-name">{game.name}</div>
    </div>
  );
};
