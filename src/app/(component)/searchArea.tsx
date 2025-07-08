import type { Game, Tag } from "@/type/models";
import type { ChangeEventHandler, Dispatch, SetStateAction } from "react";

interface Prop {
	games: Game[];
	tags: Tag[];
	selectedGames: Set<number>;
	setSelectedGames: Dispatch<SetStateAction<Set<number>>>;
	selectedTags: Set<number>;
	setSelectedTags: Dispatch<SetStateAction<Set<number>>>;
	searchText: string;
	onInputChange: ChangeEventHandler<HTMLInputElement>;
}

export const SearchArea = ({
	games,
	tags,
	selectedGames,
	selectedTags,
	setSelectedGames,
	setSelectedTags,
	searchText,
	onInputChange,
}: Prop) => {
	return (
		<div className="p-search-area">
			<div className="p-search-area__row">
				<div className="p-search-area__row-title">ゲーム</div>
				<div className="p-search-area__row-items">
					{games.map((g, i) => (
						<div
							key={i}
							className={`p-search-area__row-item ${
								selectedGames.has(g.id) ? "-active" : ""
							}`}
							onClick={() => {
								const newSelectedGames = new Set(selectedGames);
								if (newSelectedGames.has(g.id)) {
									newSelectedGames.delete(g.id);
								} else {
									newSelectedGames.add(g.id);
								}
								setSelectedGames(newSelectedGames);
							}}
						>
							{g.name}
						</div>
					))}
				</div>
			</div>
			<div className="p-search-area__row">
				<div className="p-search-area__row-title">タグ</div>
				<div className="p-search-area__row-items">
					{tags.map((t, i) => (
						<div
							key={i}
							className={`p-search-area__row-item -round ${
								selectedTags.has(t.id) ? "-active" : ""
							}`}
							onClick={() => {
								const newSelectedTags = new Set(selectedTags);
								if (newSelectedTags.has(t.id)) {
									newSelectedTags.delete(t.id);
								} else {
									newSelectedTags.add(t.id);
								}
								setSelectedTags(newSelectedTags);
							}}
						>
							{t.name}
						</div>
					))}
				</div>
			</div>
			<div className="p-search-area__row">
				<div className="p-search-area__row-title">フリーワード</div>
				<input
					className="p-search-area__row-input"
					type="text"
					onChange={onInputChange}
					value={searchText}
				/>
			</div>
		</div>
	);
};
