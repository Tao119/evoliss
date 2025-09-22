import { prisma } from "@/lib/prisma";
import {
	cancelReservationExpiry,
	scheduleReservationExpiry,
} from "@/lib/queue/reservationQueue";
import { scheduleAutoReview } from "@/lib/queue/reviewQueue";
import { RefundStatus, reservationStatus } from "@/type/models";
import { withTransaction, safeTransaction } from "@/lib/transaction";
import dayjs from "dayjs";
import "dayjs/locale/ja";

dayjs.locale("ja");

export const reservationFuncs: { [funcName: string]: Function } = {
	createReservation,
	createRefund,
	updateRefund,
	updateReservation,
	readReservationById,
	readReservationByCustomerAndSchedule,
	cancelReservation,
	readReservationsByCoachAndCustomer,
	rescheduleReservation,
	readReservationsByCourseId,
	readReservationsByUserId,
	doneCourse,
};

async function createReservation({
	userId,
	courseId,
	timeSlotIds,
}: {
	userId: number;
	courseId: number;
	timeSlotIds: number[];
}) {
	return withTransaction(async (tx) => {
		// まずタイムスロット情報を取得
		const timeSlots = await tx.timeSlot.findMany({
			where: {
				id: { in: timeSlotIds },
			},
			orderBy: {
				dateTime: 'asc',
			},
		});

		if (timeSlots.length === 0) {
			throw new Error("タイムスロットが見つかりません");
		}

		// コース情報を取得
		const course = await tx.course.findUnique({
			where: { id: courseId },
			select: {
				id: true,
				title: true,
				coachId: true,
			},
		});

		if (!course) {
			throw new Error("コースが見つかりません");
		}

		// courseTimeを生成 (YYYY/MM/dd HH:mm~HH:mm形式)
		const firstSlot = timeSlots[0];
		const lastSlot = timeSlots[timeSlots.length - 1];
		const courseTime = `${dayjs(firstSlot.dateTime).format('YYYY/MM/DD HH:mm')}~${dayjs(lastSlot.dateTime).add(30, 'minute').format('HH:mm')}`;

		const reservation = await tx.reservation.create({
			data: {
				customerId: userId,
				courseId: courseId,
				status: reservationStatus.Created,
				courseTime: courseTime,
			},
		});

		const reservationId = reservation.id;

		// タイムスロットを予約に紐付け
		await tx.timeSlot.updateMany({
			where: {
				id: {
					in: timeSlotIds,
				},
			},
			data: {
				reservationId,
			},
		});

		await scheduleReservationExpiry(reservation.id, 1);

		// 購入ありがとうメッセージを送信
		try {
			const { messageFuncs } = await import("./message");
			await messageFuncs.sendPurchaseMessage({
				userId,
				coachId: course.coachId,
				courseTitle: course.title,
			});
		} catch (error) {
			console.error("Failed to send purchase message:", error);
			// メッセージ送信に失敗しても予約作成は継続
		}

		return reservation;
	});
}

async function createRefund({
	reservationId,
}: {
	reservationId: number;
}) {
	const result = await safeTransaction(async (tx) => {
		// 予約情報を取得
		const reservation = await tx.reservation.findUnique({
			where: { id: reservationId },
			include: {
				course: {
					select: {
						id: true,
						coachId: true
					}
				},
				timeSlots: {
					select: {
						id: true,
						coachId: true
					}
				}
			}
		});

		if (!reservation) {
			throw new Error("予約が見つかりません");
		}

		// Refundを作成
		const refund = await tx.refund.create({
			data: {
				reservationId,
				status: RefundStatus.Created,
			},
		});

		// Reservationのステータスをコーチ側キャンセル申請中に更新
		await tx.reservation.update({
			where: { id: reservationId },
			data: {
				status: reservationStatus.CancelRequestedByCoach,
			},
		});

		console.log(`✅ Reservation ${reservationId} status updated to CancelRequestedByCoach`);

		return { refund, reservation };
	});

	// キャッシュの無効化
	if (result && result.reservation) {
		// コースキャッシュを無効化
		if (result.reservation.course?.id) {
			const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
			await deleteCachedData(`${CACHE_PREFIX.COURSE}${result.reservation.course.id}`);
		}

		// コーチキャッシュを無効化
		if (result.reservation.course?.coachId) {
			const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
			await deleteCachedData(`${CACHE_PREFIX.COACH}${result.reservation.course.coachId}`);
		}

		// TimeSlotのコーチキャッシュも無効化
		if (result.reservation.timeSlots && result.reservation.timeSlots.length > 0) {
			const coachId = result.reservation.timeSlots[0].coachId;
			if (coachId) {
				const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
				await deleteCachedData(`${CACHE_PREFIX.COACH}${coachId}`);
			}
		}
	}

	return result?.refund;
}

