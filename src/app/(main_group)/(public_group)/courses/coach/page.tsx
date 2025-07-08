"use client";

import { CoachCard } from "@/app/(component)/coachCard";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { Filter } from "@/components/filter";
import { Pagination } from "@/components/pagination";
import { requestDB } from "@/services/axios";
import type { User } from "@/type/models";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const Page = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;

	/* ------------------------------ state ------------------------------ */
	const [coachData, setCoachData] = useState<{ [page: number]: User[] }>({});
	const [coachNum, setCoachNum] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [sortMethod, setSortMethod] = useState(0); // 0:人気順 1:新着順
	const [searchText, setSearchText] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const router = useRouter();
	const param = useSearchParams()!;
	const query = param.get("query");

	const total = 20;
	const hasData = Object.keys(coachData).length > 0;
	const currentCoaches = coachData[currentPage] || [];
	const showNoResults = hasData && currentCoaches.length === 0 && !isLoading;

	/* ------------------------------ 検索文字列同期 ------------------------------ */
	useEffect(() => {
		setSearchText(query || "");
	}, [query]);

	/* ------------------------------ 初回 & クエリ変更時 ------------------------------ */
	useEffect(() => {
		resetAndFetch();
	}, [query]);

	/* ------------------------------ 並び順変更時 ------------------------------ */
	useEffect(() => {
		resetAndFetch(); // ページとキャッシュをリセット
	}, [sortMethod]);

	/* ------------------------------ ページ変更時 ------------------------------ */
	useEffect(() => {
		if (currentPage > 1 && !coachData[currentPage]) {
			fetchCoaches(currentPage);
		}
	}, [currentPage]);

	/* ============================== functions ============================== */
	const resetAndFetch = () => {
		setCoachData({});
		setCurrentPage(1);
		fetchCoachNum();
		fetchCoaches(1);
	};

	const fetchCoachNum = async () => {
		try {
			setIsLoading(true);
			const res = await requestDB("coach", "readCoachesNumByQuery", {
				query: query || undefined,
			});
			setCoachNum(res.success ? res.data : 0);
		} catch (e) {
			console.error("Error fetching coach count:", e);
			setCoachNum(0);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchCoaches = async (page: number = currentPage) => {
		try {
			setIsLoading(true);
			animation.startAnimation();

			const res = await requestDB("coach", "readCoachesByQuery", {
				page,
				total,
				query: query || undefined,
				sortMethod, // ★ 並び順を送信
			});

			setCoachData((prev) => ({
				...prev,
				[page]: res.success ? res.data : [],
			}));
		} catch (e) {
			console.error("Error fetching coaches:", e);
			setCoachData((prev) => ({ ...prev, [page]: [] }));
		} finally {
			setIsLoading(false);
			animation.endAnimation();
		}
	};

	/* ------------------------------ ハンドラ類 ------------------------------ */
	const search = () => {
		const trimmed = searchText.trim();
		if (trimmed === (query || "")) return; // 条件不変なら無視

		router.push(
			trimmed
				? `/courses/coach?query=${encodeURIComponent(trimmed)}`
				: "/courses/coach",
		);
	};

	return (
		<div className="p-coaches l-page">
			<div className="p-coaches__title">コーチから選ぶ</div>
			<Border />

			{/* ---------------- フリーワード検索 ---------------- */}
			<div className="p-coaches__input-title">フリーワード検索</div>
			<div className="p-coaches__input-outline">
				<input
					className="p-coaches__input"
					type="text"
					value={searchText}
					placeholder="コーチ名や自己紹介で検索"
					onChange={(e) => setSearchText(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && search()}
				/>
			</div>
			<Button className="p-coaches__search u-mb48" onClick={search}>
				検索
			</Button>

			{query && (
				<div className="p-coaches__text">
					「{query}」の検索結果: {coachNum}件
				</div>
			)}

			{/* ---------------- 並び順 ---------------- */}
			<div className="p-coaches__sort">
				<div className="p-coaches__sort-label">並び順</div>
				<Filter
					className="p-coaches__sort-input"
					selectedValue={sortMethod}
					options={[
						{ label: "人気順", value: 0 },
						{ label: "新着順", value: 1 },
					]}
					onChange={setSortMethod}
				/>
			</div>

			{/* ---------------- ローディング・結果表示 ---------------- */}
			{isLoading && <div className="p-coaches__text">検索中...</div>}

			{showNoResults && (
				<div className="p-coaches__no-results">
					<div className="p-coaches__text">
						{query
							? `「${query}」に一致するコーチが見つかりませんでした。`
							: "コーチが見つかりませんでした。"}
					</div>
				</div>
			)}

			{currentCoaches.length > 0 && (
				<div className="p-coaches__list">
					{currentCoaches.map((coach, i) => (
						<CoachCard key={coach.id || i} coach={coach} big />
					))}
				</div>
			)}

			{coachNum > total && (
				<div className="p-coaches__pagination">
					<Pagination
						all={coachNum}
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
