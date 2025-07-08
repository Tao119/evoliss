"use client";

import { AnimationContext } from "@/app/contextProvider";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { InputBox } from "@/components/inputBox";
import { MultilineInput } from "@/components/multilineInput";
import { Axios } from "@/services/axios";
import { useContext, useState } from "react";
import { useRouter } from "next/navigation";

const ContactPage = () => {
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [subject, setSubject] = useState("");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const validateForm = () => {
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
		if (!subject.trim()) {
			alert("件名を入力してください");
			return false;
		}
		if (!message.trim()) {
			alert("お問い合わせ内容を入力してください");
			return false;
		}
		return true;
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);
		animation.startAnimation();

		try {
			// TODO: 実際のお問い合わせ送信処理を実装
			// const response = await Axios.post("/api/contact", {
			// 	name,
			// 	email,
			// 	subject,
			// 	message,
			// });

			// 仮の処理
			await new Promise(resolve => setTimeout(resolve, 1000));

			alert("お問い合わせを送信しました。ご連絡ありがとうございます。");
			
			// フォームをクリア
			setName("");
			setEmail("");
			setSubject("");
			setMessage("");
			
		} catch (error) {
			console.error("Error sending contact:", error);
			alert("送信中にエラーが発生しました。しばらく経ってから再度お試しください。");
		} finally {
			setIsSubmitting(false);
			animation.endAnimation();
		}
	};

	return (
		<>
			<div className="p-contact l-page">
				<div className="p-contact__title">お問い合わせ</div>
				<Border />
				
				<div className="p-contact__description">
					ご質問、ご意見、ご要望などございましたら、下記フォームよりお気軽にお問い合わせください。
				</div>

				<div className="p-contact__form">
					<div className="p-contact__item">
						<div className="p-contact__item-label">お名前 <span className="p-contact__required">*</span></div>
						<InputBox 
							className="p-contact__item-input" 
							value={name} 
							onChange={(e) => setName(e.target.value)}
							placeholder="山田 太郎"
						/>
					</div>

					<div className="p-contact__item">
						<div className="p-contact__item-label">メールアドレス <span className="p-contact__required">*</span></div>
						<InputBox 
							className="p-contact__item-input" 
							type="email"
							value={email} 
							onChange={(e) => setEmail(e.target.value)}
							placeholder="example@email.com"
						/>
					</div>

					<div className="p-contact__item">
						<div className="p-contact__item-label">件名 <span className="p-contact__required">*</span></div>
						<InputBox 
							className="p-contact__item-input" 
							value={subject} 
							onChange={(e) => setSubject(e.target.value)}
							placeholder="お問い合わせの件名"
						/>
					</div>

					<div className="p-contact__item">
						<div className="p-contact__item-label">お問い合わせ内容 <span className="p-contact__required">*</span></div>
						<MultilineInput 
							className="p-contact__item-input p-contact__item-textarea" 
							value={message} 
							onChange={(e) => setMessage(e.target.value)}
							placeholder="お問い合わせ内容をご記入ください"
							rows={8}
						/>
					</div>

					<div className="p-contact__button-wrapper">
						<Button
							className="p-contact__submit"
							onClick={handleSubmit}
							disabled={isSubmitting}
						>
							{isSubmitting ? "送信中..." : "送信する"}
						</Button>
					</div>
				</div>
			</div>
		</>
	);
};

export default ContactPage;
