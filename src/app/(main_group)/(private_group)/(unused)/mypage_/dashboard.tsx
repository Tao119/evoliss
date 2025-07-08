"use client";

import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import closeImage from "@/assets/image/cross.svg";
import { Button } from "@/components/button";
import { Filter } from "@/components/filter";
import { IconButton } from "@/components/iconButton";
import { InputBox } from "@/components/inputBox";
import { MultilineInput } from "@/components/multilineInput";
import { Switcher } from "@/components/switcher";
import { requestDB } from "@/services/axios";
import { AccountType, type PaymentAccount } from "@/type/models";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";

export const AccountTypeString = ["普通預金", "当座預金"];

const Dashboard = () => {
	const { userData, fetchUserData } = useContext(UserDataContext)!;
	const animation = useContext(AnimationContext)!;
	const router = useRouter();
	const [showEditAccount, setShowPaymentAccount] = useState(false);
	const [showRefund, setShowRefund] = useState<number>();
	const [refundMessage, setRefundMessage] = useState("");
	const [currentTab, setTab] = useState<number>();
	const [editingPaymentAccount, setEditingPaymentAccount] =
		useState<PaymentAccount>();
	const [paymentAccount, setPaymentAccount] = useState<PaymentAccount>();

	const onReady = userData;

	useEffect(() => {
		animation.startAnimation();
	}, []);

	useEffect(() => {
		if (onReady) {
			animation.endAnimation();
		}
	}, [onReady]);

	useEffect(() => {
		console.log(userData?.paymentAccount);
		if (userData) {
			setPaymentAccount(userData?.paymentAccount);
		}
	}, [userData]);

	if (!onReady) {
		return <></>;
	}

	const dashboardTabs: { label: string; value: number }[] = [
		{ label: "コーチ", value: 1 },
		...(userData.reservations.length > 0
			? [{ label: "受講者", value: 0 }]
			: []),
	];
	useEffect(() => {
		if (currentTab == undefined) {
			setTab(dashboardTabs[0].value);
		}
	}, [dashboardTabs]);

	const handleSubmit = async () => {
		if (
			editingPaymentAccount?.bankName === undefined ||
			editingPaymentAccount?.branchName === undefined ||
			editingPaymentAccount?.accountType === undefined ||
			editingPaymentAccount?.accountNumber === undefined ||
			editingPaymentAccount?.accountHolder === undefined
		) {
			alert("有効なデータを入力して下さい");

			return;
		}
		animation.startAnimation();
		await requestDB("user", "updatePaymentAccount", {
			...editingPaymentAccount,
			userId: userData.id,
		}).then((response) => {
			if (!response.success) {
				animation.endAnimation();
				return;
			} else {
				setEditingPaymentAccount(undefined);
				setShowPaymentAccount(false);
				fetchUserData();
				animation.endAnimation();
			}
		});
	};
	const handleRefund = async () => {
		if (refundMessage.trim() == "" || showRefund == undefined) {
			alert("有効なデータを入力して下さい");

			return;
		}
		animation.startAnimation();
		await requestDB("reservation", "createRefund", {
			reservationId: showRefund,
			customerId: userData.id,
			text: refundMessage,
		}).then((response) => {
			if (!response.success) {
				animation.endAnimation();
				return;
			} else {
				setRefundMessage("");
				setShowRefund(undefined);
				fetchUserData();
				animation.endAnimation();
			}
		});
	};

	return (
		<div className="p-coach">
			<div className="p-coach__switcher-wrapper">
				{dashboardTabs.length > 1 ? (
					<Switcher
						contents={dashboardTabs}
						onChange={(e) => setTab(e)}
						className="p-coach__switcher"
						type2
					/>
				) : (
					<div className="p-coach__switcher-text">{dashboardTabs[0].label}</div>
				)}
			</div>
			{currentTab == 0 ? (
				<>
					{userData.reservations.filter(
						(reservation) =>
							new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() >=
							new Date().getTime(),
					).length > 0 && (
						<div className="p-coach__courses-panel">
							<div className="p-coach__courses-title">受講予定講座一覧</div>
							<div className="p-coach__course-list -high">
								{userData.reservations
									.filter(
										(reservation) =>
											new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() >=
											new Date().getTime(),
									)
									.sort((a, b) =>
										new Date(a.timeSlots?.[0]?.dateTime || 0).getTime() <=
										new Date(b.timeSlots?.[0]?.dateTime || 0).getTime()
											? 1
											: -1,
									)
									.map((reservation) => (
										<div
											key={reservation.id}
											className="p-coach__course-item -high"
											onClick={() =>
												() => {}
											}
										>
											<div className="p-coach__course-title">
												タイトル: {reservation.course.title}
											</div>
											<div className="p-coach__course-title">
												開始時間:{" "}
												{dayjs(reservation.timeSlots?.[0]?.dateTime || 0).format(
													"YYYY年M月D日 hh:mm~",
												)}
											</div>
											<div className="p-coach__course-title">
												コーチ: {reservation.course.coach.name}
											</div>
											<Button
												className="p-coach__course-button"
												onClick={(e) => {
													e.stopPropagation();
													setShowRefund(reservation.id);
												}}
											>
												キャンセル申請
											</Button>
										</div>
									))}
							</div>
						</div>
					)}
					{userData.reservations.filter(
						(reservation) =>
							new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() <
							new Date().getTime(),
					).length > 0 && (
						<div className="p-coach__courses-panel">
							<div className="p-coach__courses-title">受講済み講座一覧</div>
							<div className="p-coach__course-list -high">
								{userData.reservations
									.filter(
										(reservation) =>
											new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() <
											new Date().getTime(),
									)
									.sort((a, b) =>
										new Date(a.timeSlots?.[0]?.dateTime || 0).getTime() <=
										new Date(b.timeSlots?.[0]?.dateTime || 0).getTime()
											? 1
											: -1,
									)
									.map((reservation) => (
										<div
											key={reservation.id}
											className="p-coach__course-item -high"
											onClick={() =>
												() => {}
											}
										>
											<div className="p-coach__course-title">
												タイトル: {reservation.course.title}
											</div>
											<div className="p-coach__course-title">
												開始時間:{" "}
												{dayjs(reservation.timeSlots?.[0]?.dateTime || 0).format(
													"YYYY年M月D日 hh:mm~",
												)}
											</div>
											<div className="p-coach__course-title">
												コーチ: {reservation.course.coach.name}
											</div>
											<Button
												className="p-coach__course-button"
												onClick={(e) => {
													e.stopPropagation();
													setShowRefund(reservation.id);
												}}
											>
												返金申請
											</Button>
										</div>
									))}
							</div>
						</div>
					)}
				</>
			) : currentTab == 1 ? (
				<>
					{paymentAccount ? (
						<div className="p-coach__payment-account">
							<div className="p-coach__payment-account-title">出金口座</div>
							<div className="p-coach__payment-account-info">
								{paymentAccount.bankName}/ {paymentAccount.branchName}/{" "}
								{AccountTypeString[paymentAccount.accountType]}/{" "}
								{paymentAccount.accountNumber}/ {paymentAccount.accountHolder}
							</div>
							<Button
								className="p-coach__payment-account-button"
								onClick={() => {
									setShowPaymentAccount(true);
									setEditingPaymentAccount(paymentAccount);
								}}
							>
								編集
							</Button>
						</div>
					) : (
						<div className="p-coach__payment-account">
							<Button
								className="p-coach__payment-account-button"
								onClick={() => setShowPaymentAccount(true)}
							>
								口座情報を登録する
							</Button>
						</div>
					)}
					<div className="p-coach__course-sub-title">
						売上残高:
						{Math.floor(
							userData.courses
								.flatMap((course) =>
									course.reservations.map((reservation) => course.price),
								)
								.reduce((sum, price) => sum + price, 0) * 0.9,
						) -
							userData.userPayment.reduce(
								(sum, payment) => sum + payment.amount,
								0,
							)}
						円
					</div>
					<div className="p-coach__course-pay-text">
						{(() => {
							const now = new Date();

							const thisMonth20End = new Date(
								now.getFullYear(),
								now.getMonth(),
								20,
								23,
								59,
								59,
							);
							const isAfter20th = now > thisMonth20End;

							const start = new Date(
								now.getFullYear(),
								now.getMonth() - 1,
								21,
								0,
								0,
								0,
							);
							const end = thisMonth20End;

							const paymentDate = new Date(
								now.getFullYear(),
								now.getMonth() + 1,
								0,
							);

							const amount = Math.floor(
								userData.courses
									.flatMap((course) =>
										course.reservations
											.filter((reservation) => {
												const heldAt = new Date(reservation.timeSlots?.[0]?.dateTime || 0);
												return heldAt >= start && heldAt <= end;
											})
											.map(() => course.price),
									)
									.reduce((sum, price) => sum + price, 0) * 0.9,
							);

							return `（${paymentDate.getFullYear()}/${
								paymentDate.getMonth() + 1
							}/${paymentDate.getDate()} 入金${
								isAfter20th ? "確定" : "予定"
							}: ${amount.toLocaleString("ja-JP")}円）`;
						})()}
					</div>
					<div className="p-coach__course-pay-text">
						{(() => {
							const now = new Date();

							const start = new Date(
								now.getFullYear(),
								now.getMonth(),
								21,
								0,
								0,
								0,
							);
							const end = now;

							const paymentDate = new Date(
								now.getFullYear(),
								now.getMonth() + 2,
								0,
							);

							const amount = Math.floor(
								userData.courses
									.flatMap((course) =>
										course.reservations
											.filter((reservation) => {
												const heldAt = new Date(reservation.timeSlots?.[0]?.dateTime || 0);
												return heldAt >= start && heldAt <= end;
											})
											.map(() => course.price),
									)
									.reduce((sum, price) => sum + price, 0) * 0.9,
							);

							return `（${paymentDate.getFullYear()}/${
								paymentDate.getMonth() + 1
							}/${paymentDate.getDate()} 入金予定: ${amount.toLocaleString(
								"ja-JP",
							)}円）`;
						})()}
					</div>
					{userData.courses.flatMap((course) =>
						course.reservations.filter(
							(reservation) =>
								new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() >
								new Date().getTime(),
						),
					).length > 0 && (
						<div className="p-coach__courses-panel">
							<div className="p-coach__courses-title">開催予定講座一覧</div>
							<div className="p-coach__course-list">
								{userData.courses.flatMap((course) =>
									course.reservations
										.filter(
											(reservation) =>
												new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() >
												new Date().getTime(),
										)
										.sort((a, b) =>
											new Date(a.timeSlots?.[0]?.dateTime || 0).getTime() >=
											new Date(b.timeSlots?.[0]?.dateTime || 0).getTime()
												? 1
												: -1,
										)
										.map((reservation) => (
											<div
												key={reservation.id}
												className="p-coach__course-item"
												onClick={() =>
													() => {}
												}
											>
												<div className="p-coach__course-title">
													タイトル: {course.title}
												</div>
												<div className="p-coach__course-title">
													開始時間:{" "}
													{dayjs(reservation.timeSlots?.[0]?.dateTime || 0).format(
														"YYYY年M月D日 hh:mm~",
													)}
												</div>
												<div className="p-coach__course-title">
													予約者名: {reservation.customer.name}
												</div>
											</div>
										)),
								)}
							</div>
						</div>
					)}{" "}
					{userData.courses.flatMap((course) =>
						course.reservations.filter(
							(reservation) =>
								new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() <=
								new Date().getTime(),
						),
					).length > 0 && (
						<div className="p-coach__courses-panel">
							<div className="p-coach__courses-title">開催済み講座一覧</div>
							<div className="p-coach__course-list">
								{userData.courses.flatMap((course) =>
									course.reservations
										.filter(
											(reservation) =>
												new Date(reservation.timeSlots?.[0]?.dateTime || 0).getTime() <=
												new Date().getTime(),
										)
										.sort((a, b) =>
											new Date(a.timeSlots?.[0]?.dateTime || 0).getTime() <=
											new Date(b.timeSlots?.[0]?.dateTime || 0).getTime()
												? 1
												: -1,
										)
										.map((reservation) => (
											<div
												key={reservation.id}
												className="p-coach__course-item"
												onClick={() =>
													() => {}
												}
											>
												<div className="p-coach__course-title">
													タイトル: {course.title}
												</div>
												<div className="p-coach__course-title">
													開始時間:{" "}
													{dayjs(reservation.timeSlots?.[0]?.dateTime || 0).format(
														"YYYY年M月D日 hh:mm~",
													)}
												</div>
												<div className="p-coach__course-title">
													予約者名: {reservation.customer.name}
												</div>
											</div>
										)),
								)}
							</div>
						</div>
					)}
				</>
			) : null}
			{showEditAccount && (
				<div className="p-coach__edit-payment-account">
					<IconButton
						src={closeImage}
						onClick={() => {
							setShowPaymentAccount(false);
							setEditingPaymentAccount(paymentAccount);
						}}
						className="p-coach__edit-payment-account-close"
					/>
					<div className="p-coach__edit-payment-account-section">
						<div className="p-coach__edit-payment-account-label">銀行名</div>
						<InputBox
							className="p-coach__edit-payment-account-input"
							value={editingPaymentAccount?.bankName}
							onChange={(e) => {
								setEditingPaymentAccount((prev) => ({
									...prev!,
									bankName: e.target.value as string,
								}));
							}}
						/>
					</div>
					<div className="p-coach__edit-payment-account-section">
						<div className="p-coach__edit-payment-account-label">支店名</div>
						<InputBox
							className="p-coach__edit-payment-account-input"
							value={editingPaymentAccount?.branchName}
							onChange={(e) => {
								setEditingPaymentAccount((prev) => ({
									...prev!,
									branchName: e.target.value as string,
								}));
							}}
						/>
					</div>
					<div className="p-coach__edit-payment-account-section">
						<div className="p-coach__edit-payment-account-label">口座種別</div>

						<Filter
							includeDefault
							label="預金種別を選択"
							className="p-coach__edit-payment-account-input"
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
					<div className="p-coach__edit-payment-account-section">
						<div className="p-coach__edit-payment-account-label">口座番号</div>
						<InputBox
							className="p-coach__edit-payment-account-input"
							value={editingPaymentAccount?.accountNumber}
							type="nuimber"
							onChange={(e) => {
								setEditingPaymentAccount((prev) => ({
									...prev!,
									accountNumber: e.target.value as string,
								}));
							}}
						/>
					</div>
					<div className="p-coach__edit-payment-account-section">
						<div className="p-coach__edit-payment-account-label">口座名義</div>
						<InputBox
							className="p-coach__edit-payment-account-input"
							value={editingPaymentAccount?.accountHolder}
							onChange={(e) => {
								setEditingPaymentAccount((prev) => ({
									...prev!,
									accountHolder: e.target.value as string,
								}));
							}}
						/>
					</div>
					<Button
						className="p-coach__edit-payment-account-submit"
						onClick={handleSubmit}
					>
						保存
					</Button>
				</div>
			)}
			{(() => {
				if (!showRefund) return;
				const data = userData.reservations.find((r) => r.id == showRefund);
				if (!data) return;
				return (
					<div className="p-coach__edit-payment-account">
						<IconButton
							src={closeImage}
							onClick={() => {
								setShowRefund(undefined);
								setRefundMessage("");
							}}
							className="p-coach__edit-payment-account-close"
						/>
						<div>キャンセルする講座</div>
						<div>コース名:{data.course.title}</div>
						<div>コーチ:{data.course.coach.name}</div>
						<div>
							開始時間:{" "}
							{dayjs(data.timeSlots?.[0]?.dateTime || 0).format("YYYY年M月D日 hh:mm~")}
						</div>
						<MultilineInput
							value={refundMessage}
							onChange={(v) => setRefundMessage(v.target.value)}
						/>
						<Button
							className="p-coach__edit-payment-account-submit"
							onClick={handleRefund}
						>
							送信
						</Button>
					</div>
				);
			})()}
		</div>
	);
};

export default Dashboard;
