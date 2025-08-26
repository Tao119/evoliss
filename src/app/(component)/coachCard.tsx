import moreIcon from "@/assets/image/right-arrow.svg";
import defaultImage from "@/assets/image/user_icon.svg";
import { ImageBox } from "@/components/imageBox";
import { useBreakpoint } from "@/hooks/useBreakPoint";
import type { User } from "@/type/models";
import { useRouter } from "next/navigation";

interface Props {
	coach: User;
	big?: boolean;
}

export const CoachCard: React.FC<Props> = ({ coach, big }) => {
	const router = useRouter();

	const { orLower } = useBreakpoint();

	return (
		<div
			key={coach.id}
			className={`p-coach-card__item  ${big ? "-big" : ""}`}
			onClick={() => router.push(`/courses/coach/${coach.id}`)}
		>

			{orLower("sp") && <div className={`p-coach-card__name ${big ? "-big" : ""}`}>{coach.name}</div>
			}
			{big && (
				<div className="p-coach-card__game">
					{coach.game?.name ?? "登録なし"}
				</div>
			)}
			<ImageBox
				className={`p-coach-card__icon ${big ? "-big" : ""}`}
				src={coach.icon ?? defaultImage}
				objectFit="cover"
				round
			/>
			{!orLower("sp") && <div className="p-coach-card__name">{coach.name}</div>
			}
			<div className="p-coach-card__bio">{coach.bio}</div>
			<ImageBox className="p-coach-card__more" src={moreIcon} />
		</div>
	);
};
