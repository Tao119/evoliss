"use client";
import { UserDataContext } from "@/app/contextProvider";
import eyeIcon from "@/assets/image/eye.svg";
import lockIcon from "@/assets/image/key.svg";
import mailIcon from "@/assets/image/mail.svg";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const Page = () => {
	const { userData } = useContext(UserDataContext)!;
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [step, setStep] = useState(0); // 0: メール入力, 1: コード&パスワード入力, 2: 完了
	const [err, setErr] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const params = useSearchParams();
	const callbackPath = params?.get("callback");
	const emailFromUrl = params?.get("email");
	const router = useRouter();

	useEffect(() => {
		if (userData) {
			router.push(callbackPath ?? "/");
		}

		if (emailFromUrl) {
			setEmail(decodeURIComponent(emailFromUrl));
			setStep(1);
		}
	}, [userData, router, emailFromUrl, callbackPath]);

	const sendResetCode = async () => {
		if (!email) return;

		setLoading(true);
		setErr("");

		try {
			const response = await fetch("/api/reset-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					action: "send",
					email: email,
				}),
			});

			const data = await response.json();

			if (data.success) {
				setStep(1);
			} else {
				setErr(data.error || "エラーが発生しました。");
			}
		} catch {
			setErr("ネットワークエラーが発生しました。");
		} finally {
			setLoading(false);
		}
	};

	const confirmPasswordReset = async () => {
		if (!code || !newPassword || !confirmPassword) {
			setErr("すべての項目を入力してください。");
			return;
		}

		if (newPassword !== confirmPassword) {
			setErr("パスワードが一致しません。");
			return;
		}

		if (newPassword.length < 8) {
			setErr("パスワードは8文字以上で入力してください。");
			return;
		}

		setLoading(true);
		setErr("");

		try {
			const response = await fetch("/api/reset-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					action: "confirm",
					email: email,
					code: code,
					newPassword: newPassword,
				}),
			});

			const data = await response.json();

			if (data.success) {
				setStep(2);
			} else {
				setErr(data.error || "エラーが発生しました。");
			}
		} catch {
			setErr("ネットワークエラーが発生しました。");
		} finally {
			setLoading(false);
		}
	};

	const resendCode = () => {
		setStep(0);
		setCode("");
		setErr("");
	};

	return (
		<div className="p-sign-in l-page">
			{step === 0 && (
				<>
					<span className="p-sign-in__title">パスワードをリセット</span>
					<span className="p-sign-in__err">{err}</span>

					<div className="p-sign-in__item u-mb16">
						<input
							className={`p-sign-in__input -with-icon`}
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="example@co.jp"
						/>
					</div>

					<div className="p-sign-in__text">
						パスワードリセット用のコードをメールでお送りします
					</div>

					<Button
						className={`p-sign-in__submit ${!email || loading ? "-disabled" : ""
							}`}
						disabled={!email || loading}
						onClick={sendResetCode}
					>
						{loading ? "送信中..." : "リセットコードを送信"}
					</Button>

					<div className="p-sign-in__text u-mt64">
						ログインページに戻る場合は、こちらから
					</div>
					<Button
						className="p-sign-in__submit"
						onClick={() =>
							router.push(
								`/sign-in${callbackPath ? "?callback=" + callbackPath : ""}`,
							)
						}
					>
						ログインページへ
					</Button>
				</>
			)}

			{step === 1 && (
				<>
					<span className="p-sign-in__title">新しいパスワードを設定</span>
					<span className="p-sign-in__err">{err}</span>

					<div className="p-sign-in__text">
						{email} にリセットコードを送信しました
					</div>

					<div className="p-sign-in__item u-mb16">
						<input
							className={`p-sign-in__input`}
							type="text"
							value={code}
							onChange={(e) => setCode(e.target.value)}
							placeholder="確認コード"
						/>
					</div>

					<div className="p-sign-in__item u-mb16">
						<ImageBox className="p-sign-in__input-icon" src={lockIcon} />
						<input
							className={`p-sign-in__input -with-icon`}
							type={showPassword ? "text" : "password"}
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="新しいパスワード"
						/>
						<ImageBox
							className={`p-sign-in__input-password-icon ${showPassword ? "-show" : ""
								}`}
							src={eyeIcon}
							onClick={() => setShowPassword(!showPassword)}
						/>
					</div>

					<div className="p-sign-in__item u-mb16">
						<ImageBox className="p-sign-in__input-icon" src={lockIcon} />
						<input
							className={`p-sign-in__input -with-icon`}
							type={showConfirmPassword ? "text" : "password"}
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="パスワード確認"
						/>
						<ImageBox
							className={`p-sign-in__input-password-icon ${showConfirmPassword ? "-show" : ""
								}`}
							src={eyeIcon}
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
						/>
					</div>

					<div className="p-sign-in__text">
						パスワードは8文字以上で、大文字・小文字・数字・記号を含めてください
					</div>

					<Button
						className={`p-sign-in__submit u-mb16 ${!code || !newPassword || !confirmPassword || loading
							? "-disabled"
							: ""
							}`}
						disabled={!code || !newPassword || !confirmPassword || loading}
						onClick={confirmPasswordReset}
					>
						{loading ? "設定中..." : "パスワードを設定"}
					</Button>

					<Button className="p-sign-in__submit -secondary" onClick={resendCode}>
						コードを再送信
					</Button>
				</>
			)}

			{step === 2 && (
				<>
					<span className="p-sign-in__title">パスワードリセット完了</span>

					<div className="p-sign-in__text -no-bold">
						パスワードが正常にリセットされました。
						<br />
						新しいパスワードでログインしてください。
					</div>

					<Button
						className="p-sign-in__submit"
						onClick={() =>
							router.push(
								`/sign-in${callbackPath ? "?callback=" + callbackPath : ""}`,
							)
						}
					>
						ログインページへ
					</Button>
				</>
			)}
		</div>
	);
};

export default Page;
