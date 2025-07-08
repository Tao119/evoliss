"use client";
import { AnimationContext, UserDataContext } from "@/app/contextProvider";
import closeImage from "@/assets/image/cross.svg";
import defaultIcon from "@/assets/image/user_icon.svg";
import { Button } from "@/components/button";
import { Filter } from "@/components/filter";
import { IconButton } from "@/components/iconButton";
import { ImageBox } from "@/components/imageBox";
import { InputBox } from "@/components/inputBox";
import { OverLay } from "@/components/overlay";
import { Switcher } from "@/components/switcher";
import UserIcon from "@/components/userIcon";
import { requestDB } from "@/services/axios";
import { RefundStatus, type User } from "@/type/models";
import dayjs from "dayjs";
import { useParams, usePathname } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
const AccountTypeString = ["普通預金", "当座預金"];

const StatusText: { [status: number]: string } = {
	0: "未確認",
	1: "承認済み",
	2: "却下済み",
};

const Page = () => {
	const path = usePathname();
	const [showDetail, setShowDetail] = useState<number>();
	const [showRefund, setShowRefund] = useState<number>();
	const [amount, setAmount] = useState(0);
	const [users, setUsers] = useState<User[]>([]);
	const [currentTab, setTab] = useState<number>(0);
	const [payFilter, setPayFilter] = useState(true);
	const [refundFilter, setRefundFilter] = useState(true);
	const animation = useContext(AnimationContext)!;

	const adminTabs: { label: string; value: number }[] = [
		{ label: "ユーザー一覧", value: 0 },
		{ label: "キャンセル申請", value: 1 },
	];

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		animation.startAnimation();
		requestDB("user", "readUsers").then((response) => {
			if (response.success) {
				setUsers(response.data);
			}
			animation.endAnimation();
		});
	};

	const handleSubmit = async () => {
		if (amount == 0 || !showDetail) {
			return;
		}
		const data = users.find((m) => m.id == showDetail);
		if (!data) return;
		if (
			Math.floor(
				data.courses
					.flatMap((course) =>
						course.reservations.map((reservation) => course.price),
					)
					.reduce((sum, price) => sum + price, 0) * 0.9,
			) -
				data.userPayment.reduce((sum, payment) => sum + payment.amount, 0) -
				amount <
			0
		) {
			alert("入金金額が上限を超えています");
			return;
		}
		if (
			!confirm("入金済みであることを確認して下さい。本当に入金済みですか？")
		) {
			return;
		}
		animation.startAnimation();
		await requestDB("user", "savePayment", { userId: showDetail, amount }).then(
			(response) => {
				if (!response.success) {
					alert(response.error ?? "失敗しました");
				}
			},
		);
		setAmount(0);
		await fetchData();
		animation.endAnimation();
	};

	const handleAccept = async () => {
		if (!showRefund) return;
		if (!confirm("本当に申請を承認しますか？")) return;
		animation.startAnimation();
		await requestDB("reservation", "updateRefund", {
			refundId: showRefund,
			accept: true,
		}).then((response) => {
			if (!response.success) {
				alert(response.error ?? "失敗しました");
			}
		});

		animation.endAnimation();
		await fetchData();
		setShowRefund(undefined);
	};

	const handleDeny = async () => {
		if (!showRefund) return;
		if (!confirm("本当に申請を却下しますか？")) return;
		animation.startAnimation();
		await requestDB("reservation", "updateRefund", {
			refundId: showRefund,
			accept: false,
		}).then((response) => {
			if (!response.success) {
				alert(response.error ?? "失敗しました");
			}
		});

		animation.endAnimation();
		await fetchData();
		setShowRefund(undefined);
	};

	return (
		<div className="p-admin">
			<div className="p-admin__title">管理者ページ</div>
			<Switcher
				contents={adminTabs}
				onChange={(e) => setTab(e)}
				className="p-coach__switcher"
				type2
			/>
			{currentTab == 0 ? (
				<>
					<div className="c-checkbox-list__item">
						<label className="c-checkbox-list__label">
							<input
								type="checkbox"
								className="c-checkbox-list__checkbox"
								checked={payFilter}
								onChange={() => setPayFilter((prev) => !prev)}
							/>
							今月末支払いのあるユーザーで絞り込み
						</label>
					</div>
					{users
						.filter((m) => {
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

							const amount = Math.floor(
								m.courses
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
							return amount > 0 || !payFilter;
						})
						.map((m, i) => (
							<div className="p-admin__user-profile" key={i}>
								<UserIcon className="p-admin__user-icon" src={m.icon} />
								<div className="p-admin__user-info">
									<div className="p-admin__user-name">{m.name}</div>
									<div className="p-admin__user-email">{m.email}</div>
								</div>
								<div className="p-admin__user-amount">
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

										const amount = Math.floor(
											m.courses
												.flatMap((course) =>
													course.reservations
														.filter((reservation) => {
															const heldAt = new Date(
																reservation.timeSlots?.[0]?.dateTime || 0,
															);
															return heldAt >= start && heldAt <= end;
														})
														.map(() => course.price),
												)
												.reduce((sum, price) => sum + price, 0) * 0.9,
										);

										return ` ${amount.toLocaleString("ja-JP")}円`;
									})()}
								</div>
								<div
									className="p-admin__user-detail"
									onClick={() => {
										setShowDetail(m.id);
										setAmount(0);
									}}
								>
									詳細
								</div>
							</div>
						))}
					{(() => {
						if (showDetail) {
							const data = users.find((m) => m.id == showDetail);
							if (!data) return;
							return (
								<>
									<OverLay
										onClick={() => setShowDetail(undefined)}
										className="p-admin__overlay"
									/>
									<div className="p-admin__detail">
										<IconButton
											className="p-admin__detail-close"
											src={closeImage}
											onClick={() => setShowDetail(undefined)}
										/>
										<UserIcon
											className="p-admin__detail-icon"
											src={data.icon}
										/>
										<div className="p-admin__detail-section">
											<div className="p-admin__detail-real-name">
												{data.name}
											</div>
										</div>

										<div className="p-admin__detail-section">
											<div className="p-admin__detail-email">{data.email}</div>
										</div>
										<div className="p-admin__detail-section">
											{data.paymentAccount ? (
												<div className="p-admin__detail-payment-account">
													{data.paymentAccount.bankName}/{" "}
													{data.paymentAccount.branchName}/{" "}
													{AccountTypeString[data.paymentAccount.accountType]}/{" "}
													{data.paymentAccount.accountNumber}/{" "}
													{data.paymentAccount.accountHolder}
												</div>
											) : (
												<div className="p-admin__detail-payment-account">
													口座情報が登録されていません
												</div>
											)}
										</div>
										<div className="p-admin__detail-section">
											累計売上金額:
											{data.courses
												.flatMap((course) =>
													course.reservations.map(
														(reservation) => course.price,
													),
												)
												.reduce((sum, price) => sum + price, 0)}
											円(
											{Math.floor(
												data.courses
													.flatMap((course) =>
														course.reservations.map(
															(reservation) => course.price,
														),
													)
													.reduce((sum, price) => sum + price, 0) * 0.9,
											)}
											円)
										</div>
										<div className="p-admin__detail-section">
											入金済み金額:
											{data.userPayment.reduce(
												(sum, payment) => sum + payment.amount,
												0,
											)}
											円
										</div>
										<div className="p-admin__detail-section">
											残高:
											{Math.floor(
												data.courses
													.flatMap((course) =>
														course.reservations.map(
															(reservation) => course.price,
														),
													)
													.reduce((sum, price) => sum + price, 0) * 0.9,
											) -
												data.userPayment.reduce(
													(sum, payment) => sum + payment.amount,
													0,
												)}
											円
										</div>

										<div className="">
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
													data.courses
														.flatMap((course) =>
															course.reservations
																.filter((reservation) => {
																	const heldAt = new Date(
																		reservation.timeSlots?.[0]?.dateTime || 0,
																	);
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
										<div className="">
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
													data.courses
														.flatMap((course) =>
															course.reservations
																.filter((reservation) => {
																	const heldAt = new Date(
																		reservation.timeSlots?.[0]?.dateTime || 0,
																	);
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
										<div className="p-admin__detail-section">
											<InputBox
												className="p-admin__detail-input"
												value={amount}
												type="number"
												onChange={(e) =>
													setAmount(Number.parseInt(e.target.value))
												}
											/>
											<Button
												className="p-admin__detail-submit"
												onClick={handleSubmit}
											>
												入金登録
											</Button>
										</div>
									</div>
								</>
							);
						}
					})()}
				</>
			) : (
				<>
					<div className="c-checkbox-list__item">
						<label className="c-checkbox-list__label">
							<input
								type="checkbox"
								className="c-checkbox-list__checkbox"
								checked={refundFilter}
								onChange={() => setRefundFilter((prev) => !prev)}
							/>
							未確認のみ
						</label>
					</div>
					{users
						.flatMap((user) =>
							user.refunds
								.filter(
									(refund) =>
										refund.status === RefundStatus.Created || !refundFilter,
								)
								.map((refund) => ({
									...refund,
									user,
								})),
						)
						.sort(
							(a, b) =>
								new Date(b.createdAt).getTime() -
								new Date(a.createdAt).getTime(),
						)
						.map((refund) => (
							<div className="p-admin__user-profile" key={refund.id}>
								<UserIcon
									className="p-admin__user-icon"
									src={refund.user.icon}
								/>
								<div className="p-admin__user-info">
									<div className="p-admin__user-name">{refund.user.name}</div>
									<div className="p-admin__user-email">{refund.user.email}</div>
								</div>
								<div className="p-admin__user-text">{refund.text}</div>
								<div className="p-admin__user-status">
									{StatusText[refund.status]}
								</div>
								<div className="p-admin__user-date">
									{dayjs(refund.createdAt).format("YYYY/M/D hh:mm")}
								</div>
								<div
									className="p-admin__user-detail"
									onClick={() => setShowRefund(refund.id)}
								>
									詳細
								</div>
							</div>
						))}
					{(() => {
						if (showRefund) {
							const data = users
								.flatMap((user) =>
									user.refunds.map((refund) => ({
										...refund,
										user,
									})),
								)
								.find((r) => r.id == showRefund);
							if (!data) return;
							return (
								<>
									<OverLay
										onClick={() => setShowRefund(undefined)}
										className="p-admin__overlay"
									/>
									<div className="p-admin__detail">
										<IconButton
											className="p-admin__detail-close"
											src={closeImage}
											onClick={() => setShowRefund(undefined)}
										/>
										<UserIcon
											className="p-admin__detail-icon"
											src={data.user.icon}
										/>
										<div className="p-admin__detail-section">
											<div className="p-admin__detail-real-name">
												{data.user.name}
											</div>
										</div>
										<div className="p-admin__detail-section">
											<div className="p-admin__detail-email">
												{data.user.email}
											</div>
										</div>
										<div className="p-admin__detail-coach">
											<ImageBox
												className="p-admin__detail-coach-icon"
												src={data.reservation.course.coach.icon ?? defaultIcon}
												objectFit="cover"
												round
											/>
											<div className="p-admin__detail-coach-details">
												<div className="p-admin__detail-coach-name">
													{`${data.reservation.course.coach.name} (${data.reservation.course.title})`}
												</div>
											</div>
										</div>
										<div className="p-admin__detail-section">
											<div className="p-admin__detail-text">{data.text}</div>
										</div>{" "}
										<div className="p-admin__detail-section">
											<div className="p-admin__detail-status">
												{StatusText[data.status]}
											</div>
										</div>
										<div className="p-admin__detail-section -row">
											<Button
												className="p-admin__detail-submit"
												onClick={handleAccept}
											>
												承認
											</Button>
											<Button
												className="p-admin__detail-submit"
												onClick={handleDeny}
											>
												却下
											</Button>
										</div>
									</div>
								</>
							);
						}
					})()}
				</>
			)}
		</div>
	);
};

export default Page;
