import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCancelNotification } from "@/lib/notification/notificationService";
import { reservationStatus } from "@/type/models";

export async function POST(request: NextRequest) {
    try {
        const { reservationId, userId, reason } = await request.json();

        if (!reservationId || !userId) {
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

        // 権限チェック（コーチまたは顧客のみキャンセル可能）
        const isCoach = userId === reservation.course.coachId;
        const isCustomer = userId === reservation.customerId;

        if (!isCoach && !isCustomer) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        // 予約をキャンセル状態に更新
        const updatedReservation = await prisma.reservation.update({
            where: { id: reservationId },
            data: {
                status: reservationStatus.Canceled,
                // キャンセル理由があれば保存（必要に応じてスキーマに追加）
            },
        });

        // 相手方への通知を送信（キャンセル者以外に送信）
        const recipientId = isCoach ? reservation.customerId : reservation.course.coachId;
        const recipient = isCoach ? reservation.customer : reservation.course.coach;
        const cancelledBy = isCoach ? reservation.course.coach.name : reservation.customer.name;

        if (recipient && recipientId !== userId) {
            await sendCancelNotification({
                recipientId,
                recipientEmail: recipient.email,
                recipientName: recipient.name || "ユーザー",
                courseTitle: reservation.course.title,
                courseTime: reservation.courseTime || "",
                cancelledBy: cancelledBy || "ユーザー",
                reservationId,
            });
        }

        console.log(`❌ Reservation ${reservationId} cancelled by user ${userId}`);

        return NextResponse.json({
            success: true,
            reservation: updatedReservation,
        });

    } catch (error) {
        console.error("❌ Failed to cancel reservation:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}