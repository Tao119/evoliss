
import { prisma } from "@/lib/prisma";
import { RefundStatus } from "@/type/models";

export const reservationFuncs: { [funcName: string]: Function } = {
    createReservation,
    createRefund
};

async function createReservation({
    userId,
    courseId,
    scheduleId,
    roomId
}: {
    userId: number;
    courseId: number;
    scheduleId: number
    roomId?: number
}) {
    return await prisma.reservation.create({
        data: {
            customerId: userId,
            scheduleId: scheduleId,
            courseId: courseId,
            roomId: roomId
        }
    });
}
async function createRefund({
    reservationId,
    customerId,
    text
}: {
    reservationId: number;
    customerId: number;
    text: string
}) {
    return await prisma.refund.create({
        data: {
            reservationId,
            customerId,
            text,
            status: RefundStatus.Created
        }
    });
}
