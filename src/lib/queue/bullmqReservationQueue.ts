// ========================================
// lib/queue/bullmqReservationQueue.ts - BullMQ版
// ========================================

import { Queue, Worker, QueueEvents } from 'bullmq';
import { reservationStatus } from "@/type/models";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();

// Redis接続設定
const connection = new Redis({
    port: Number.parseInt(process.env.REDIS_PORT || "6379"),
    host: process.env.REDIS_HOST || "127.0.0.1",
    password: process.env.REDIS_PASSWORD,
    db: 0,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

// Queue作成
export const reservationExpiryQueue = new Queue('reservation-expiry', {
    connection,
    defaultJobOptions: {
        removeOnComplete: {
            count: 10,
        },
        removeOnFail: {
            count: 50,
        },
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
});

// Worker作成
const worker = new Worker('reservation-expiry', async (job) => {
    const { reservationId } = job.data;

    console.log(`🔄 Processing expiry for reservation ${reservationId}`);

    try {
        // 現在の予約状態を確認
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                timeSlots: true,
            },
        });

        if (!reservation) {
            console.log(`ℹ️ Reservation ${reservationId} not found`);
            return { success: false, reason: "Reservation not found" };
        }

        if (reservation.status !== reservationStatus.Created) {
            console.log(
                `ℹ️ Reservation ${reservationId} status is ${reservation.status}, skipping expiry`,
            );
            return { success: false, reason: "Already processed" };
        }

        // トランザクションで期限切れ処理
        await prisma.$transaction(async (tx) => {
            // 予約を期限切れに更新
            await tx.reservation.update({
                where: { id: reservationId },
                data: {
                    status: reservationStatus.Expired,
                    updatedAt: new Date(),
                },
            });

            // 関連するtimeSlotを解放
            if (reservation.timeSlots && reservation.timeSlots.length > 0) {
                await tx.timeSlot.updateMany({
                    where: {
                        id: {
                            in: reservation.timeSlots.map((ts) => ts.id),
                        },
                    },
                    data: {
                        reservationId: null,
                    },
                });
            }
        });

        console.log(`✅ Reservation ${reservationId} expired successfully`);

        return {
            success: true,
            reservationId,
            expiredAt: new Date(),
            releasedSlots: reservation.timeSlots?.length || 0,
        };
    } catch (error) {
        console.error(`🚨 Error expiring reservation ${reservationId}:`, error);
        throw error;
    }
}, {
    connection,
});

// イベントリスナー
worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.error(`🚨 Job ${job?.id} failed:`, err);
});

// ========================================
// 予約作成時の期限切れジョブスケジュール
// ========================================

export async function scheduleReservationExpiry(
    reservationId: number,
    expiryHours = 1,
) {
    const delay = expiryHours * 60 * 60 * 1000;

    const job = await reservationExpiryQueue.add(
        'expire-reservation',
        {
            reservationId,
            scheduledAt: new Date(),
            expiryTime: new Date(Date.now() + delay),
        },
        {
            delay,
            jobId: `expire-${reservationId}`,
        },
    );

    console.log(
        `⏰ Expiry job scheduled for reservation ${reservationId} (Job ID: ${job.id})`,
    );
    return job;
}

// ========================================
// 予約確定時のジョブキャンセル
// ========================================

export async function cancelReservationExpiry(
    reservationId: number,
): Promise<boolean> {
    try {
        const jobId = `expire-${reservationId}`;
        const job = await reservationExpiryQueue.getJob(jobId);

        if (job) {
            await job.remove();
            console.log(`🚫 Expiry job cancelled for reservation ${reservationId}`);
            return true;
        } else {
            console.log(
                `ℹ️ No pending expiry job found for reservation ${reservationId}`,
            );
            return false;
        }
    } catch (error) {
        console.error(
            `🚨 Error cancelling expiry job for reservation ${reservationId}:`,
            error,
        );
        return false;
    }
}

// ========================================
// クリーンアップ
// ========================================

export async function closeQueue() {
    await worker.close();
    await reservationExpiryQueue.close();
    await connection.quit();
    console.log("👋 Queue connections closed");
}

// Graceful shutdown
process.on("SIGTERM", closeQueue);
process.on("SIGINT", closeQueue);
