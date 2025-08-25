"use client";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import lockIcon from "@/assets/image/key.svg";
import mailIcon from "@/assets/image/mail.svg";
import eyeIcon from "@/assets/image/show_input.svg";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { requestDB } from "@/services/axios";
import { getCognitoErrorMessage } from "@/services/cognitoErrorHandler";
import { getSecretHash } from "@/services/hash";
import {
	CognitoIdentityProviderClient,
	SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const Page = () => {
	const { userData } = useContext(UserDataContext)!;
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
	const [err, setErr] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const animation = useContext(AnimationContext)!;

	const [policyChecked, setPolicyChecked] = useState(false);
	const [termsChecked, setTermsChecked] = useState(false);

	const params = useSearchParams();
	const callbackPath = params?.get("callback");

	useEffect(() => {
		if (userData) {
			router.push(callbackPath ?? "/");
		}
	}, [userData, router, callbackPath]);

	const handleSignUp = async () => {
		if (!email || !password || !passwordConfirm) {
			setErr("すべての項目を入力してください");
			return;
		}

		if (password !== passwordConfirm) {
			setErr("確認用パスワードが一致しません");
			return;
		}

		if (!termsChecked || !policyChecked) {
			setErr("利用規約とプライバシーポリシーに同意してください");
			return;
		}

		setLoading(true);
		setErr("");

		try {
			animation.startAnimation();

			const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
			const secretHash = getSecretHash(
				email,
				process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
				process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET!,
			);

			const client = new CognitoIdentityProviderClient({
				region: process.env.NEXT_PUBLIC_AWS_REGION,
			});

			const params = {
				ClientId: clientId,
				Username: email,
				Email: email,
				Password: password,
				UserAttributes: [{ Name: "email", Value: email }],
				SecretHash: secretHash,
			};

			const command = new SignUpCommand(params);
			await client.send(command);

			// データベースにユーザー情報を保存
			const { success } = await requestDB("user", "createUser", {
				email,
			});

			if (success) {
				// 確認ページにリダイレクト（パスワードも渡して自動ログインできるようにする）
				const queryParams = new URLSearchParams({
					email: email,
					password: password, // 自動ログイン用
				});

				if (callbackPath) {
					queryParams.set("callback", callbackPath);
				}

				router.push(`/confirm?${queryParams.toString()}`);
			} else {
				setErr("ユーザー情報の保存に失敗しました");
			}
		} catch (cognitoError) {
			const errorMessage = getCognitoErrorMessage(cognitoError as Error, "signup");
			setErr(errorMessage);
		} finally {
			setLoading(false);
			animation.endAnimation();
		}
	};

	return (
		<div className="p-sign-in l-page">
			<span className="p-sign-in__title">新規会員登録</span>
			<span className="p-sign-in__err">{err}</span>

			<div className="p-sign-in__item u-mb16">
				<ImageBox className="p-sign-in__input-icon" src={mailIcon} />
				<input
					className={`p-sign-in__input -with-icon`}
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="example@co.jp"
				/>
			</div>

			<div className="p-sign-in__item u-mb16">
				<ImageBox className="p-sign-in__input-icon" src={lockIcon} />
				<input
					className={`p-sign-in__input -with-icon`}
					type={showPassword ? "text" : "password"}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="パスワード"
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
					type={showPasswordConfirm ? "text" : "password"}
					value={passwordConfirm}
					onChange={(e) => setPasswordConfirm(e.target.value)}
					placeholder="パスワード確認"
				/>
				<ImageBox
					className={`p-sign-in__input-password-icon ${showPasswordConfirm ? "-show" : ""
						}`}
					src={eyeIcon}
					onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
				/>
			</div>

			<div className="p-sign-in__checkbox-container">
				<div className="p-sign-in__checkbox-label">
					<input
						type="checkbox"
						className="c-checkbox-list__checkbox"
						checked={termsChecked}
						onChange={() => setTermsChecked((prev) => !prev)}
					/>
					<Link
						className="p-sign-in__checkbox-link"
						href="/terms"
						target="_blank"
					>
						利用規約
					</Link>
					に同意する
				</div>
				<div className="p-sign-in__checkbox-label">
					<input
						type="checkbox"
						className="c-checkbox-list__checkbox"
						checked={policyChecked}
						onChange={() => setPolicyChecked((prev) => !prev)}
					/>
					<Link
						className="p-sign-in__checkbox-link"
						href="/policy"
						target="_blank"
					>
						プライバシーポリシー
					</Link>
					に同意する
				</div>
			</div>

			<Button
				className={`p-sign-in__submit ${!email ||
						!password ||
						!passwordConfirm ||
						!policyChecked ||
						!termsChecked ||
						loading
						? "-disabled"
						: ""
					}`}
				disabled={
					!email ||
					!password ||
					!passwordConfirm ||
					!policyChecked ||
					!termsChecked ||
					loading
				}
				onClick={handleSignUp}
			>
				{loading ? "登録中..." : "登録用メール送信"}
			</Button>

			<div className="p-sign-in__text u-mt64">
				会員登録がお済みの方は、こちらから
			</div>
			<Button
				className="p-sign-in__submit"
				onClick={() =>
					router.push(
						`/sign-in${callbackPath
							? "?callback=" + encodeURIComponent(callbackPath)
							: ""
						}`,
					)
				}
			>
				ログイン
			</Button>
		</div>
	);
};

export default Page;
