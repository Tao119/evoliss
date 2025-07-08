"use client";

import { UserDataContext } from "@/app/contextProvider";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import Border from "@/components/border";

const CoachListPage = () => {
	const { userData } = useContext(UserDataContext)!;
	const router = useRouter();

	if (!userData) {
		return (
			<>
				<div className="p-mypage__title">講座一覧</div>
				<Border />
				<div className="p-mypage__loading">Loading...</div>
			</>
		);
	}

	return (
		<>
			<div className="p-mypage__title">講座一覧</div>
			<Border />

			{userData.courses.length > 0 ? (
				<div className="p-mypage__section">
					{userData.courses.map((course) => (
						<div key={course.id} className="p-mypage__course-item">
							<div className="p-mypage__course-title">
								{course.title}
							</div>
							<div className="p-mypage__course-description">
								{course.description}
							</div>
							<div className="p-mypage__course-price">
								価格: {course.price.toLocaleString()}円
							</div>
							<div className="p-mypage__course-reservations">
								予約数: {course.reservations.length}件
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="p-mypage__empty">作成された講座はありません</div>
			)}
		</>
	);
};

export default CoachListPage;