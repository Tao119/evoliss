"use client";

import { UserDataContext } from "@/app/contextProvider";
import checkIcon from "@/assets/image/check.svg";
import Border from "@/components/border";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { requestDB } from "@/services/axios";
import defaultImage from "@/assets/image/picture-icon.svg";
import {
	type Course,
	type Reservation,
	reservationStatus,
} from "@/type/models";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { formatMinutesToTime } from "@/services/formatMinutes";
import dayjs from "dayjs";
import "dayjs/locale/ja";

dayjs.locale("ja");

const Page = () => {
	const router = useRouter();
	const searchParams = useSearchParams()!;
	const { userData } = useContext(UserDataContext)!;
	const reservationIdStr = searchParams.get("reservationId");
	const reservationId = Number.parseInt(reservationIdStr as string);
	const [reservationData, setReservationData] = useState<Reservation>();
	const [courseData, setCourseData] = useState<Course>();

	const [status, setStatus] = useState<
		"loading" | "success" | "pending" | "invalid"
	>("loading");

	useEffect(() => {
		if (!reservationId || isNaN(reservationId)) {
			router.push("/");
			return;
		}

		if (!userData) {
			return;
		}

		const fetchReservationStatus = async () => {
			try {
				const response = await requestDB("reservation", "readReservationById", {
					id: reservationId,
				});

				const reservation: Reservation = response.data;

				if (!reservation) {
					setStatus("invalid");
					setTimeout(() => router.push("/"), 2000);
					return;
				}

				// ログイン中のユーザーIDと予約のcustomerIdが一致しない場合はホームへ
				if (reservation.customerId !== userData.id) {
					setStatus("invalid");
					setTimeout(() => router.push("/"), 2000);
					return;
				}

				if (reservation.status === reservationStatus.Confirmed) {
					// 以前に決済済みの予約
					setStatus("success");
					
					// コース情報を取得
					const { data: course } = await requestDB("course", "readCourseById", {
						id: reservation.courseId,
					});
					setCourseData(course);
					setReservationData(reservation);
				} else if (reservation.status === reservationStatus.Created) {
					// まだ決済が完了していない
					setStatus("pending");
				} else if (reservation.status === reservationStatus.Paid) {
					// 決済完了
					setStatus("success");

					// 予約を確定状態に更新
					const updateResponse = await requestDB("reservation", "updateReservation", {
						id: reservationId,
						status: reservationStatus.Confirmed,
					});

					// 更新された予約情報を再取得（roomIdが含まれる）
					const { data: updatedReservation } = await requestDB("reservation", "readReservationById", {
						id: reservationId,
					});

					// コース情報を取得
					const { data: course } = await requestDB(
						"course",
						"readCourseById",
						{ id: reservation.courseId }
					);
					setCourseData(course);
					setReservationData(reservation);
				}
			} catch (error) {
				console.error("Error fetching reservation:", error);
				setStatus("invalid");
				setTimeout(() => router.push("/"), 2000);
			}
		};

		fetchReservationStatus();

		// pending状態の場合は定期的にチェック
		let interval: NodeJS.Timeout | undefined;
		if (status === "pending") {
			interval = setInterval(() => {
				fetchReservationStatus();
			}, 3000);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [reservationId, router, status, userData]);

	const renderContent = () => {
		switch (status) {
			case "loading":
				return (
					<div className="p-success__title">🔄 決済情報を確認しています...</div>
				);
			case "pending":
				return (
					<div className="p-success__title">
						⏳ 決済処理中です。少々お待ちください...
					</div>
				);
			case "success":
				return (
					<div className="p-success l-page">
						<div className="p-success__section">
							<div className="p-success__title">購入完了しました！</div>
							<Border />
						</div>
						<div className="p-success__course">

							<div className="p-success__course-content">
								<ImageBox
									src={courseData?.image ?? defaultImage}
									className="p-success__course-image"
									objectFit="cover"
								/>
								<div className="p-success__course-game">
									{courseData?.game.name ?? "登録なし"}
								</div>
								<div className="p-success__course-title">{courseData?.title}</div>
								<div className="p-success__course-price">
									{courseData?.price}円 / {formatMinutesToTime(courseData?.duration!)}
								</div>
								<div className="p-success__course-tags">
									{courseData?.tagCourses.slice(0, 3).map((t, i) => (
										<div key={i} className="p-success__course-tag">
											<div className="p-success__course-tag-text">{t.tag.name}</div>
										</div>
									))}
								</div></div>
							<div className="p-success__course-info">
								{reservationData?.timeSlots && reservationData.timeSlots.length > 0 && (
									<>
										<div className="p-success__course-info-date">{dayjs(reservationData.timeSlots[0].dateTime).format("YYYY年MM月DD日（ddd）")}</div>
										<div className="p-success__course-info-time">
											{dayjs(reservationData.timeSlots[0].dateTime).format("HH:mm")}~
											{dayjs(reservationData.timeSlots[reservationData.timeSlots.length - 1].dateTime).add(30, "minute").format("HH:mm")}
										</div>
									</>
								)}
							</div>
							<div className="p-success__text">詳細はコーチからメッセージが届きます。<br />
								ご確認の上、講座当日をお待ちください。</div>

							<Button
								className="p-success__button"
								onClick={() => {
									if (reservationData?.room?.roomKey) {
										router.push(`/mypage/message/${reservationData.room.roomKey}`);
									} else {
										// roomKeyがない場合はメッセージ一覧へ
										router.push("/mypage/message");
									}
								}}
							>
								メッセージ
							</Button><Button
								className="p-success__button"
								onClick={() => router.push("/mypage")}
							>
								マイページ
							</Button>
						</div>
					</div>
				);
			case "invalid":
			default:
				return <div>❌ 無効な決済情報です。ホームへリダイレクト中...</div>;
		}
	};

	return <div className="p-success">{renderContent()}</div>;
};

export default Page;
