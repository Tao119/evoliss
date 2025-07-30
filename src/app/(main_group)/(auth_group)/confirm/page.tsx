"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";

import { Button } from "@/components/button";
import { InputBox } from "@/components/inputBox";
import { signin } from "@/services/auth";
import { getCognitoErrorMessage } from "@/services/cognitoErrorHandler";
import { getSecretHash } from "@/services/hash";
import {
	CognitoIdentityProviderClient,
	ConfirmSignUpCommand,
	ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const Page = () => {
	const { userData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const [code, setCode] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [resendLoading, setResendLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const router = useRouter();
	const params = useSearchParams();
	const email = params?.get("email");
	const password = params?.get("password"); // サインアップ後の自動ログインに必要
	const callbackPath = params?.get("callback");

	useEffect(() => {
		if (userData) {
			router.push(callbackPath ?? "/");
			return;
		}

		if (!email) {
			// emailパラメータがない場合はサインアップページにリダイレクト
			router.push("/sign-up");
			return;
		}
	}, [userData, email, router, callbackPath]);

	const handleConfirm = async () => {
		if (!code.trim()) {
			setError("確認コードを入力してください");
			return;
		}

		setLoading(true);
		setError("");

		const client = new CognitoIdentityProviderClient({
			region: process.env.NEXT_PUBLIC_AWS_REGION,
		});

		try {
			const secretHash = getSecretHash(
				email!,
				process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
				process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET!,
			);

			const params = {
				ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
				Username: email!,
				ConfirmationCode: code.trim(),
				SecretHash: secretHash,
			};

			const command = new ConfirmSignUpCommand(params);
			await client.send(command);

			setSuccess(true);

			// 確認成功後、自動ログインを試行
			if (password) {
				animation.startAnimation();
				try {
					const result = await signin({
						email: email!,
						password: password,
						callbackUrl: callbackPath || "/",
					});

					if (result?.error) {
						setTimeout(() => {
							router.push(
								`/sign-in${
									callbackPath
										? "?callback=" + encodeURIComponent(callbackPath)
										: ""
								}`,
							);
						}, 2000);
					} else {
						router.push(callbackPath ?? "/");
					}
				} catch (loginError) {
					console.error("Auto login failed:", loginError);
					setTimeout(() => {
						router.push(
							`/sign-in${
								callbackPath
									? "?callback=" + encodeURIComponent(callbackPath)
									: ""
							}`,
						);
					}, 2000);
				} finally {
					animation.endAnimation();
				}
			} else {
				setTimeout(() => {
					router.push(
						`/sign-in${
							callbackPath
								? "?callback=" + encodeURIComponent(callbackPath)
								: ""
						}`,
					);
				}, 2000);
			}
		} catch (error) {
			console.error("Confirmation error:", error);
			const errorMessage = getCognitoErrorMessage(error as Error, "confirm");
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleResendCode = async () => {
		setResendLoading(true);
		setError("");

		const client = new CognitoIdentityProviderClient({
			region: process.env.NEXT_PUBLIC_AWS_REGION,
		});

		try {
			const secretHash = getSecretHash(
				email!,
				process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
				process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET!,
			);

			const params = {
				ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
				Username: email!,
				SecretHash: secretHash,
			};

			const command = new ResendConfirmationCodeCommand(params);
			await client.send(command);

			setError("確認コードを再送信しました");
		} catch (error) {
			console.error("Resend error:", error);
			const errorMessage = getCognitoErrorMessage(error as Error, "confirm");
			setError(errorMessage);
		} finally {
			setResendLoading(false);
		}
	};

	if (!email) {
		return null; // リダイレクト中
	}

	if (success) {
		return (
			<div className="p-sign-in l-page">
				<div className="p-sign-in__title">確認完了</div>
				<div className="p-sign-in__text">
					メールアドレスの確認が完了しました。
					<br />
					{password ? "自動ログイン中..." : "ログインページに移動します..."}
				</div>
			</div>
		);
	}

	return (
		<div className="p-sign-in l-page">
			<div className="p-sign-in__title">メールアドレス確認</div>
			<div className="p-sign-in__err">{error}</div>
			<div className="p-sign-in__text">{email} に確認コードを送信しました</div>

			<div className="p-sign-in__item u-mb24">
				<InputBox
					className="p-sign-in__input"
					placeholder="確認コード"
					value={code}
					onChange={(e) => setCode(e.target.value)}
					//   onKeyPress={(e) => {
					//     if (e.key === "Enter" && code.trim() && !loading) {
					//       handleConfirm();
					//     }
					//   }}
				/>
			</div>

			<Button
				disabled={!code.trim() || loading}
				className={`p-sign-in__submit u-mb24 ${
					!code.trim() || loading ? "-disabled" : ""
				}`}
				onClick={handleConfirm}
			>
				{loading ? "確認中..." : "確認する"}
			</Button>

			<Button
				className="p-sign-in__submit"
				disabled={resendLoading}
				onClick={handleResendCode}
			>
				{resendLoading ? "再送信中..." : "コードを再送信"}
			</Button>
		</div>
	);
};

export default Page;
