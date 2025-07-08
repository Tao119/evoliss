"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { InputBox } from "@/components/inputBox";
import { MultilineInput } from "@/components/multilineInput";
import { Axios, requestDB } from "@/services/axios";
import { useContext, useState, useEffect, useRef } from "react";
import editIcon from "@/assets/image/camera.svg";
import defaultIcon from "@/assets/image/user_icon.svg";
import { Filter } from "@/components/filter";
import { Game } from "@/type/models";

const ProfilePage = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const [name, setName] = useState("");
	const [bio, setBio] = useState("");
	const [icon, setIcon] = useState("");
	const [gameId, setGameId] = useState<number | string>();
	const iconInputRef = useRef<HTMLInputElement>(null);

	// 一時的なアイコンファイルとプレビューURL
	const [tempIconFile, setTempIconFile] = useState<File | null>(null);
	const [tempIconPreview, setTempIconPreview] = useState<string>("");

	const [games, setGames] = useState<Game[]>()
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		animation.startAnimation();
		if (userData) {
			setName(userData.name || "");
			setBio(userData.bio || "");
			setIcon(userData.icon || "");
			setGameId(userData.gameId ?? undefined);
		}
		fetchGames()
	}, [userData]);

	useEffect(() => {
		if (userData && games) {
			setIsLoading(false);
			animation.endAnimation();
		}
	}, [userData, games]);

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


	if (!userData || !games || isLoading) {
		return (
			<>
				<div className="p-mypage__title">プロフィール変更</div>
				<Border />
			</>
		);
	}

	const handleSave = async () => {
		if (name.length > 10) {
			return alert("名前は10文字以内で入力してください")
		}
		if (bio.length > 400) {
			return alert("自己紹介は400文字以内で入力してください")
		}
		animation.startAnimation();


		try {
			let newIconUrl = icon;

			if (tempIconFile) {
				const uploadResult = await uploadImage(tempIconFile, "icon");
				if (uploadResult) {
					newIconUrl = uploadResult;
				} else {
					alert("画像のアップロードに失敗しました。");
					animation.endAnimation();
					return;
				}
			}


			const response = await requestDB("user", "updateUser", {
				id: userData.id,
				name,
				bio,
				icon: newIconUrl,
				gameId: parseInt(gameId as string)
			});

			if (response.success) {
				setTempIconFile(null);
				setTempIconPreview("");
				fetchUserData();
				alert("プロフィールの変更が完了しました！");
			} else {
				alert("Failed to update profile");
			}
		} catch (error) {
			console.error("Error saving profile:", error);
			alert("プロフィールの保存中にエラーが発生しました。");
		}

		animation.endAnimation();
	};

	const handleIconFileSelect = (file: File) => {
		// ファイルを一時保存
		setTempIconFile(file);

		// プレビュー用のURLを生成
		const reader = new FileReader();
		reader.onload = (e) => {
			setTempIconPreview(e.target?.result as string);
		};
		reader.readAsDataURL(file);
	};

	const uploadImage = async (file: File, type: "header" | "icon"): Promise<string | null> => {
		try {
			const fileName = `${userData.id}/${type}/${Date.now()}.${file.type.split("/")[1]}`;
			const fileBase64 = await fileToBase64(file);
			const keyPrefix = type;

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


	return (
		<>
			<div className="p-mypage__title">プロフィール変更</div>
			<Border />
			<div className="p-profile__icon">
				<div className="p-profile__icon-edit-wrapper">
					<ImageBox
						className="p-profile__icon-image"
						src={tempIconPreview || userData.icon || defaultIcon}
						objectFit="cover"
						round
					/>
					<ImageBox
						src={editIcon}
						alt="Edit Icon"
						className="p-profile__icon-edit"
						onClick={() => iconInputRef.current?.click()}
					/>
					<input
						type="file"
						ref={iconInputRef}
						className="p-profile__icon-upload"
						accept="image/*"
						onChange={(e) =>
							e.target.files && handleIconFileSelect(e.target.files[0])
						}
					/>
				</div>
			</div>
			<div className="p-profile__item">
				<div className="p-profile__item-label">名前</div>
				<div className="p-profile__item-input-outline">
					<InputBox className="p-profile__item-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
				<div className="p-profile__item-announce">※10文字以内</div>
			</div>
			<div className="p-profile__item">
				<div className="p-profile__item-label">自己紹介</div>

				<div className="p-profile__item-input-outline -multi">
					<MultilineInput className="p-profile__item-input"
						minHeight={150}
						maxHeight={150}
						value={bio} onChange={(e) => setBio(e.target.value)} />
				</div>
				<div className="p-profile__item-announce">※400文字以内</div>
			</div>
			<div className="p-profile__item">
				<div className="p-profile__item-label">メインゲーム</div>
				<div className="p-profile__item-input-outline">
					<Filter className="p-profile__item-input -filter" options={games.map((g) => ({ label: g.name, value: g.id }))} selectedValue={userData.gameId} onChange={(e: any) => setGameId(e)} /></div>
			</div>
			{/* <div className="p-profile__buttons"> */}
			{/* <Button
					className="p-profile__button p-profile__button--cancel"
					onClick={handleCancel}
				>
					キャンセル
				</Button> */}
			<Button
				className="p-profile__button p-profile__button--save"
				onClick={handleSave}
			>
				変更を保存する
			</Button>
			{/* </div> */}
		</>
	)
};

export default ProfilePage;