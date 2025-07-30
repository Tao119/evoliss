"use client";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import eyeIcon from "@/assets/image/eye.svg";
import lockIcon from "@/assets/image/key.svg";
import mailIcon from "@/assets/image/mail.svg";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { signin } from "@/services/auth";
import { getCognitoErrorMessage } from "@/services/cognitoErrorHandler";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const Page = () => {
	const { userData } = useContext(UserDataContext)!;
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [err, setErr] = useState("");
	const [loading, setLoading] = useState(false);
	const params = useSearchParams();
	const callbackPath = params?.get("callback");

	const router = useRouter();
	const animation = useContext(AnimationContext)!;

	useEffect(() => {
		if (userData) {
			router.push(callbackPath ?? "/");
		}
	}, [userData, router, callbackPath]);

	const handleSignIn = async () => {
		if (!email || !password) {
			setErr("メールアドレスとパスワードを入力してください");
			return;
		}

		setLoading(true);
		setErr("");

		try {
			animation.startAnimation();

			const result = await signin({
				email,
				password,
				callbackUrl: callbackPath || "/",
			});

			if (result?.error) {
				const error = result.error;

				if (error === "UserNotConfirmedException") {
					// メールアドレス未確認の場合は確認ページにリダイレクト
					router.push(
						`/confirm?email=${encodeURIComponent(email)}${
							callbackPath
								? "&callback=" + encodeURIComponent(callbackPath)
								: ""
						}`,
					);
					return;
				}

				// Cognitoエラー名の形式で渡されたエラーを処理
				const errorObj = { name: error, message: error };
				const errorMessage = getCognitoErrorMessage(errorObj, "signin");
				setErr(errorMessage);
			} else {
				// ログイン成功
				router.push(callbackPath ?? "/");
			}
		} catch (error) {
			console.error("Sign in error:", error);
			setErr("ログイン中にエラーが発生しました");
		} finally {
			setLoading(false);
			animation.endAnimation();
		}
	};

	return (
		<div className="p-sign-in l-page">
			<span className="p-sign-in__title">ログイン</span>
			<span className="p-sign-in__err">{err}</span>

			<div className="p-sign-in__item u-mb24">
				<ImageBox className="p-sign-in__input-icon" src={mailIcon} />
				<input
					className={`p-sign-in__input -with-icon`}
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="example@co.jp"
					onKeyPress={(e) => {
						if (e.key === "Enter" && email && password && !loading) {
							handleSignIn();
						}
					}}
				/>
			</div>

			<div className="p-sign-in__item u-mb24">
				<ImageBox className="p-sign-in__input-icon" src={lockIcon} />
				<input
					className={`p-sign-in__input -with-icon`}
					type={showPassword ? "text" : "password"}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="パスワード"
					onKeyPress={(e) => {
						if (e.key === "Enter" && email && password && !loading) {
							handleSignIn();
						}
					}}
				/>
				<ImageBox
					className={`p-sign-in__input-password-icon ${
						showPassword ? "-show" : ""
					}`}
					src={eyeIcon}
					onClick={() => setShowPassword(!showPassword)}
				/>
			</div>

			<Button
				className={`p-sign-in__submit ${
					!email || !password || loading ? "-disabled" : ""
				}`}
				disabled={!email || !password || loading}
				onClick={handleSignIn}
			>
				{loading ? "ログイン中..." : "ログイン"}
			</Button>

			<div
				className="p-sign-in__link"
				onClick={() =>
					router.push(
						`/forgot-password${
							callbackPath
								? "?callback=" + encodeURIComponent(callbackPath)
								: ""
						}`,
					)
				}
			>
				パスワードを忘れた方へ
			</div>

			<div className="p-sign-in__text">
				新規会員登録がまだの方は、こちらから
			</div>
			<Button
				className="p-sign-in__submit"
				onClick={() =>
					router.push(
						`/sign-up${
							callbackPath
								? "?callback=" + encodeURIComponent(callbackPath)
								: ""
						}`,
					)
				}
			>
				新規会員登録
			</Button>
		</div>
	);
};

export default Page;