async function updateRefund({
	refundId,
	accept,
}: {
	refundId: number;
	accept: boolean;
}) {
	const result = await safeTransaction(async (tx) => {
		// Refundを更新
		const updatedRefund = await tx.refund.update({
			where: { id: refundId },
			data: {
				status: accept ? RefundStatus.Accepted : RefundStatus.Denied,
			},
			include: {
				reservation: {
					include: {
						timeSlots: {
							select: {
								id: true,
								coachId: true
							}
						},
						course: {
							select: {
								id: true,
								coachId: true
							}
						}
					}
				}
			}
		});

		// 承認の場合、Reservationのステータスをコーチ側キャンセルに更新
		if (accept && updatedRefund.reservation) {
			// TimeSlotをリリース
			if (updatedRefund.reservation.timeSlots.length > 0) {
				await tx.timeSlot.updateMany({
					where: {
						id: { in: updatedRefund.reservation.timeSlots.map((slot) => slot.id) },
					},
					data: {
						reservationId: null
					},
				});
			}

			// 予約ステータスをCanceledByCoachに更新
			await tx.reservation.update({
				where: { id: updatedRefund.reservationId! },
				data: {
					status: reservationStatus.CanceledByCoach,
				},
			});

			console.log(`✅ Reservation ${updatedRefund.reservationId} status updated to CanceledByCoach`);
		}

		return updatedRefund;
	});

	// キャッシュの無効化
	if (result && accept && result.reservation) {
		// コースキャッシュを無効化
		if (result.reservation.course?.id) {
			const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
			await deleteCachedData(`${CACHE_PREFIX.COURSE}${result.reservation.course.id}`);
		}

		// コーチキャッシュを無効化
		if (result.reservation.course?.coachId) {
			const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
			await deleteCachedData(`${CACHE_PREFIX.COACH}${result.reservation.course.coachId}`);
		}

		// TimeSlotのコーチキャッシュも無効化
		if (result.reservation.timeSlots && result.reservation.timeSlots.length > 0) {
			const coachId = result.reservation.timeSlots[0].coachId;
			if (coachId) {
				const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
				await deleteCachedData(`${CACHE_PREFIX.COACH}${coachId}`);
			}
		}
	}

	return result;
}

