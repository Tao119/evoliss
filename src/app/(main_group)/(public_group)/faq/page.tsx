"use client";

import Border from "@/components/border";
import { useState } from "react";
import { ImageBox } from "@/components/imageBox";
import arrowIcon from "@/assets/image/arrow.svg";

const FaqPage = () => {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	const faqData = [
		{
			category: "ご利用について",
			items: [
				{
					question: "Evolissとはどのようなサービスですか？",
					answer: "Evolissは、ゲームのコーチングを受けたい方と、コーチングを提供したい方をマッチングするプラットフォームです。様々なゲームタイトルで、プロから趣味レベルまで幅広いコーチングを受けることができます。"
				},
				{
					question: "利用するには会員登録が必要ですか？",
					answer: "はい、講座の予約やコーチとしての活動には会員登録が必要です。ただし、講座の検索や詳細の確認は会員登録なしでもご利用いただけます。"
				},
				{
					question: "利用料金はかかりますか？",
					answer: "会員登録は無料です。講座を受講する際は、各講座に設定された料金をお支払いいただきます。コーチとして活動する場合は、売上の一部を手数料としていただいております。"
				}
			]
		},
		{
			category: "講座について",
			items: [
				{
					question: "どのようなゲームのコーチングが受けられますか？",
					answer: "FPS、MOBA、格闘ゲーム、カードゲームなど、様々なジャンルのゲームに対応しています。具体的なタイトルは、講座検索ページでご確認いただけます。"
				},
				{
					question: "講座の時間はどのくらいですか？",
					answer: "講座の時間は30分単位で設定されており、コーチによって異なります。詳細は各講座ページでご確認ください。"
				},
				{
					question: "講座のキャンセルはできますか？",
					answer: "講座開始24時間前までは無料でキャンセル可能です。それ以降のキャンセルは、キャンセル料が発生する場合があります。"
				}
			]
		},
		{
			category: "支払いについて",
			items: [
				{
					question: "どのような支払い方法が利用できますか？",
					answer: "クレジットカード（Visa、Mastercard、American Express、JCB）でのお支払いに対応しています。"
				},
				{
					question: "領収書は発行されますか？",
					answer: "はい、講座の購入後、マイページから領収書をダウンロードすることができます。"
				},
				{
					question: "返金は可能ですか？",
					answer: "講座開始前のキャンセルの場合は、規定に従って返金いたします。講座開始後の返金については、個別にお問い合わせください。"
				}
			]
		},
		{
			category: "コーチについて",
			items: [
				{
					question: "コーチになるにはどうすればよいですか？",
					answer: "会員登録後、マイページからコーチ登録を行ってください。審査を経て、コーチとして活動を開始できます。"
				},
				{
					question: "コーチの報酬はどのように支払われますか？",
					answer: "講座完了後、手数料を差し引いた金額が、登録された銀行口座に振り込まれます。振込は月末締め、翌月末払いとなります。"
				},
				{
					question: "コーチの審査基準は何ですか？",
					answer: "ゲームの実績、指導経験、プロフィールの充実度などを総合的に判断しています。詳細な審査基準については公開しておりません。"
				}
			]
		}
	];

	const toggleAccordion = (index: number) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	return (
		<>
			<div className="p-faq l-page">
				<div className="p-faq__title">よくある質問</div>
				<Border />

				{faqData.map((category, categoryIndex) => (
					<div key={categoryIndex} className="p-faq__category">
						<div className="p-faq__category-title">{category.category}</div>
						
						{category.items.map((item, itemIndex) => {
							const globalIndex = categoryIndex * 100 + itemIndex;
							const isOpen = openIndex === globalIndex;
							
							return (
								<div key={itemIndex} className="p-faq__item">
									<div 
										className={`p-faq__question ${isOpen ? "-open" : ""}`}
										onClick={() => toggleAccordion(globalIndex)}
									>
										<span className="p-faq__question-text">{item.question}</span>
										<ImageBox 
											src={arrowIcon} 
											className={`p-faq__arrow ${isOpen ? "-open" : ""}`}
										/>
									</div>
									{isOpen && (
										<div className="p-faq__answer">
											{item.answer}
										</div>
									)}
								</div>
							);
						})}
					</div>
				))}

				<div className="p-faq__contact">
					<div className="p-faq__contact-text">
						お探しの質問が見つからない場合は、お問い合わせフォームよりご連絡ください。
					</div>
					<a href="/contact" className="p-faq__contact-link">
						お問い合わせはこちら →
					</a>
				</div>
			</div>
		</>
	);
};

export default FaqPage;
