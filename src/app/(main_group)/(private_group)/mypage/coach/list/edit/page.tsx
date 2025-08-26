"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import { Button } from "@/components/button";
import { InputBox } from "@/components/inputBox";
import { MultilineInput } from "@/components/multilineInput";
import { Filter } from "@/components/filter";
import { requestDB } from "@/services/axios";
import { useContext, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Border from "@/components/border";
import { ImageBox } from "@/components/imageBox";
import imageIcon from "@/assets/image/image.svg";
import cameraIcon from "@/assets/image/camera.svg";
import type { Game, Tag, Course } from "@/type/models";
import { optimizeImage } from "@/utils/imageResize";
import { uploadImage } from "@/utils/imageUpload";

const CoachEditPage = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const searchParams = useSearchParams()!;
	const courseId = searchParams.get("courseId");

	// フォーム入力
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [duration, setDuration] = useState(30);
	const [gameId, setGameId] = useState<number | string>("");
	const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
	const [isPublic, setIsPublic] = useState(false);

	// 画像関連
	const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
	const [tempImageFile, setTempImageFile] = useState<File | null>(null);
	const [tempImagePreview, setTempImagePreview] = useState<string>("");
	const imageInputRef = useRef<HTMLInputElement>(null);

	// データ
	const [games, setGames] = useState<Game[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [course, setCourse] = useState<Course | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		animation.startAnimation();
		if (!courseId) {
			alert("講座IDが指定されていません");
			router.push("/mypage/coach/list");
			return;
		}
		fetchInitialData();
	}, [courseId]);

	useEffect(() => {
		if (userData && games.length > 0 && tags.length > 0 && course) {
			setTitle(course.title);
			setDescription(course.description);
			setPrice(course.price.toString());
			setDuration(course.duration);
			setGameId(course.gameId!);
			setSelectedTagIds(course.tagCourses?.map(t => t.tagId) || []);
			setCurrentImageUrl(course.image || "");
			setIsPublic(course.isPublic);

			setIsLoading(false);
			animation.endAnimation();
		}
	}, [userData, games, tags, course]);

	const fetchInitialData = async () => {
		try {
			const courseResponse = await requestDB("course", "readCourseById", {
				id: Number.parseInt(courseId!)
			});
			console.log(courseResponse)
			if (!courseResponse.success) {
				alert("講座情報の取得に失敗しました");
				animation.endAnimation()
				router.push("/mypage/coach/list");
				return;
			}

			const courseData = courseResponse.data;
			// 権限チェック
			if (courseData.coachId !== userData?.id) {
				alert("この講座を編集する権限がありません");
				animation.endAnimation()
				router.push("/mypage/coach/list");
				return;
			}

			setCourse(courseData);

			// ゲーム一覧を取得
			const gamesResponse = await requestDB("game", "readAllGames");
			if (gamesResponse.success) {
				setGames(gamesResponse.data);
			}

			// タグ一覧を取得
			const tagsResponse = await requestDB("tag", "readTags");
			if (tagsResponse.success) {
				setTags(tagsResponse.data);
			}
		} catch (error) {
			console.error("Error fetching initial data:", error);
			alert("データの取得に失敗しました");
			router.push("/mypage/coach/list");
		}
	};

	const handleDelete = () => {
		router.push(`/mypage/coach/list/delete?courseId=${courseId}`);
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
			let imageUrl = currentImageUrl;

			// 新しい画像がアップロードされた場合
			if (tempImageFile) {
				const uploadedUrl = await uploadImage(tempImageFile, "course", userData!.id);
				if (!uploadedUrl) {
					alert("画像のアップロードに失敗しました");
					animation.endAnimation();
					return;
				}
				imageUrl = uploadedUrl;
			}

			const response = await requestDB("course", "updateCourse", {
				id: Number.parseInt(courseId!),
				title: title.trim(),
				description: description.trim(),
				price: Number.parseInt(price),
				duration,
				gameId: Number.parseInt(gameId as string),
				tagIds: selectedTagIds,
				image: imageUrl,
			});

			if (response.success) {
				alert("講座を更新しました！");
				// UserDataを再取得してからリダイレクト
				await fetchUserData();
				router.push("/mypage/coach/list");
			} else {
				alert("講座の更新に失敗しました");
			}
		} catch (error) {
			console.error("Error updating course:", error);
			alert("講座の更新中にエラーが発生しました");
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

	const handlePublic = async () => {
		animation.startAnimation();
		try {
			const response = await requestDB("course", "updateCoursePublicStatus", {
				id: Number.parseInt(courseId!),
				isPublic: true,
			});

			if (response.success) {
				alert("講座を公開しました！");
				setIsPublic(true);
				// UserDataを再取得してからリダイレクト
				await fetchUserData();
				router.push("/mypage/coach/list");
			} else {
				alert("公開に失敗しました");
			}
		} catch (error) {
			console.error("Error updating public status:", error);
			alert("公開中にエラーが発生しました");
		} finally {
			animation.endAnimation();
		}
	};

	const handlePrivate = async () => {
		animation.startAnimation();
		try {
			const response = await requestDB("course", "updateCoursePublicStatus", {
				id: Number.parseInt(courseId!),
				isPublic: false,
			});

			if (response.success) {
				alert("講座を非公開にしました");
				setIsPublic(false);
				// UserDataを再取得してからリダイレクト
				await fetchUserData();
				router.push("/mypage/coach/list");
			} else {
				alert("非公開に失敗しました");
			}
		} catch (error) {
			console.error("Error updating public status:", error);
			alert("非公開中にエラーが発生しました");
		} finally {
			animation.endAnimation();
		}
	};

	if (!userData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">講座編集</div>
				<Border />
			</>
		);
	}

	return (
		<>
			<div className="p-mypage__title">講座編集</div>
			<Border />

			<div className="p-create">
				<div className="p-create__section">
					<div className="p-create__label">メイン画像</div>
					<div className="p-create__image-container">
						{(tempImagePreview || currentImageUrl) ? (
							<ImageBox
								src={tempImagePreview || currentImageUrl}
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
									onClick={() => imageInputRef.current?.click()}
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
				</div>

				{/* ゲーム選択 */}
				<div className="p-create__section">
					<div className="p-create__label">ゲーム</div>
					<div className="p-create__input-wrapper">
						<Filter
							className="p-create__filter"
							options={games.map((g) => ({ label: g.name, value: g.id }))}
							selectedValue={gameId}
							onChange={(value: any) => setGameId(value)}
						/>
					</div>
				</div>

				<div className="p-create__section">
					<div className="p-create__label">講座時間</div>
					<div className="p-create__duration-options">
						{[30, 60, 90, 120].map((minutes) => (
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
				</div>
				<div className=" p-create__buttons">
					<Button
						className="p-create__submit"
						onClick={handleSubmit}
					>
						編集を保存する
					</Button>
					<Button
						className="p-create__submit"
						onClick={isPublic ? handlePrivate : handlePublic}
					>
						{isPublic ? "講座を非公開にする" : "講座を公開する"}
					</Button>
					<Button
						className="p-create__submit u-bg-re"
						onClick={handleDelete}
					>講座を完全に削除する
					</Button>
				</div></div>
		</>
	);
};

export default CoachEditPage;