async function doneCourse({
	id,
	userId,
}: {
	id: number;
	userId: number;
}) {
	const result = await safeTransaction(async (tx) => {
		// 予約を取得して、コーチを確認
		const reservation = await tx.reservation.findUnique({
			where: { id },
			include: {
				course: {
					select: {
						id: true,
						coachId: true
					}
				},
				timeSlots: {
					select: {
						id: true,
						coachId: true,
						dateTime: true
					}
				}
			},
		});

		if (!reservation) {
			throw new Error("予約が見つかりません");
		}

		// コーチの確認
		if (reservation.course.coachId !== userId) {
			throw new Error("この予約を完了する権限がありません");
		}

		// ステータスチェック（Confirmedのみ完了可能）
		if (reservation.status !== reservationStatus.Confirmed) {
			throw new Error("確定済みの予約のみ完了できます");
		}

		// 時間が過ぎているかチェック（オプション）
		const now = new Date();
		const firstTimeSlot = reservation.timeSlots[0];
		if (firstTimeSlot) {
			const slotTime = new Date(firstTimeSlot.dateTime);
			if (slotTime > now) {
				// 講義時間前でも完了できるようにする（コーチの判断）
				console.log(`⚠️ Completing reservation ${id} before scheduled time`);
			}
		}

		// 予約ステータスをDoneに更新（includeで全情報を取得）
		const updatedReservation = await tx.reservation.update({
			where: { id },
			data: {
				status: reservationStatus.Done,
			},
			include: {
				course: {
					include: {
						coach: true,
						game: true,
						tagCourses: {
							include: {
								tag: true,
							},
						},
					},
				},
				customer: {
					select: {
						id: true,
						name: true,
						icon: true,
					},
				},
				timeSlots: {
					orderBy: {
						dateTime: "asc",
					},
				},
				room: true,
			},
		});

		console.log(`✅ Reservation ${id} marked as Done`);

		// 自動レビューをスケジュール
		try {
			await scheduleAutoReview(id, 5); // 5日後に自動レビュー
			console.log(`✅ Auto review scheduled for reservation ${id}`);
		} catch (error) {
			console.error(`⚠️ Failed to schedule auto review for reservation ${id}:`, error);
			// エラーが発生しても予約の更新は継続
		}

		// コース情報を取得してキャッシュ無効化に使用
		const courseInfo = reservation.course;

		return { success: true, reservation: updatedReservation, courseId: courseInfo.id, courseCoachId: courseInfo.coachId };
	});

	// キャッシュの無効化
	if (result && result.success) {
		// コースキャッシュを無効化
		if (result.courseId) {
			const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
			await deleteCachedData(`${CACHE_PREFIX.COURSE}${result.courseId}`);
		}

		// コーチキャッシュを無効化
		if (result.courseCoachId) {
			const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
			await deleteCachedData(`${CACHE_PREFIX.COACH}${result.courseCoachId}`);
		}
	}

	return result;
}

async function updateReservation({
	id,
	status,
	roomId,
}: {
	id: number;
	status: reservationStatus;
	roomId?: number;
}) {
	return safeTransaction(async (tx) => {
		const updateData: any = { status };
		if (roomId !== undefined) {
			updateData.roomId = roomId;
		}

		const updatedReservation = await tx.reservation.update({
			where: { id },
			data: updateData,
		});
		console.log("✅ Reservation updated:", updatedReservation);

		if (status !== reservationStatus.Created) {
			await cancelReservationExpiry(id);
		}

		// 講義終了時に自動レビューをスケジュール
		if (status === reservationStatus.Done) {
			try {
				await scheduleAutoReview(id, 5); // 5日後に自動レビュー
				console.log(`✅ Auto review scheduled for reservation ${id}`);
			} catch (error) {
				console.error(`⚠️ Failed to schedule auto review for reservation ${id}:`, error);
				// エラーが発生しても予約の更新は継続
			}
		}

		return updatedReservation;
	});
}

async function readReservationById({
	id,
}: {
	id: number;
}) {
	try {
		return await prisma.reservation.findUnique({
			where: {
				id,
			},
			include: {
				timeSlots: true,
				room: true,
				course: { include: { game: true } }
			},
		});
	} catch (error) {
		console.error("🚨 Error reading payment:", error);
		return null;
	}
}

async function readReservationByCustomerAndSchedule({
	customerId,
	timeSlotIds,
}: {
	customerId: number;
	timeSlotIds: number[];
}) {
	try {
		const existingReservations = await prisma.reservation.findMany({
			where: {
				customerId,
				timeSlots: {
					some: {
						id: { in: timeSlotIds },
					},
				},
			},
			include: {
				timeSlots: {
					select: { id: true, dateTime: true },
				},
				course: {
					select: { id: true, title: true },
				},
			},
		});

		return existingReservations;
	} catch (error) {
		console.error("🚨 Error reading reservation:", error);
		return null;
	}
}

