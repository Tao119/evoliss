"use client";

import { CourseCard } from "@/app/(component)/courseCard";
import { SearchArea } from "@/app/(component)/searchArea";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { Filter } from "@/components/filter";
import { Pagination } from "@/components/pagination";
import { requestDB } from "@/services/axios";
import type { Course, Game, Tag } from "@/type/models";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const Page = () => {
	const { userData: _userData } = useContext(UserDataContext)!;
	const [games, setGames] = useState<Game[]>();
	const [tags, setTags] = useState<Tag[]>();
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const [currentPage, setCurrentPage] = useState(1);
	const [courseData, setCourseData] = useState<{ [page: number]: Course[] }>(
		{},
	);
	const [courseNum, setCourseNum] = useState(0);
	const [isLoading, setIsLoading] = useState(false);

	// 検索状態
	const [searchText, setSearchText] = useState("");
	const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());
	const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());
	const [sortMethod, setSortMethod] = useState(0);

	// URLパラメータから復元された実際の検索条件
	const [appliedGames, setAppliedGames] = useState<Set<number>>(new Set());
	const [appliedTags, setAppliedTags] = useState<Set<number>>(new Set());
	const [appliedQuery, setAppliedQuery] = useState("");

	// URLパラメータ
	const param = useSearchParams()!;
	const query = param.get("query");
	const gamesParam = param.get("games");
	const tagsParam = param.get("tags");

	const total = 20;
	const onReady = games && tags !== undefined;

	// URLパラメータから検索条件を復元
	useEffect(() => {
		// 検索テキストの更新
		if (query) {
			setSearchText(query);
			setAppliedQuery(query);
		} else {
			setSearchText("");
			setAppliedQuery("");
		}

		// ゲーム選択の更新
		if (gamesParam && gamesParam !== "undefined") {
			const gameIds = gamesParam
				.split("-")
				.map(Number)
				.filter((id) => !isNaN(id));
			setSelectedGames(new Set(gameIds));
			setAppliedGames(new Set(gameIds));
		} else {
			setSelectedGames(new Set());
			setAppliedGames(new Set());
		}

		// タグ選択の更新
		if (tagsParam && tagsParam !== "undefined") {
			const tagIds = tagsParam
				.split("-")
				.map(Number)
				.filter((id) => !isNaN(id));
			setSelectedTags(new Set(tagIds));
			setAppliedTags(new Set(tagIds));
		} else {
			setSelectedTags(new Set());
			setAppliedTags(new Set());
		}
	}, [query, gamesParam, tagsParam]);

	// 初期データ取得
	useEffect(() => {
		animation.startAnimation();
		fetchGames();
		fetchTags();
	}, []);

	// 検索条件が変更された時（appliedパラメータの変更を監視）
	useEffect(() => {
		if (onReady) {
			// 完全にリセット
			setCourseData({});
			setCourseNum(0);
			setCurrentPage(1);
			setIsLoading(false);

			// 新しい検索を実行
			// 関数を直接定義して呼び出す
			(async () => {
				try {
					setIsLoading(true);

					const gameIds = Array.from(appliedGames);
					const tagIds = Array.from(appliedTags);

					const params: any = {};
					if (appliedQuery) params.query = appliedQuery;
					if (gameIds.length > 0) params.gameIds = gameIds;
					if (tagIds.length > 0) params.tagIds = tagIds;

					const response = await requestDB(
						"course",
						"readCoursesNumByQuery",
						params,
					);
					if (response.success) {
						setCourseNum(response.data);
					} else {
						console.error("コース数取得エラー:", response);
						setCourseNum(0);
					}
				} catch (error) {
					console.error("Error fetching course count:", error);
					setCourseNum(0);
				}
			})();

			// コースデータを取得
			(async () => {
				try {
					animation.startAnimation();

					const params: any = {
						page: 1,
						total,
						sortMethod,
					};
					if (appliedQuery) params.query = appliedQuery;
					if (appliedGames.size) params.gameIds = Array.from(appliedGames);
					if (appliedTags.size) params.tagIds = Array.from(appliedTags);

					const response = await requestDB("course", "readCoursesByQuery", params);
					if (response.success) {
						setCourseData({
							1: response.data,
						});
					} else {
						console.error("コース取得エラー:", response);
						setCourseData({
							1: [],
						});
					}
				} catch (error) {
					console.error("Error fetching courses:", error);
					setCourseData({
						1: [],
					});
				} finally {
					setIsLoading(false);
					animation.endAnimation();
				}
			})();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [appliedQuery, appliedGames, appliedTags, onReady, sortMethod]);

	// ページ変更時
	useEffect(() => {
		if (currentPage > 1 && onReady && !courseData[currentPage] && !isLoading) {
			// 直接非同期関数を実行
			(async () => {
				try {
					setIsLoading(true);
					animation.startAnimation();

					const params: any = {
						page: currentPage,
						total,
						sortMethod,
					};
					if (appliedQuery) params.query = appliedQuery;
					if (appliedGames.size) params.gameIds = Array.from(appliedGames);
					if (appliedTags.size) params.tagIds = Array.from(appliedTags);

					const response = await requestDB("course", "readCoursesByQuery", params);
					if (response.success) {
						setCourseData((prev) => ({
							...prev,
							[currentPage]: response.data,
						}));
					} else {
						console.error("コース取得エラー:", response);
						setCourseData((prev) => ({
							...prev,
							[currentPage]: [],
						}));
					}
				} catch (error) {
					console.error("Error fetching courses:", error);
					setCourseData((prev) => ({
						...prev,
						[currentPage]: [],
					}));
				} finally {
					setIsLoading(false);
					animation.endAnimation();
				}
			})();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, onReady, isLoading, courseData, appliedQuery, appliedGames, appliedTags, sortMethod]);

	useEffect(() => {
		if (onReady && !isLoading) {
			animation.endAnimation();
		}
	}, [onReady, isLoading]);

	// sortMethodのuseEffectは削除（appliedQuery等のuseEffectで処理されるため）

	const fetchGames = async () => {
		try {
			const response = await requestDB("game", "readAllGames");
			if (response.success) {
				setGames(response.data);
			} else {
				console.error("Failed to fetch games:", response);
				alert("ゲーム情報の取得中にエラーが発生しました");
			}
		} catch (error) {
			console.error("Error fetching games:", error);
		}
	};

	const fetchTags = async () => {
		try {
			const response = await requestDB("tag", "readTags");
			if (response.success) {
				setTags(response.data);
			} else {
				console.error("Failed to fetch tags:", response);
				alert("タグ情報の取得中にエラーが発生しました");
			}
		} catch (error) {
			console.error("Error fetching tags:", error);
		}
	};

	// 不要な関数を削除（useEffect内で直接実行しているため）

	const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchText(event.target.value);
	};

	const handleSearch = () => {
		// 現在の検索条件と新しい検索条件を比較
		const newQuery = searchText.trim();
		const newGamesArray = Array.from(selectedGames).sort();
		const newTagsArray = Array.from(selectedTags).sort();

		const currentGamesArray = Array.from(appliedGames).sort();
		const currentTagsArray = Array.from(appliedTags).sort();

		// 条件が変わらない場合は何もしない
		if (
			newQuery === appliedQuery &&
			JSON.stringify(newGamesArray) === JSON.stringify(currentGamesArray) &&
			JSON.stringify(newTagsArray) === JSON.stringify(currentTagsArray)
		) {
			return;
		}

		const params = new URLSearchParams();

		if (newQuery) {
			params.set("query", newQuery);
		}

		if (selectedGames.size > 0) {
			params.set("games", Array.from(selectedGames).join("-"));
		}

		if (selectedTags.size > 0) {
			params.set("tags", Array.from(selectedTags).join("-"));
		}

		const searchUrl = params.toString()
			? `/courses?${params.toString()}`
			: "/courses";

		router.push(searchUrl);
	};

	const clearSearch = () => {
		setSearchText("");
		setSelectedGames(new Set());
		setSelectedTags(new Set());
		// 状態を完全にリセット
		setCourseData({});
		setCourseNum(0);
		setCurrentPage(1);
		router.push("/courses");
	};

	if (!onReady) {
		return <div className="p-courses l-page">読み込み中...</div>;
	}

	const currentCourses = courseData[currentPage] || [];
	const hasData = Object.keys(courseData).length > 0;
	const showNoResults = hasData && currentCourses.length === 0 && !isLoading;
	const hasSearchConditions =
		appliedQuery || appliedGames.size > 0 || appliedTags.size > 0;

	return (
		<div className="p-courses l-page">
			<div className="p-about__panel -no-padding">
				<div className="p-about__section-title">講座を検索する</div>
				<Border />

				<SearchArea
					games={games}
					tags={tags}
					selectedGames={selectedGames}
					selectedTags={selectedTags}
					setSelectedGames={setSelectedGames}
					setSelectedTags={setSelectedTags}
					searchText={searchText}
					onInputChange={onInputChange}
				/>

				<div className="p-courses__search-buttons">
					<Button className="p-about__more" onClick={handleSearch}>
						検索
					</Button>
				</div>
			</div>

			{hasSearchConditions && (
				<div className="p-courses__search-info">
					<div className="p-courses__text">
						{appliedQuery && <span>「{appliedQuery}」</span>}
						{appliedGames.size > 0 && (
							<span>ゲーム: {appliedGames.size}件選択</span>
						)}
						{appliedTags.size > 0 && (
							<span>タグ: {appliedTags.size}件選択</span>
						)}
					</div>
					<div className="p-courses__text">検索結果: {courseNum}件</div>
				</div>
			)}

			<div className="p-courses__sort">
				<div className="p-courses__sort-label">並び順</div>
				<Filter
					className="p-courses__sort-input"
					selectedValue={sortMethod}
					options={[
						{ label: "人気順", value: 0 },
						{ label: "新着順", value: 1 },
					]}
					onChange={setSortMethod}
				/>
			</div>

			{isLoading && <div className="p-courses__loading">検索中...</div>}

			{showNoResults && (
				<div className="p-courses__no-results">
					<div className="p-courses__text">
						{hasSearchConditions
							? "検索条件に一致する講座が見つかりませんでした。"
							: "講座が見つかりませんでした。"}
					</div>
					{hasSearchConditions && (
						<Button className="p-courses__search-all" onClick={clearSearch}>
							全ての講座を表示
						</Button>
					)}
				</div>
			)}

			{currentCourses.length > 0 && (
				<div className="p-courses__list">
					{currentCourses.map((course, i) => (
						<CourseCard key={course.id || i} course={course} big />
					))}
				</div>
			)}

			{courseNum > total && (
				<div className="p-courses__pagination">
					<Pagination
						all={courseNum}
						total={total}
						page={currentPage}
						updatePage={setCurrentPage}
					/>
				</div>
			)}
		</div>
	);
};

export default Page;
