"use client";

import { UserDataContext } from "@/app/contextProvider";
import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import Border from "@/components/border";
import { Pagination } from "@/components/pagination";
import { CourseCardList } from "./courseCardList";

const CoachListPage = () => {
	const { userData } = useContext(UserDataContext)!;
	// const router = useRouter();
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	if (!userData) {
		return (
			<>
				<div className="p-mypage__title">講座一覧</div>
				<Border />
				<div className="p-mypage__loading">Loading...</div>
			</>
		);
	}

	// ページネーション用のデータ計算
	const totalItems = userData.courses.length;
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentItems = userData.courses.slice(startIndex, endIndex);

	return (
		<>
			<div className="p-mypage__title">講座一覧</div>
			<Border />

			{userData.courses.length > 0 ? (
				<>
					<div className="p-mypage__courses-list">
						{currentItems.map((course) => (
							<CourseCardList
								key={course.id}
								course={course}
							/>
						))}
					</div>

					{totalItems > itemsPerPage && (
						<div className="p-mypage__pagination">
							<Pagination
								all={totalItems}
								total={itemsPerPage}
								page={currentPage}
								updatePage={setCurrentPage}
							/>
						</div>
					)}
				</>
			) : (
				<div className="p-mypage__empty">作成された講座はありません</div>
			)}
		</>
	);
};

export default CoachListPage;