async function cancelReservation({
	id,
	customerId,
}: {
	id: number;
	customerId: number;
}) {
	const result = await safeTransaction(async (tx) => {
		// 予約を取得して、所有者を確認
		const reservation = await tx.reservation.findUnique({
			where: { id },
			include: {
				timeSlots: {
					select: {
						id: true,
						coachId: true
					}
				},
				payment: true,
				course: {
					select: {
						id: true,
						coachId: true
					}
				}
			},
		});

		if (!reservation) {
			throw new Error("予約が見つかりません");
		}

		if (reservation.customerId !== customerId) {
			throw new Error("この予約をキャンセルする権限がありません");
		}

		// キャンセルに期限はなし

		// TimeSlotをリリース
		if (reservation.timeSlots.length > 0) {
			await tx.timeSlot.updateMany({
				where: {
					id: { in: reservation.timeSlots.map((slot) => slot.id) },
				},
				data: {
					reservationId: null
				},
			});
		}

		// 予約ステータスをCancelledに更新
		await tx.reservation.update({
			where: { id },
			data: {
				status: reservationStatus.Canceled,
			},
		});

		// TODO: Stripeでの返金処理を実装
		// if (reservation.payment) {
		//   await refundPayment(reservation.payment.stripePaymentIntentId);
		// }

		return { success: true, reservation };
	});

	// キャッシュの無効化
	if (result && result.success) {
		// コースキャッシュを無効化
		if (result.reservation?.course?.id) {
			const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
			await deleteCachedData(`${CACHE_PREFIX.COURSE}${result.reservation.course.id}`);
		}

		// コーチキャッシュを無効化
		if (result.reservation?.course?.coachId) {
			const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
			await deleteCachedData(`${CACHE_PREFIX.COACH}${result.reservation.course.coachId}`);
		}

		// TimeSlotのコーチキャッシュも無効化
		if (result.reservation?.timeSlots && result.reservation.timeSlots.length > 0) {
			const coachId = result.reservation.timeSlots[0].coachId;
			if (coachId) {
				const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
				await deleteCachedData(`${CACHE_PREFIX.COACH}${coachId}`);
			}
		}
	}

	return result;
}

