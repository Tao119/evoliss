"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { Filter } from "@/components/filter";
import { InputBox } from "@/components/inputBox";
import { requestDB } from "@/services/axios";
import { AccountType, type PaymentAccount } from "@/type/models";
import { useContext, useEffect, useState } from "react";

const AccountTypeString = ["普通", "当座"];

const BankPage = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const [editingPaymentAccount, setEditingPaymentAccount] = useState<PaymentAccount>();
	const [isEditing, setIsEditing] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		animation.startAnimation();
		if (userData?.paymentAccount) {
			setEditingPaymentAccount(userData.paymentAccount);
		}
	}, [userData]);

	useEffect(() => {
		if (userData) {
			setIsLoading(false);
			animation.endAnimation();
		}
	}, [userData]);

	if (!userData || isLoading) {
		return (
			<>
				<div className="p-mypage__title">振込先設定</div>
				<Border />
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
			alert("Please fill all fields");
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
				setIsEditing(false);
				fetchUserData();
			}
			animation.endAnimation();
		});
	};

	return (
		<>
			<div className="p-mypage__title">振込先設定</div>
			<Border />
			
			{userData.paymentAccount && !isEditing ? (
				<div className="p-mypage__section">
					<div className="p-mypage__subtitle">登録済み口座</div>
					<div className="p-mypage__info">
						<div>銀行名: {userData.paymentAccount.bankName}</div>
						<div>支店名: {userData.paymentAccount.branchName}</div>
						<div>口座種別: {AccountTypeString[userData.paymentAccount.accountType]}</div>
						<div>口座番号: {userData.paymentAccount.accountNumber}</div>
						<div>口座名義: {userData.paymentAccount.accountHolder}</div>
					</div>
					<Button 
						className="p-mypage__button"
						onClick={() => setIsEditing(true)}
					>
						編集
					</Button>
				</div>
			) : (
				<div className="p-mypage__section">
					<div className="p-mypage__subtitle">
						{userData.paymentAccount ? "口座情報の編集" : "口座情報の登録"}
					</div>
					
					<div className="p-mypage__input-group">
						<label>銀行名</label>
						<InputBox
							value={editingPaymentAccount?.bankName || ""}
							onChange={(e) => {
								setEditingPaymentAccount((prev) => ({
									...prev!,
									bankName: e.target.value,
								}));
							}}
						/>
					</div>

					<div className="p-mypage__input-group">
						<label>支店名</label>
						<InputBox
							value={editingPaymentAccount?.branchName || ""}
							onChange={(e) => {
								setEditingPaymentAccount((prev) => ({
									...prev!,
									branchName: e.target.value,
								}));
							}}
						/>
					</div>

					<div className="p-mypage__input-group">
						<label>口座種別</label>
						<Filter
							includeDefault
							label="口座種別を選択"
							selectedValue={editingPaymentAccount?.accountType}
							options={Object.values(AccountType)
								.filter((value) => typeof value === "number")
								.map((a) => ({
									label: AccountTypeString[a],
									value: a,
								}))}
							onChange={(value: any) => {
								setEditingPaymentAccount((prev) => ({
									...prev!,
									accountType: Number.parseInt(value),
								}));
							}}
						/>
					</div>

					<div className="p-mypage__input-group">
						<label>口座番号</label>
						<InputBox
							value={editingPaymentAccount?.accountNumber || ""}
							type="text"
							onChange={(e) => {
								setEditingPaymentAccount((prev) => ({
									...prev!,
									accountNumber: e.target.value,
								}));
							}}
						/>
					</div>

					<div className="p-mypage__input-group">
						<label>口座名義</label>
						<InputBox
							value={editingPaymentAccount?.accountHolder || ""}
							onChange={(e) => {
								setEditingPaymentAccount((prev) => ({
									...prev!,
									accountHolder: e.target.value,
								}));
							}}
						/>
					</div>

					<div className="p-mypage__button-group">
						<Button 
							className="p-mypage__button"
							onClick={handleSubmit}
						>
							保存
						</Button>
						{isEditing && (
							<Button 
								className="p-mypage__button -secondary"
								onClick={() => {
									setIsEditing(false);
									setEditingPaymentAccount(userData.paymentAccount);
								}}
							>
								キャンセル
							</Button>
						)}
					</div>
				</div>
			)}
		</>
	);
};

export default BankPage;