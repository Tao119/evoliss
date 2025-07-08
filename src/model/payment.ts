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
		const newPayment = await tx.payment.create({
			data: {
				customerId,
				reservationId,
				amount,
				method,
			},
		});
		console.log("✅ Payment created:", newPayment);
		return newPayment;
	});
}
