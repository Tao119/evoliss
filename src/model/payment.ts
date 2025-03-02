import { prisma } from "@/lib/prisma";

export const paymentFuncs: { [funcName: string]: Function } = {
    readPaymentById,
    createPayment,
    updatePayment,
    readPaymentByCustomerAndSchedule
};

async function readPaymentById({ id
}: {
    id: number;
}) {
    try {
        return await prisma.payment.findUnique({
            where: {
                id
            },
            include: {
                schedule: {
                    select: {
                        course: { select: { coach: true } }
                    }
                }
            }
        });
    } catch (error) {
        console.error("🚨 Error reading payment:", error);
        return null;
    }
} async function readPaymentByCustomerAndSchedule({ customerId, scheduleId
}: {
    customerId: number;
    scheduleId: number;
}) {
    try {
        return await prisma.payment.findFirst({
            where: {
                customerId, scheduleId
            }
        });
    } catch (error) {
        console.error("🚨 Error reading payment:", error);
        return null;
    }
}

async function createPayment({
    customerId,
    scheduleId,
    amount,
    method,
}: {
    customerId: number;
    scheduleId: number;
    amount: number;
    method: string;
}) {
    try {
        const newPayment = await prisma.payment.create({
            data: {
                customerId,
                scheduleId,
                amount,
                method,
                status: 0,
            },
        });
        console.log("✅ Payment created:", newPayment);
        return newPayment;
    } catch (error) {
        console.error("🚨 Error creating payment:", error);
        return null;
    }
}

async function updatePayment({
    id,
    status,
}: {
    id: number;
    status: number;
}) {
    try {
        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: { status },
        });
        console.log("✅ Payment updated:", updatedPayment);
        return updatedPayment;
    } catch (error) {
        console.error("🚨 Error updating payment:", error);
        return null;
    }
}
