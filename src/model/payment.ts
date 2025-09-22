import { prisma } from "@/lib/prisma";
import { safeTransaction } from "@/lib/transaction";

export const paymentFuncs: { [funcName: string]: Function } = {
	readPaymentById,
	createPayment,
	readPaymentByCustomerAndSchedule,
};

async function readPaymentById({
	id,
}: {
	id: number;
}) {
	try {
		return await prisma.payment.findUnique({
			where: {
				id,
			},
			include: {
				reservation: true,
			},
		});
	} catch (error) {
		console.error("🚨 Error reading payment:", error);
		return null;
	}
}

async function readPaymentByCustomerAndSchedule({
	customerId,
	reservationId,
}: {
	customerId: number;
	reservationId: number;
}) {
	try {
		return await prisma.payment.findFirst({
			where: {
				customerId,
				reservationId,
			},
		});
	} catch (error) {
		console.error("🚨 Error reading payment:", error);
		return null;
	}
}

async function createPayment({
	customerId,
	reservationId,
	amount,
	method,
}: {
	customerId: number;
	reservationId: number;
	amount: number;
	method: string;
}) {
	return safeTransaction(async (tx) => {
		// 予約とコース情報を取得
		const reservation = await tx.reservation.findUnique({
			where: { id: reservationId },
			include: {
				course: {
					select: {
						id: true,
						title: true,
						coachId: true,
					},
				},
			},
		});

		if (!reservation || !reservation.course) {
			throw new Error("予約またはコース情報が見つかりません");
		}

		const newPayment = await tx.payment.create({
			data: {
				customerId,
				reservationId,
				amount,
				method,
			},
		});

		console.log("✅ Payment created:", newPayment);

		// 決済完了後に購入ありがとうメッセージを送信
		try {
			const { messageFuncs } = await import("./message");
			await messageFuncs.sendPurchaseMessage({
				userId: customerId,
				coachId: reservation.course.coachId,
				courseTitle: reservation.course.title,
			});
			console.log("✅ Purchase message sent");
		} catch (error) {
			console.error("Failed to send purchase message:", error);
			// メッセージ送信に失敗しても決済処理は継続
		}

		return newPayment;
	});
}
