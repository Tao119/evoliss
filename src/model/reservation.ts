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
    scheduleIds
}: {
    userId: number;
    courseId: number;
    scheduleIds: number[]
}) {
    console.log({ userId, courseId, scheduleIds })
    return await prisma.reservation.createMany({
        data: scheduleIds.map((scheduleId) => ({
            customerId: userId,
            scheduleId: scheduleId,
            courseId: courseId,
            status: ReservationStatus.Reserved,
        })),
    });
}
