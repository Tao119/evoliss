"use client";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import cameraIcon from "@/assets/image/camera.svg";
import noteIcon from "@/assets/image/note.svg"; // noteアイコン
import defaultIcon from "@/assets/image/user_icon.svg";
import xIcon from "@/assets/image/x.svg"; // Xアイコン
import youtubeIcon from "@/assets/image/youtube.svg"; // YouTubeアイコン
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { MultilineInput } from "@/components/multilineInput";
import { Axios, requestDB } from "@/services/axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";

const Page = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const [name, setName] = useState("");
	const [icon, setIcon] = useState("");
	const [bio, setBio] = useState("");
	const [youtubeUrl, setYoutubeUrl] = useState("");
	const [xUrl, setXUrl] = useState("");
	const [noteUrl, setNoteUrl] = useState("");
	const [err, setErr] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const animation = useContext(AnimationContext)!;
	const iconInputRef = useRef<HTMLInputElement>(null);

	const params = useSearchParams();
	const callbackPath = params?.get("callback");

	const onReady = userData;

	useEffect(() => {
		if (userData && userData.isInitialized) {
			router.push(callbackPath ?? "/");
		}
	}, [userData, router, callbackPath]);

	useEffect(() => {
		if (onReady) {
			animation.endAnimation();
		}
	}, [onReady, animation]);

	if (!onReady) {
		return <div className="p-sign-in l-page"></div>;
	}

	// SNS URLのバリデーション関数
	const validateYoutubeUrl = (url: string): boolean => {
		if (!url) return true; // 空の場合はOK
		const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(channel\/|c\/|user\/|@)|youtu\.be\/)([\w-]+)/;
		const channelIdRegex = /^[\w-]+$/;
		return youtubeRegex.test(url) || channelIdRegex.test(url);
	};

	const validateXUrl = (username: string): boolean => {
		if (!username) return true; // 空の場合はOK
		// @を除去してからバリデーション
		const cleanUsername = username.replace(/^@/, '');
		const usernameRegex = /^[a-zA-Z0-9_]{1,15}$/;
		return usernameRegex.test(cleanUsername);
	};

	const validateNoteUrl = (url: string): boolean => {
		if (!url) return true; // 空の場合はOK
		const noteRegex = /^(https?:\/\/)?(note\.com\/)[\w-]+$/;
		return noteRegex.test(url);
	};

	const handleInitialize = async () => {
		if (!name.trim() || !bio.trim()) {
			setErr("名前と自己紹介は必須項目です");
			return;
		}

		if (name.length > 10) {
			setErr("名前は10文字以内で入力してください");
			return;
		}

		if (bio.length > 400) {
			setErr("自己紹介は400文字以内で入力してください");
			return;
		}

		// SNS URLのバリデーション
		if (youtubeUrl && !validateYoutubeUrl(youtubeUrl)) {
			setErr("正しいYouTubeチャンネルURLまたはIDを入力してください");
			return;
		}

		if (xUrl && !validateXUrl(xUrl)) {
			setErr("Xのユーザー名は英数字とアンダースコアのみ、最大15文字までです");
			return;
		}

		if (noteUrl && !validateNoteUrl(noteUrl)) {
			setErr("正しいnoteのプロフィールURLを入力してください");
			return;
		}

		setLoading(true);
		setErr("");

		try {
			animation.startAnimation();

			const updateData: {
				id: number;
				name: string;
				bio: string;
				isInitialized: boolean;
				icon?: string;
				youtubeUrl?: string;
				xUrl?: string;
				noteUrl?: string;
			} = {
				id: userData.id,
				name: name.trim(),
				bio: bio.trim(),
				isInitialized: true,
			};

			if (icon) {
				updateData.icon = icon;
			}

			// SNS情報を追加（現在のスキーマにない場合はコメントアウトのまま）
			// if (youtubeUrl.trim()) {
			//   // @を除去して保存
			//   updateData.youtubeUrl = youtubeUrl.trim();
			// }
			// if (xUrl.trim()) {
			//   // @を除去して保存
			//   updateData.xUrl = xUrl.trim().replace(/^@/, '');
			// }
			// if (noteUrl.trim()) {
			//   updateData.noteUrl = noteUrl.trim();
			// }

			const { success } = await requestDB("user", "initializeUser", updateData);

			if (success) {
				await fetchUserData();

				router.push(callbackPath ?? "/");
			} else {
				setErr("ユーザー情報の保存に失敗しました");
			}
		} catch (error) {
			console.error("Initialize user error:", error);
			setErr("初期設定中にエラーが発生しました");
		} finally {
			setLoading(false);
			animation.endAnimation();
		}
	};

	const handleUploadImage = async (file: File) => {
		if (!file) {
			setIcon("");
			return;
		}

		try {
			animation.startAnimation();
			const fileName = `${userData.id}/icon/${Date.now()}.${file.type.split("/")[1]
				}`;
			const fileBase64 = await fileToBase64(file);

			const response = await Axios.post("/api/s3/upload", {
				fileName,
				fileType: file.type,
				fileBase64,
				keyPrefix: "icon",
			});

			if (response.data.success) {
				setIcon(response.data.url);
			} else {
				alert("画像のアップロードに失敗しました。");
			}
		} catch (error) {
			console.error("Error uploading image:", error);
			alert("画像のアップロードに失敗しました。");
		} finally {
			animation.endAnimation();
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
		<div className="p-sign-in l-page">
			<span className="p-sign-in__title">会員情報入力</span>
			<span className="p-sign-in__err">{err}</span>

			<div className="p-sign-in__icon-container">
				<div className="p-sign-in__icon">
					<ImageBox
						className="p-sign-in__icon-image"
						src={icon || userData.icon || defaultIcon}
						objectFit="cover"
						round
					/>
					<ImageBox
						src={cameraIcon}
						alt="Edit Icon"
						className="p-sign-in__icon-edit"
						onClick={() => iconInputRef.current?.click()}
					/>
					<input
						type="file"
						ref={iconInputRef}
						className="p-sign-in__icon-upload"
						accept="image/*"
						onChange={(e) =>
							e.target.files && handleUploadImage(e.target.files[0])
						}
					/>
				</div>
			</div>

			<div className="p-sign-in__form-group u-mb24">
				<label className="p-sign-in__label">名前</label>
				<div className="p-sign-in__item">
					<input
						className="p-sign-in__input"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="お名前を入力してください"
						maxLength={10}
					/>
				</div>
				<div className="p-sign-in__char-count">※10文字以内</div>
			</div>

			<div className="p-sign-in__form-group u-mb24">
				<label className="p-sign-in__label">自己紹介</label>
				<div className="p-sign-in__item-multi">
					<MultilineInput
						className="p-sign-in__input"
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						placeholder="自己紹介を入力してください"
						maxHeight={200}
						minHeight={200}
					/>
				</div>
				<div className="p-sign-in__char-count">※400文字以内</div>
			</div>

			<div className="p-sign-in__form-group u-mb48">
				<label className="p-sign-in__label u-mb24">SNS連携（任意）</label>

				<div className="p-sign-in__sns-item">
					<ImageBox className="p-sign-in__sns-icon" src={youtubeIcon} />
					<input
						className="p-sign-in__sns-input"
						type="text"
						value={youtubeUrl}
						onChange={(e) => setYoutubeUrl(e.target.value)}
						placeholder="YouTubeチャンネルURLまたはID"
					/>
				</div>

				<div className="p-sign-in__sns-item">
					<ImageBox className="p-sign-in__sns-icon" src={xIcon} />
					<input
						className="p-sign-in__sns-input"
						type="text"
						value={xUrl}
						onChange={(e) => setXUrl(e.target.value)}
						placeholder="X（旧Twitter）のユーザー名（@なし）"
					/>
				</div>

				<div className="p-sign-in__sns-item">
					<ImageBox className="p-sign-in__sns-icon" src={noteIcon} />
					<input
						className="p-sign-in__sns-input"
						type="text"
						value={noteUrl}
						onChange={(e) => setNoteUrl(e.target.value)}
						placeholder="noteのプロフィールURL"
					/>
				</div>
			</div>

			<Button
				className={`p-sign-in__submit ${!name.trim() || !bio.trim() || loading ? "-disabled" : ""
					}`}
				disabled={!name.trim() || !bio.trim() || loading}
				onClick={handleInitialize}
			>
				{loading ? "登録中..." : "登録する"}
			</Button>
		</div>
	);
};

export default Page;
