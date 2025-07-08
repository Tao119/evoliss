"use client";

import Border from "@/components/border";

const LegalPage = () => {
	return (
		<>
			<div className="p-legal l-page">
				<div className="p-legal__title">特定商取引法に基づく表記</div>
				<Border />

				<div className="p-legal__content">
					<div className="p-legal__section">
						<table className="p-legal__table">
							<tbody>
								<tr>
									<th>販売業者</th>
									<td>株式会社Evoliss</td>
								</tr>
								<tr>
									<th>代表責任者</th>
									<td>代表取締役 山田太郎</td>
								</tr>
								<tr>
									<th>所在地</th>
									<td>〒150-0001 東京都渋谷区神宮前1-2-3 ABCビル4F</td>
								</tr>
								<tr>
									<th>電話番号</th>
									<td>03-1234-5678</td>
								</tr>
								<tr>
									<th>メールアドレス</th>
									<td>info@evoliss.com</td>
								</tr>
								<tr>
									<th>サービスの販売価格</th>
									<td>各講座ページに記載</td>
								</tr>
								<tr>
									<th>販売価格以外の必要料金</th>
									<td>なし</td>
								</tr>
								<tr>
									<th>支払方法</th>
									<td>クレジットカード決済（Visa、Mastercard、American Express、JCB）</td>
								</tr>
								<tr>
									<th>支払時期</th>
									<td>講座予約時に決済</td>
								</tr>
								<tr>
									<th>サービスの提供時期</th>
									<td>予約した日時に提供</td>
								</tr>
								<tr>
									<th>返品・キャンセルについて</th>
									<td>
										<div>講座開始24時間前まで：全額返金</div>
										<div>講座開始24時間前〜1時間前：50%返金</div>
										<div>講座開始1時間前以降：返金不可</div>
										<div>※詳細は利用規約をご確認ください</div>
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div className="p-legal__section">
						<div className="p-legal__section-title">注意事項</div>
						<ul className="p-legal__list">
							<li>本サービスはオンラインでのコーチングサービスです。</li>
							<li>講座の品質には万全を期しておりますが、効果には個人差があります。</li>
							<li>コーチとのトラブルについては、当社が仲介・解決のサポートをいたします。</li>
							<li>その他の詳細については、利用規約をご確認ください。</li>
						</ul>
					</div>
				</div>
			</div>
		</>
	);
};

export default LegalPage;
