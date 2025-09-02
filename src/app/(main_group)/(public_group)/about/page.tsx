"use client";

import Border from "@/components/border";
import { ImageBox } from "@/components/imageBox";
import logoImage from "@/assets/logo/png/Evoliss-Logo_Type-4-white_L.png";

const AboutPage = () => {
	return (
		<>
			<div className="p-about l-page">
				<div className="p-about__title">Evolissについて</div>
				<Border />

				<div className="p-about__hero">
					<ImageBox
						src={logoImage}
						className="p-about__logo"
						alt="Evoliss"
					/>
					<div className="p-about__tagline">
						ゲームスキル向上のための、最高のコーチングプラットフォーム
					</div>
				</div>

				<div className="p-about__section">
					<div className="p-about__section-title">私たちのミッション</div>
					<div className="p-about__section-content">
						Evolissは、すべてのゲーマーが自分のスキルを向上させ、より楽しくゲームをプレイできる環境を提供することを目指しています。
						初心者からプロフェッショナルまで、あらゆるレベルのプレイヤーが最適なコーチを見つけ、効率的にスキルアップできるプラットフォームです。
					</div>
				</div>

				<div className="p-about__section">
					<div className="p-about__section-title">サービスの特徴</div>
					<div className="p-about__features">
						<div className="p-about__feature">
							<div className="p-about__feature-title">豊富なコーチ陣</div>
							<div className="p-about__feature-description">
								プロゲーマーから経験豊富なコーチまで、様々な専門性を持つコーチが在籍しています。
							</div>
						</div>
						<div className="p-about__feature">
							<div className="p-about__feature-title">柔軟なスケジュール</div>
							<div className="p-about__feature-description">
								30分単位で予約可能。あなたのペースに合わせて学習を進めることができます。
							</div>
						</div>
						<div className="p-about__feature">
							<div className="p-about__feature-title">安心の決済システム</div>
							<div className="p-about__feature-description">
								セキュアな決済システムで、安心してサービスをご利用いただけます。
							</div>
						</div>
						<div className="p-about__feature">
							<div className="p-about__feature-title">充実したサポート</div>
							<div className="p-about__feature-description">
								メッセージ機能で講師と直接やり取り。きめ細かいフォローアップが可能です。
							</div>
						</div>
					</div>
				</div>

				<div className="p-about__section">
					<div className="p-about__section-title">ご利用の流れ</div>
					<div className="p-about__steps">
						<div className="p-about__step">
							<div className="p-about__step-number">1</div>
							<div className="p-about__step-title">会員登録</div>
							<div className="p-about__step-description">
								無料で簡単に会員登録ができます
							</div>
						</div>
						<div className="p-about__step">
							<div className="p-about__step-number">2</div>
							<div className="p-about__step-title">コーチを探す</div>
							<div className="p-about__step-description">
								ゲームやスキルレベルに合わせて検索
							</div>
						</div>
						<div className="p-about__step">
							<div className="p-about__step-number">3</div>
							<div className="p-about__step-title">予約する</div>
							<div className="p-about__step-description">
								都合の良い時間を選んで予約
							</div>
						</div>
						<div className="p-about__step">
							<div className="p-about__step-number">4</div>
							<div className="p-about__step-title">受講する</div>
							<div className="p-about__step-description">
								オンラインでコーチングを受講
							</div>
						</div>
					</div>
				</div>

				<div className="p-about__section">
					<div className="p-about__section-title">運営会社</div>
					<div className="p-about__company">
						<table className="p-about__company-table">
							<tbody>
								<tr>
									<th>会社名</th>
									<td>株式会社Evoliss</td>
								</tr>
								<tr>
									<th>設立</th>
									<td>2024年1月</td>
								</tr>
								<tr>
									<th>所在地</th>
									<td>東京都渋谷区</td>
								</tr>
								<tr>
									<th>事業内容</th>
									<td>ゲームコーチングプラットフォームの運営</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<div className="p-about__cta">
					<div className="p-about__cta-text">
						さあ、あなたもEvolissで新しいゲーム体験を始めましょう
					</div>
					<a href="/sign-up" className="p-about__cta-button">
						無料で始める
					</a>
				</div>
			</div>
		</>
	);
};

export default AboutPage;