async function readReservationsByCourseId({
	courseId,
}: {
	courseId: number;
}) {
	try {
		return await prisma.reservation.findMany({
			where: {
				courseId,
			},
			include: {
				course: {
					include: {
						coach: true,
						game: true,
						tagCourses: {
							include: {
								tag: true,
							},
						},
					},
				},
				customer: {
					select: {
						id: true,
						name: true,
						icon: true,
					},
				},
				timeSlots: {
					orderBy: {
						dateTime: "asc",
					},
				},
				room: true,
				review: true
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	} catch (error) {
		console.error("🚨 Error reading reservations by course:", error);
		return [];
	}
}

async function readReservationsByUserId({
	userId,
}: {
	userId: number;
}) {
	try {
		return await prisma.reservation.findMany({
			where: {
				customerId: userId,
			},
			include: {
				course: {
					include: {
						coach: true,
						game: true,
						tagCourses: {
							include: {
								tag: true,
							},
						},
					},
				},
				customer: {
					select: {
						id: true,
						name: true,
						icon: true,
					},
				},
				timeSlots: {
					orderBy: {
						dateTime: "asc",
					},
				},
				room: true,
				review: true,
				refunds: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	} catch (error) {
		console.error("🚨 Error reading reservations by user:", error);
		return [];
	}
}

async function readReservationsByCoachAndCustomer({
	coachId,
	customerId,
}: {
	coachId: number;
	customerId: number;
}) {
	try {
		return await prisma.reservation.findMany({
			where: {
				customerId,
				course: {
					coachId,
				},
				status: {
					in: [reservationStatus.Confirmed, reservationStatus.Paid],
				},
			},
			include: {
				course: {
					include: {
						coach: true,
						game: true,
						tagCourses: {
							include: {
								tag: true,
							},
						},
					},
				},
				timeSlots: {
					orderBy: {
						dateTime: "asc",
					},
				},
				room: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	} catch (error) {
		console.error("🚨 Error reading reservations:", error);
		return [];
	}
}

async function rescheduleReservation({
	id,
	customerId,
	newTimeSlotIds,
}: {
	id: number;
	customerId: number;
	newTimeSlotIds: number[];
}) {
	const result = await safeTransaction(async (tx) => {
		// 予約を取得して、所有者を確認
		const reservation = await tx.reservation.findUnique({
			where: { id },
			include: {
				timeSlots: true,
				course: {
					select: {
						id: true,
						coachId: true
					}
				}
			},
		});

		if (!reservation) {
			throw new Error("予約が見つかりません");
		}

		if (reservation.customerId !== customerId) {
			throw new Error("この予約を変更する権限がありません");
		}

		// キャンセル済みの確認
		if (reservation.status === reservationStatus.Canceled) {
			throw new Error("キャンセル済みの予約は日程変更できません");
		}

		// 過去の予約・5日前までの変更か確認
		const firstSlot = reservation.timeSlots[0];
		if (firstSlot) {
			const now = new Date().getTime();
			const classTime = new Date(firstSlot.dateTime).getTime();

			// 過去の予約
			if (classTime < now) {
				throw new Error("過去の予約は日程変更できません");
			}

			// 5日前までの変更か確認
			const daysUntilClass = Math.floor(
				(classTime - now) / (1000 * 60 * 60 * 24)
			);
			if (daysUntilClass < 5) {
				throw new Error("日程変更期限を過ぎています（5日前まで）");
			}
		}

		// 新しいTimeSlotが利用可能か確認
		const newSlots = await tx.timeSlot.findMany({
			where: {
				id: { in: newTimeSlotIds },
				reservationId: null,
			},
			select: {
				id: true,
				coachId: true,
				dateTime: true,
			},
			orderBy: {
				dateTime: 'asc',
			},
		});

		if (newSlots.length !== newTimeSlotIds.length) {
			throw new Error("選択された時間が利用できません");
		}

		// 新しいcourseTimeを生成
		const firstNewSlot = newSlots[0];
		const lastNewSlot = newSlots[newSlots.length - 1];
		const newCourseTime = `${dayjs(firstNewSlot.dateTime).format('YYYY/MM/DD HH:mm')}~${dayjs(lastNewSlot.dateTime).add(30, 'minute').format('HH:mm')}`;

		// 古いTimeSlotをリリース
		if (reservation.timeSlots.length > 0) {
			await tx.timeSlot.updateMany({
				where: {
					id: { in: reservation.timeSlots.map((slot) => slot.id) },
				},
				data: {
					reservationId: null
				},
			});
		}

		// 新しいTimeSlotを予約
		await tx.timeSlot.updateMany({
			where: {
				id: { in: newTimeSlotIds },
			},
			data: {
				reservationId: id,
			},
		});

		// courseTimeを更新
		await tx.reservation.update({
			where: { id },
			data: {
				courseTime: newCourseTime,
			},
		});

		return { success: true, reservation, newSlots };
	});

	// キャッシュの無効化
	if (result && result.success) {
		// コースキャッシュを無効化
		if (result.reservation?.course?.id) {
			const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
			await deleteCachedData(`${CACHE_PREFIX.COURSE}${result.reservation.course.id}`);
		}

		// コーチキャッシュを無効化
		if (result.reservation?.course?.coachId) {
			const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
			await deleteCachedData(`${CACHE_PREFIX.COACH}${result.reservation.course.coachId}`);
		}

		// 新しいコーチのキャッシュも無効化（コーチが変わった場合）
		if (result.newSlots && result.newSlots.length > 0) {
			const newCoachId = result.newSlots[0].coachId;
			if (newCoachId && newCoachId !== result.reservation?.course?.coachId) {
				const { deleteCachedData, CACHE_PREFIX } = await import("@/lib/cache");
				await deleteCachedData(`${CACHE_PREFIX.COACH}${newCoachId}`);
			}
		}
	}

	return result;
}
