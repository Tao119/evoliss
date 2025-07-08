"use client";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import mailIcon from "@/assets/image/mail.svg";
import { BackButton } from "@/components/backbutton";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const Page = () => {
	const { userData } = useContext(UserDataContext)!;
	const [email, setEmail] = useState("");
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
	}, [userData, router]);

	const sendConfirmMail = async () => {
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
				router.push(
					`/reset-password?email=${encodeURIComponent(email)}${
						callbackPath ? "&callback=" + encodeURIComponent(callbackPath) : ""
					}`,
				);
			} else {
				setErr(data.error || "エラーが発生しました。");
			}
		} catch (error) {
			setErr("ネットワークエラーが発生しました。");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-sign-in l-page">
			<span className="p-sign-in__title">パスワードを忘れた方へ</span>
			<span className="p-sign-in__err">{err}</span>

			<div className="p-sign-in__item u-mb24">
				<ImageBox className="p-sign-in__input-icon" src={mailIcon} />
				<input
					className={`p-sign-in__input`}
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="example@co.jp"
				/>
			</div>

			<div className="p-sign-in__text">
				パスワード再設定用のメールをお送りします
			</div>

			<Button
				className={`p-sign-in__submit ${!email || loading ? "-disabled" : ""}`}
				disabled={!email || loading}
				onClick={sendConfirmMail}
			>
				{loading ? "送信中..." : "メール送信"}
			</Button>

			<div className="p-sign-in__text u-mt64">
				新規会員登録がまだの方は、こちらから
			</div>
			<Button
				className="p-sign-in__submit"
				onClick={() =>
					router.push(
						`/sign-up${callbackPath ? "?callback=" + callbackPath : ""}`,
					)
				}
			>
				新規会員登録
			</Button>
		</div>
	);
};

export default Page;
