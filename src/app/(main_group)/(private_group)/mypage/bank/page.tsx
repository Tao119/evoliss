"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import Border from "@/components/border";
import { Button } from "@/components/button";
// import { InputBox } from "@/components/inputBox";
import { requestDB } from "@/services/axios";
import { AccountType, type PaymentAccount } from "@/type/models";
import { useContext, useEffect, useState } from "react";

// const AccountTypeString = ["普通", "当座"];

const BankPage = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const [editingPaymentAccount, setEditingPaymentAccount] = useState<Partial<PaymentAccount>>({
		bankName: "",
		branchName: "",
		accountType: AccountType.Saving,
		accountNumber: "",
		accountHolder: "",
	});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		animation.startAnimation();
		if (userData?.paymentAccount) {
			setEditingPaymentAccount(userData.paymentAccount);
		}
		setIsLoading(false);
		animation.endAnimation();
	}, [userData]);

	if (!userData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">入金用口座登録</div>
				<Border />
				<div className="p-mypage__loading">Loading...</div>
			</>
		);
	}

	const handleSubmit = async () => {
		if (
			!editingPaymentAccount?.bankName ||
			!editingPaymentAccount?.branchName ||
			editingPaymentAccount?.accountType === undefined ||
			!editingPaymentAccount?.accountNumber ||
			!editingPaymentAccount?.accountHolder
		) {
			alert("全ての項目を入力してください");
			return;
		}

		animation.startAnimation();
		await requestDB("user", "updatePaymentAccount", {
			...editingPaymentAccount,
			userId: userData.id,
		}).then((response) => {
			if (!response.success) {
				alert("エラーが発生しました");
			} else {
				alert("口座情報を更新しました");
				fetchUserData(true);
			}
			animation.endAnimation();
		});
	};

	return (
		<>
			<div className="p-mypage__title">入金用口座登録</div>
			<Border />

			<div className="p-bank">
				<div className="p-bank__form">
					<div className="p-bank__input-group">
						<label className="p-bank__label">
							金融機関名（銀行・信用金庫）
						</label>

						<div className="p-bank__input-outline">
							<input
								type="text"
								className="p-bank__input"
								value={editingPaymentAccount?.bankName || ""}
								onChange={(e) => {
									setEditingPaymentAccount((prev) => ({
										...prev,
										bankName: e.target.value,
									}));
								}}
							/></div>
					</div>

					<div className="p-bank__input-group">
						<label className="p-bank__label">支店名</label>

						<div className="p-bank__input-outline">
							<input
								type="text"
								className="p-bank__input"
								value={editingPaymentAccount?.branchName || ""}
								onChange={(e) => {
									setEditingPaymentAccount((prev) => ({
										...prev,
										branchName: e.target.value,
									}));
								}}
							/>
						</div>
					</div>

					<div className="p-bank__input-group">
						<label className="p-bank__label">口座番号</label>
						<div className="p-bank__input-outline">
							<input
								type="text"
								className="p-bank__input"
								value={editingPaymentAccount?.accountNumber || ""}
								onChange={(e) => {
									setEditingPaymentAccount((prev) => ({
										...prev,
										accountNumber: e.target.value,
									}));
								}}
							/></div>
					</div>

					<div className="p-bank__input-row">
						<div className="p-bank__input-group -half">
							<label className="p-bank__label">姓（カタカナ）</label>

							<div className="p-bank__input-outline"><input
								type="text"
								className="p-bank__input"
								value={editingPaymentAccount?.accountHolder?.split(" ")[0] || ""}
								onChange={(e) => {
									const lastName = e.target.value;
									const firstName = editingPaymentAccount?.accountHolder?.split(" ")[1] || "";
									setEditingPaymentAccount((prev) => ({
										...prev,
										accountHolder: lastName + (firstName ? " " + firstName : ""),
									}));
								}}
							/>
							</div>
						</div>
						<div className="p-bank__input-group -half">
							<label className="p-bank__label">名（カタカナ）</label>

							<div className="p-bank__input-outline"><input
								type="text"
								className="p-bank__input"
								value={editingPaymentAccount?.accountHolder?.split(" ")[1] || ""}
								onChange={(e) => {
									const firstName = e.target.value;
									const lastName = editingPaymentAccount?.accountHolder?.split(" ")[0] || "";
									setEditingPaymentAccount((prev) => ({
										...prev,
										accountHolder: (lastName ? lastName + " " : "") + firstName,
									}));
								}}
							/>
							</div>
						</div>
					</div>

					<div className="p-bank__button-container">
						<Button
							className="p-bank__button"
							onClick={handleSubmit}
						>
							登録する
						</Button>
					</div>
				</div>

				<div className="p-bank__footer">
					<div className="p-bank__footer-item">
						<a href="#">TOP</a>
						<span className="p-bank__separator">｜</span>
						<a href="#">コーチから選ぶ</a>
						<span className="p-bank__separator">｜</span>
						<a href="#">講座を検索する</a>
						<span className="p-bank__separator">｜</span>
					</div>
					<div className="p-bank__footer-item">
						<a href="#">ログイン</a>
						<span className="p-bank__separator">｜</span>
						<a href="#">新規会員登録</a>
					</div>
					<div className="p-bank__footer-item">
						<a href="#">利用規約</a>
						<span className="p-bank__separator">｜</span>
						<a href="#">プライバシーポリシー</a>
					</div>
					<div className="p-bank__copyright">
						© はるmチャンネル managed by EVOLISS
					</div>
				</div>
			</div>
		</>
	);
};

export default BankPage;