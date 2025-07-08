import { prisma } from "@/lib/prisma";
import {
	cancelReservationExpiry,
	scheduleReservationExpiry,
} from "@/lib/queue/reservationQueue";
import { RefundStatus, reservationStatus } from "@/type/models";
import { withTransaction, safeTransaction } from "@/lib/transaction";

export const reservationFuncs: { [funcName: string]: Function } = {
	createReservation,
	createRefund,
	updateRefund,
	updateReservation,
	readReservationById,
	readReservationByCustomerAndSchedule,
	cancelReservation,
	readReservationsByCoachAndCustomer,
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
	const reservation = await prisma.reservation.create({
		data: {
			customerId: userId,
			courseId: courseId,
			status: reservationStatus.Created,
		},
	});

	const reservationId = reservation.id;

	const timeSlots = await prisma.timeSlot.updateMany({
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

	return reservation;
}

async function createRefund({
	reservationId,
	customerId,
	text,
}: {
	reservationId: number;
	customerId: number;
	text: string;
}) {
	return await prisma.refund.create({
		data: {
			reservationId,
			customerId,
			text,
			status: RefundStatus.Created,
		},
	});
}

async function updateRefund({
	refundId,
	accept,
}: {
	refundId: number;
	accept: boolean;
}) {
	return await prisma.refund.update({
		where: { id: refundId },
		data: {
			status: accept ? RefundStatus.Accepted : RefundStatus.Denied,
		},
	});
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
	return safeTransaction(async (tx) => {
		// 予約を取得して、所有者を確認
		const reservation = await tx.reservation.findUnique({
			where: { id },
			include: {
				timeSlots: true,
				payment: true,
			},
		});

		if (!reservation) {
			throw new Error("予約が見つかりません");
		}

		if (reservation.customerId !== customerId) {
			throw new Error("この予約をキャンセルする権限がありません");
		}

		// 5日前までのキャンセルか確認
		const firstSlot = reservation.timeSlots[0];
		if (firstSlot) {
			const daysUntilClass = Math.floor(
				(new Date(firstSlot.dateTime).getTime() - new Date().getTime()) /
				(1000 * 60 * 60 * 24)
			);
			if (daysUntilClass < 5) {
				throw new Error("キャンセル期限を過ぎています（5日前まで）");
			}
		}

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

		return { success: true };
	});
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
