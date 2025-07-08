"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import { InputBox } from "@/components/inputBox";
import { MultilineInput } from "@/components/multilineInput";
import { requestDB } from "@/services/axios";
import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Border from "@/components/border";

const CoachCreatePage = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState(0);
	const [duration, setDuration] = useState(30);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		animation.startAnimation();
	}, []);

	useEffect(() => {
		if (userData) {
			setIsLoading(false);
			animation.endAnimation();
		}
	}, [userData]);

	if (!userData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">講座の作成</div>
				<Border />
			</>
		);
	}

	const handleSubmit = async () => {
		if (!title || !description || price <= 0) {
			alert("必須項目を全て入力してください");
			return;
		}

		animation.startAnimation();
		await requestDB("course", "createCourse", {
			title,
			description,
			price,
			duration,
			coachId: userData.id,
		}).then((response) => {
			if (response.success) {
				router.push("/mypage/coach/list");
			} else {
				alert("講座の作成に失敗しました");
			}
			animation.endAnimation();
		});
	};

	return (
		<>
			<div className="p-mypage__title">講座の作成</div>
			<Border />

			<div className="p-mypage__section">
				<div className="p-mypage__input-group">
					<label>講座タイトル</label>
					<InputBox
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="例: ビジネス英会話入門"
					/>
				</div>

				<div className="p-mypage__input-group">
					<label>講座説明</label>
					<MultilineInput
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="講座の内容や対象者について詳しく記載してください"
					/>
				</div>

				<div className="p-mypage__input-group">
					<label>価格 (円)</label>
					<InputBox
						type="number"
						value={price}
						onChange={(e) => setPrice(Number.parseInt(e.target.value))}
						placeholder="3000"
					/>
				</div>

				<div className="p-mypage__input-group">
					<label>時間 (分)</label>
					<InputBox
						type="number"
						value={duration}
						onChange={(e) => setDuration(Number.parseInt(e.target.value))}
						placeholder="30"
					/>
				</div>

				<Button
					className="p-mypage__button"
					onClick={handleSubmit}
				>
					講座を作成
				</Button>
			</div>
		</>
	);
};

export default CoachCreatePage;