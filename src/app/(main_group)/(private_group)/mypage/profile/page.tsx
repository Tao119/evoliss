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
import { optimizeImage } from "@/utils/imageResize";
import { uploadImage } from "@/utils/imageUpload";

import youtubeIcon from "@/assets/image/youtube.svg"
import xIcon from "@/assets/image/x.svg"
import noteIcon from "@/assets/image/note.svg"

const ProfilePage = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const [name, setName] = useState("");
	const [bio, setBio] = useState("");
	const [icon, setIcon] = useState("");
	const [gameId, setGameId] = useState<number | string>();
	const iconInputRef = useRef<HTMLInputElement>(null);
	const [youtubeLink, setYoutubeLink] = useState("");
	const [xLink, setXLink] = useState("");
	const [noteLink, setNoteLink] = useState("");


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
			setYoutubeLink(userData.youtube || "");
			setXLink(userData.x || "");
			setNoteLink(userData.note || "");
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

	// SNS URLのバリデーション関数と正規化
	const normalizeYoutubeUrl = (input: string): string => {
		if (!input) return '';
		// 完全なURLの場合はそのまま返す
		if (input.startsWith('http://') || input.startsWith('https://')) {
			return input;
		}
		// チャンネルIDや@ハンドルの場合はURLに変換
		if (input.startsWith('@')) {
			return `https://youtube.com/${input}`;
		}
		// その他のIDの場合はチャンネルURLに変換
		return `https://youtube.com/channel/${input}`;
	};

	const validateYoutubeUrl = (url: string): boolean => {
		if (!url) return true;
		// URLパターン
		const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(channel\/|c\/|user\/|@)|youtu\.be\/)([\w-]+)/;
		// チャンネルIDパターン（UC開始の24文字）
		const channelIdPattern = /^UC[a-zA-Z0-9_-]{22}$/;
		// @ハンドルパターン
		const handlePattern = /^@[a-zA-Z0-9_-]+$/;

		return urlPattern.test(url) || channelIdPattern.test(url) || handlePattern.test(url);
	};

	const normalizeXUrl = (input: string): string => {
		if (!input) return '';
		// 完全なURLの場合はそのまま返す
		if (input.startsWith('http://') || input.startsWith('https://')) {
			return input;
		}
		// @を除去してURLに変換
		const username = input.replace(/^@/, '');
		return `https://x.com/${username}`;
	};

	const validateXUrl = (input: string): boolean => {
		if (!input) return true;
		// URLパターン
		const urlPattern = /^(https?:\/\/)?(www\.)?(twitter\.com\/|x\.com\/)([a-zA-Z0-9_]{1,15})$/;
		// ユーザー名パターン
		const usernamePattern = /^@?[a-zA-Z0-9_]{1,15}$/;

		return urlPattern.test(input) || usernamePattern.test(input);
	};

	const normalizeNoteUrl = (input: string): string => {
		if (!input) return '';
		// 完全なURLの場合はそのまま返す
		if (input.startsWith('http://') || input.startsWith('https://')) {
			return input;
		}
		// ユーザー名のみの場合はURLに変換
		return `https://note.com/${input}`;
	};

	const validateNoteUrl = (input: string): boolean => {
		if (!input) return true;
		// URLパターン
		const urlPattern = /^(https?:\/\/)?(note\.com\/)([\w-]+)$/;
		// ユーザー名パターン
		const usernamePattern = /^[\w-]+$/;

		return urlPattern.test(input) || usernamePattern.test(input);
	};

	const handleSave = async () => {
		if (name.length > 10) {
			return alert("名前は10文字以内で入力してください")
		}
		if (bio.length > 400) {
			return alert("自己紹介は400文字以内で入力してください")
		}

		// SNS URLのバリデーション
		if (youtubeLink && !validateYoutubeUrl(youtubeLink)) {
			return alert("正しいYouTubeチャンネルURL、チャンネルID、または@ハンドルを入力してください");
		}

		if (xLink && !validateXUrl(xLink)) {
			return alert("正しいXのURL、またはユーザー名（@付きも可）を入力してください");
		}

		if (noteLink && !validateNoteUrl(noteLink)) {
			return alert("正しいnoteのURL、またはユーザー名を入力してください");
		}

		animation.startAnimation();


		try {
		let newIconUrl = icon;

		if (tempIconFile) {
		const uploadResult = await uploadImage(tempIconFile, "icon", userData.id);
		if (uploadResult) {
		newIconUrl = uploadResult;
		} else {
		alert("画像のアップロードに失敗しました。");
		animation.endAnimation();
		return;
		}
		}


			// SNS URLを正規化（完全なURLに変換）
			const normalizedYoutube = normalizeYoutubeUrl(youtubeLink);
			const normalizedX = normalizeXUrl(xLink);
			const normalizedNote = normalizeNoteUrl(noteLink);

			const response = await requestDB("user", "updateUser", {
				id: userData.id,
				name,
				bio,
				icon: newIconUrl,
				gameId: parseInt(gameId as string),
				youtube: normalizedYoutube,
				x: normalizedX,
				note: normalizedNote,
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

	const handleIconFileSelect = async (file: File) => {
		const fileSizeInMB = file.size / (1024 * 1024);
		
		// ファイルサイズのチェック
		if (fileSizeInMB > 1000) { // 1GB以上
			alert(`画像サイズが大きすぎます（${fileSizeInMB.toFixed(2)}MB）。1GB未満の画像をアップロードしてください。`);
			return;
		}

		try {
			// 画像タイプのチェック
			if (!file.type.startsWith('image/')) {
				alert('画像ファイルを選択してください。');
				return;
			}

			console.log(`Processing image: ${file.name} (${fileSizeInMB.toFixed(2)}MB)`);
			
			// 画像を最適化（最大1MBに圧縮）
			const optimizedFile = await optimizeImage(file, 1);
			
			const optimizedSizeInMB = optimizedFile.size / (1024 * 1024);
			console.log(`Image optimized: ${optimizedSizeInMB.toFixed(2)}MB`);

			// ファイルを一時保存
			setTempIconFile(optimizedFile);

			// プレビュー用のURLを生成
			const reader = new FileReader();
			reader.onload = (e) => {
				setTempIconPreview(e.target?.result as string);
			};
			reader.readAsDataURL(optimizedFile);
		} catch (error: any) {
			console.error("画像の最適化に失敗しました:", error);
			
			if (error.message?.includes('画像のサイズが大きすぎる')) {
				alert(error.message);
			} else if (fileSizeInMB > 100) {
				alert(`画像サイズが大きすぎるため処理できませんでした（${fileSizeInMB.toFixed(2)}MB）。100MB未満の画像をお試しください。`);
			} else {
				alert("画像の処理に失敗しました。別の画像をお試しください。");
			}
		}
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
						onClick={() => iconInputRef.current?.click()}
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
					<Filter
						className="p-profile__item-input -filter"
						options={games.map((g) => ({ label: g.name, value: g.id }))}
						includeDefault
						label="選択して下さい"
						selectedValue={userData.gameId}
						onChange={(e: any) => setGameId(e)} /></div>
			</div>
			<div className="p-profile__item">
				<div className="p-profile__item-label">SNS連携</div>
				<div className="p-profile__sns">
					<ImageBox src={youtubeIcon} className="p-profile__sns-icon" />
					<InputBox
						className="p-profile__sns-input"
						placeholder="URL、チャンネルID、または@ハンドル"
						value={youtubeLink}
						onChange={(e) => setYoutubeLink(e.target.value)}
					/>
				</div>
				<div className="p-profile__sns">
					<ImageBox src={xIcon} className="p-profile__sns-icon" />
					<InputBox
						className="p-profile__sns-input"
						value={xLink}
						placeholder="URL、またはユーザー名（@付きも可）"
						onChange={(e) => setXLink(e.target.value)}
					/>
				</div>
				<div className="p-profile__sns">
					<ImageBox src={noteIcon} className="p-profile__sns-icon" />
					<InputBox
						className="p-profile__sns-input"
						value={noteLink}
						placeholder="URL、またはユーザー名"
						onChange={(e) => setNoteLink(e.target.value)}
					/>
				</div>
			</div>
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