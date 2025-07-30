"use client";

import { UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Border from "@/components/border";

const CoachDeleteSuccessPage = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	// const animation = useContext(AnimationContext)!;
	const router = useRouter();

	useEffect(() => {
		fetchUserData()
	}, [fetchUserData]);


	// const handleBackToList = () => {
	// 	router.push("/mypage/coach/list");
	// };

	const handleBackToTop = () => {
		router.push("/mypage");
	};

	if (!userData) {
		return <></>;
	}

	return (
		<>
			<div className="p-mypage__title">講座削除完了</div>
			<Border />

			<div className="p-success">
				<div className="p-success__content">
					<div className="p-success__text u-mb36">
						講座の完全削除が完了しました。
					</div>
				</div>

				<div className="p-success__buttons">
					<Button
						className="p-success__button -primary"
						onClick={handleBackToTop}
					>
						マイページTOPに戻る
					</Button>
				</div>
			</div>
		</>
	);
};

export default CoachDeleteSuccessPage;