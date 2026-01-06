import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRescheduleNotification } from "@/lib/notification/notificationService";

export async function POST(request: NextRequest) {
    try {
        const { reservationId, newCourseTime, userId } = await request.json();

        if (!reservationId || !newCourseTime || !userId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 予約情報を取得
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                course: {
                    include: { coach: true }
                },
                customer: true,
            },
        });

        if (!reservation) {
            return NextResponse.json(
                { error: "Reservation not found" },
                { status: 404 }
            );
        }

        // 権限チェック（コーチまたは顧客のみ変更可能）
        const isCoach = userId === reservation.course.coachId;
        const isCustomer = userId === reservation.customerId;

        if (!isCoach && !isCustomer) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const oldCourseTime = reservation.courseTime;

        // 予約の日時を更新
        const updatedReservation = await prisma.reservation.update({
            where: { id: reservationId },
            data: { courseTime: newCourseTime },
        });

        // 相手方への通知を送信（変更者以外に送信）
        const recipientId = isCoach ? reservation.customerId : reservation.course.coachId;
        const recipient = isCoach ? reservation.customer : reservation.course.coach;
        const changedBy = isCoach ? reservation.course.coach.name : reservation.customer.name;

        if (recipient && recipientId !== userId) {
            await sendRescheduleNotification({
                recipientId,
                recipientEmail: recipient.email,
                recipientName: recipient.name || "ユーザー",
                courseTitle: reservation.course.title,
                oldTime: oldCourseTime || "",
                newTime: newCourseTime,
                changedBy: changedBy || "ユーザー",
                reservationId,
            });
        }

        console.log(`📅 Reservation ${reservationId} rescheduled by user ${userId}`);

        return NextResponse.json({
            success: true,
            reservation: updatedReservation,
        });

    } catch (error) {
        console.error("❌ Failed to reschedule reservation:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}