import defaultImage from "@/assets/image/picture-icon.svg"; // 差し替え
import { ImageBox } from "@/components/imageBox";
import type { Game } from "@/type/models";
import { useRouter } from "next/navigation";

interface Props {
	game: Game;
}
export const GameCard: React.FC<Props> = ({ game }) => {
	const router = useRouter();
	return (
		<div
			key={game.id}
			className="p-game-card__item"
			onClick={() => router.push(`/courses/game/${game.id}`)}
		>
			<ImageBox
				className="p-game-card__image"
				src={game.image ?? defaultImage}
				objectFit="cover"
			/>
			<div className="p-game-card__name">{game.name}</div>
		</div>
	);
};
