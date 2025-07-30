"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { InputBox } from "@/components/inputBox";
import { MultilineInput } from "@/components/multilineInput";
import { Axios } from "@/services/axios";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageBox } from "@/components/imageBox";
import { BackButton } from "@/components/backbutton";

type Step = 1 | 2 | 3;

const ContactPage = () => {
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState<Step>(1);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { userData } = useContext(UserDataContext)!;

	useEffect(() => {
		if (userData) {
			setEmail(userData.email);
		}
	}, [userData]);

	const validateStep1 = () => {
		if (!name.trim()) {
			alert("お名前を入力してください");
			return false;
		}
		if (!email.trim()) {
			alert("メールアドレスを入力してください");
			return false;
		}
		if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
			alert("正しいメールアドレスを入力してください");
			return false;
		}
		if (!message.trim()) {
			alert("お問い合わせ内容を入力してください");
			return false;
		}
		if (message.length > 1000) {
			alert("お問い合わせ内容は1000文字以内で入力してください");
			return false;
		}
		return true;
	};

	const handleNext = () => {
		if (currentStep === 1 && validateStep1()) {
			setCurrentStep(2);
		}
	};

	const handleBack = () => {
		if (currentStep === 2) {
			setCurrentStep(1);
		}
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		animation.startAnimation();

		try {
			const response = await Axios.post("/api/contact", {
				name,
				email,
				message,
			});

			if (response.data.success) {
				setCurrentStep(3);
			} else {
				alert("送信中にエラーが発生しました。しばらく経ってから再度お試しください。");
			}
		} catch (error) {
			console.error("Error sending contact:", error);
			alert("送信中にエラーが発生しました。しばらく経ってから再度お試しください。");
		} finally {
			setIsSubmitting(false);
			animation.endAnimation();
		}
	};

	const handleBackToTop = () => {
		router.push("/");
	};

	return (
		<div className="l-page p-contact">
			<div className="p-contact__title">お問い合わせ{currentStep === 2 && "確認"}{currentStep === 3 && "完了"}</div>
			<Border />

			{currentStep === 1 && (
				<>
					<div className="p-contact__item">
						<div className="p-contact__item-label">お名前</div>
						<div className="p-contact__item-input-outline">
							<InputBox
								className="p-contact__item-input"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</div>
					</div>

					<div className="p-contact__item">
						<div className="p-contact__item-label">メールアドレス</div>
						<div className="p-contact__item-input-outline">
							<InputBox
								className="p-contact__item-input"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="example@email.com"
							/>
						</div>
					</div>

					<div className="p-contact__item">
						<div className="p-contact__item-label">お問い合わせ内容</div>
						<div className="p-contact__item-input-outline -multi">
							<MultilineInput
								className="p-contact__item-input p-contact__item-textarea"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder="お問い合わせ内容をご記入ください"
								minHeight={200}
								maxHeight={200}
							/>
						</div>
						<div className="p-contact__text">※1000文字まで</div>
					</div>

					<div className="p-contact__button-wrapper">
						<Button
							className="p-contact__submit"
							onClick={handleNext}
						>
							確認画面へ
						</Button>
					</div>
				</>
			)}

			{/* ステップ2: 確認画面 */}
			{currentStep === 2 && (
				<>
					<BackButton className="p-courses__back" back={() => setCurrentStep(1)} />
					<div className="p-contact__confirm">
						<div className="p-contact__confirm-item">
							<div className="p-contact__confirm-label">お名前</div>
							<div className="p-contact__confirm-value">{name}</div>
						</div>

						<div className="p-contact__confirm-item">
							<div className="p-contact__confirm-label">メールアドレス</div>
							<div className="p-contact__confirm-value">{email}</div>
						</div>

						<div className="p-contact__confirm-item">
							<div className="p-contact__confirm-label">お問い合わせ内容</div>
							<div className="p-contact__confirm-value p-contact__confirm-message">
								{message.split('\n').map((line, index) => (
									<span key={index}>
										{line}
										{index < message.split('\n').length - 1 && <br />}
									</span>
								))}
							</div>
						</div>
					</div>
					<div className="p-contact__button-wrapper p-contact__button-group">
						<Button
							className="p-contact__submit"
							onClick={handleSubmit}
							disabled={isSubmitting}
						>
							{isSubmitting ? "送信中..." : "送信する"}
						</Button>
					</div>
				</>
			)}

			{/* ステップ3: 完了画面 */}
			{currentStep === 3 && (
				<div className="p-contact__complete">
					<div className="p-contact__complete-message">
						<h2>お問い合わせ<br />ありがとうございます。</h2>
						<p>
							{email} より、<br />
							お問い合わせ回答メールをお送りします。<br />
							回答メールが届かない場合は、<br />
							入力していただいたメールアドレスに<br />
							誤りがないかをご確認の上、<br />
							再度当フォームよりお問い合わせをお願いいたします。
						</p>
					</div>

					<div className="p-contact__button-wrapper">
						<Button
							className="p-contact__submit"
							onClick={handleBackToTop}
						>
							TOPへ戻る
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

export default ContactPage;