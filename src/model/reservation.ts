export enum ReservationStatus {
    Reserved = 0,
    Done = 1,
    Canceled = 2
}
import { prisma } from "@/lib/prisma";

export const reservationFuncs: { [funcName: string]: Function } = {
    createReservation,
};

async function createReservation({
    userId,
    courseId,
    scheduleId
}: {
    userId: number;
    courseId: number;
    scheduleId: number
}) {
    console.log({ userId, courseId, scheduleId })
    return await prisma.reservation.create({
        data: {
            customerId: userId,
            scheduleId: scheduleId,
            courseId: courseId,
            status: ReservationStatus.Reserved,
        }
    });
}
