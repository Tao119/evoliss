"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import { InputBox } from "@/components/inputBox";
import { MultilineInput } from "@/components/multilineInput";
import { Filter } from "@/components/filter";
import { requestDB, Axios } from "@/services/axios";
import { useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Border from "@/components/border";
import { ImageBox } from "@/components/imageBox";
import imageIcon from "@/assets/image/image.svg";
import cameraIcon from "@/assets/image/camera.svg";
import type { Game, Tag } from "@/type/models";
import { optimizeImage } from "@/utils/imageResize";

const CoachCreatePage = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const router = useRouter();

	// フォーム入力
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [duration, setDuration] = useState(30);
	const [gameId, setGameId] = useState<number | string>("");
	const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

	// 画像関連
	const [tempImageFile, setTempImageFile] = useState<File | null>(null);
	const [tempImagePreview, setTempImagePreview] = useState<string>("");
	const imageInputRef = useRef<HTMLInputElement>(null);

	// データ
	const [games, setGames] = useState<Game[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		animation.startAnimation();
		fetchInitialData();
	}, []);

	useEffect(() => {
		if (userData && games && tags) {
			setIsLoading(false);
			animation.endAnimation();
		}
	}, [userData, games, tags]);

	if (!userData) return <></>

	const fetchInitialData = async () => {
		try {
			// ゲーム一覧を取得
			const gamesResponse = await requestDB("game", "readAllGames");
			if (gamesResponse.success) {
				setGames(gamesResponse.data);
				if (gamesResponse.data.length > 0) {
					setGameId(gamesResponse.data[0].id);
				}
			}

			// タグ一覧を取得
			const tagsResponse = await requestDB("tag", "readTags");
			if (tagsResponse.success) {
				setTags(tagsResponse.data);
			}
		} catch (error) {
			console.error("Error fetching initial data:", error);
			alert("データの取得に失敗しました");
		}
	};



	const handleImageSelect = async (file: File) => {
		if (!file) return;

		// ファイルタイプチェック
		if (!file.type.startsWith("image/")) {
			alert("画像ファイルを選択してください");
			return;
		}

		try {
			// 画像を最適化（最大1MBに圧縮）
			const optimizedFile = await optimizeImage(file, 1);

			setTempImageFile(optimizedFile);
			const reader = new FileReader();
			reader.onload = (e) => {
				setTempImagePreview(e.target?.result as string);
			};
			reader.readAsDataURL(optimizedFile);
		} catch (error) {
			console.error('画像の最適化に失敗しました:', error);
			alert('画像の処理に失敗しました。別の画像をお試しください。');
		}
	};

	const uploadImage = async (file: File): Promise<string | null> => {
		try {
			const fileName = `${userData.id}/course/${Date.now()}.${file.type.split("/")[1]}`;
			const fileBase64 = await fileToBase64(file);
			const keyPrefix = "course";

			const response = await Axios.post("/api/s3/upload", {
				fileName,
				fileType: file.type,
				fileBase64,
				keyPrefix,
			});

			if (response.data.success) {
				return response.data.url;
			} else {
				return null;
			}
		} catch (error) {
			console.error("Error uploading image:", error);
			return null;
		}
	};

	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result!.toString().split(",")[1]);
			reader.onerror = (error) => reject(error);
		});
	};

	const validateForm = () => {
		if (!title.trim()) {
			alert("講座タイトルを入力してください");
			return false;
		}
		if (title.length > 50) {
			alert("講座タイトルは50文字以内で入力してください");
			return false;
		}
		if (!price.trim()) {
			alert("価格を入力してください");
			return false;
		}
		const priceNum = Number.parseInt(price);
		if (isNaN(priceNum) || priceNum < 50) {
			alert("価格は50円以上の数値で入力してください");
			return false;
		}
		if (!description.trim()) {
			alert("講座の内容を入力してください");
			return false;
		}
		if (description.length > 1000) {
			alert("講座の内容は1000文字以内で入力してください");
			return false;
		}
		if (!gameId) {
			alert("ゲームを選択してください");
			return false;
		}
		if (selectedTagIds.length > 3) {
			alert("タグは最大3つまで選択できます");
			return false;
		}

		return true;
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			return;
		}

		animation.startAnimation();

		try {
			let imageUrl = null;
			if (tempImageFile) {
				imageUrl = await uploadImage(tempImageFile);
				if (!imageUrl) {
					alert("画像のアップロードに失敗しました");
					animation.endAnimation();
					return;
				}
			}

			const response = await requestDB("course", "createCourse", {
				title: title.trim(),
				description: description.trim(),
				price: Number.parseInt(price),
				duration,
				coachId: userData.id,
				gameId: Number.parseInt(gameId as string),
				tagIds: selectedTagIds,
				image: imageUrl,
			});

			if (response.success) {
				alert("講座を作成しました！");
				// UserDataを再取得してからリダイレクト
				await fetchUserData();
				router.push("/mypage/coach/list");
			} else {
				alert("講座の作成に失敗しました");
			}
		} catch (error) {
			console.error("Error creating course:", error);
			alert("講座の作成中にエラーが発生しました");
		} finally {
			animation.endAnimation();
		}
	};

	const toggleTag = (tagId: number) => {
		setSelectedTagIds(prev => {
			if (prev.includes(tagId)) {
				return prev.filter(id => id !== tagId);
			} else {
				return [...prev, tagId];
			}
		});
	};

	if (!userData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">新規講座作成</div>
				<Border />
			</>
		);
	}

	return (
		<>
			<div className="p-mypage__title">新規講座作成</div>
			<Border />

			<div className="p-create">
				<div className="p-create__section">
					<div className="p-create__label">メイン画像</div>
					<div className="p-create__image-container">
						{tempImagePreview ? (
							<ImageBox
								src={tempImagePreview}
								className="p-create__image"
								objectFit="cover"
								onClick={() => imageInputRef.current?.click()}
							/>
						) : (
							<div
								className="p-create__image-placeholder"
								onClick={() => imageInputRef.current?.click()}
							>
								<ImageBox
									src={imageIcon}
									className="p-create__camera-icon"
								/>
							</div>
						)}
						<ImageBox
							src={cameraIcon}
							className="p-create__camera-icon-outer"
						/>
						<input
							ref={imageInputRef}
							type="file"
							accept="image/*"
							className="p-create__image-input"
							onChange={(e) => e.target.files && handleImageSelect(e.target.files[0])}
						/>
					</div>
				</div>

				<div className="p-create__section">
					<div className="p-create__label">講座タイトル</div>
					<div className="p-create__input-wrapper">
						<InputBox
							className="p-create__input"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="講座タイトル"
						/>
					</div>
					{/* <div className="p-create__helper">※50文字以内</div> */}
				</div>

				<div className="p-create__section">
					<div className="p-create__label">価格</div>
					<div className="p-create__input-wrapper">
						<InputBox
							className="p-create__input"
							type="number"
							value={price}
							onChange={(e) => setPrice(e.target.value)}
							placeholder="講座価格"
						/>
					</div>
					{/* <div className="p-create__helper">※50円以上で設定してください</div> */}
				</div>

				<div className="p-create__section">
					<div className="p-create__label">講座の内容</div>
					<div className="p-create__input-wrapper -textarea">
						<MultilineInput
							className="p-create__textarea"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="講座の内容"
							minHeight={150}
							maxHeight={150}
						/>
					</div>
					{/* <div className="p-create__helper">※1000文字以内</div> */}
				</div>

				{/* ゲーム選択 */}
				<div className="p-create__section">
					<div className="p-create__label">ゲーム</div>
					<div className="p-create__input-wrapper">
						<Filter
							className="p-create__filter"
							options={games.map((g) => ({ label: g.name, value: g.id }))}
							selectedValue={gameId}
							onChange={(value: string | number) => setGameId(value)}
						/>
					</div>
				</div>

				<div className="p-create__section">
					<div className="p-create__label">講座時間</div>
					<div className="p-create__duration-options">
						{[30, 60, 90, 120, 150, 180].map((minutes) => (
							<button
								key={minutes}
								className={`p-create__duration-option ${duration === minutes ? "-active" : ""}`}
								onClick={() => setDuration(minutes)}
							>
								{minutes}分
							</button>
						))}
					</div>
				</div>

				<div className="p-create__section">
					<div className="p-create__label">タグ（最大3つ）</div>
					<div className="p-create__tags">
						{tags.map((tag) => (
							<button
								key={tag.id}
								className={`p-create__tag ${selectedTagIds.includes(tag.id) ? "-selected" : ""}`}
								onClick={() => toggleTag(tag.id)}
							>
								{tag.name}
							</button>
						))}
					</div>
					{/* <div className="p-create__helper">※関連するタグを選択してください</div> */}
				</div>
				<div className="p-create__buttons">
					<Button
						className="p-create__submit"
						onClick={handleSubmit}
					>
						講座を作成する
					</Button></div>
			</div>
		</>
	);
};

export default CoachCreatePage;