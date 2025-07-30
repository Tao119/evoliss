"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Border from "@/components/border";

const CoachCancelSuccessPage = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const router = useRouter();

	useEffect(() => {
		animation.startAnimation();
		animation.endAnimation();
	}, []);

	const handleBackToUpcoming = () => {
		router.push("/mypage/coach/upcoming");
	};

	const handleBackToTop = () => {
		router.push("/mypage");
	};

	if (!userData) {
		return <></>;
	}

	return (
		<>
			<div className="p-mypage__title">キャンセル申請完了</div>
			<Border />

			<div className="p-success">
				<div className="p-success__content">
					<div className="p-success__title u-mb36">
						キャンセル申請が完了しました。
					</div>
					<div className="p-success__text">
						管理者からキャンセル申請が承認され次第、<br />
						正式なキャンセルとなります。<br /><br />

						キャンセルが成立すると、<br />
						マイページの【開講予定の講座】のステータスが

						<div className="p-success__status">コーチ側キャンセル済</div>



						となります。
					</div>
				</div>

				<div className="p-success__buttons">
					<Button
						className="p-success__button"
						onClick={handleBackToTop}
					>
						マイページTOPに戻る
					</Button>
				</div>
			</div>
		</>
	);
};

export default CoachCancelSuccessPage;
