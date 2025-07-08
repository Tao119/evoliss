// ========================================
// lib/queue/reservationQueue.ts
// ========================================

import { reservationStatus } from "@/type/models";
import { PrismaClient } from "@prisma/client";
import Bull from "bull";
import { getReservationQueue, closeAllQueues } from "./bullConfig";

const prisma = new PrismaClient();

// Bull Queue インスタンスを取得
export const reservationExpiryQueue = getReservationQueue();

// ========================================
// ジョブ処理定義
// ========================================

reservationExpiryQueue.process("expire-reservation", async (job) => {
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

		// 通知処理（オプション）
		await sendExpiryNotification(reservation);

		return {
			success: true,
			reservationId,
			expiredAt: new Date(),
			releasedSlots: reservation.timeSlots?.length || 0,
		};
	} catch (error) {
		console.error(`🚨 Error expiring reservation ${reservationId}:`, error);
		throw error; // Bull Queueのリトライ機能を使用
	}
});

// ========================================
// 予約作成時の期限切れジョブスケジュール
// ========================================

export async function scheduleReservationExpiry(
	reservationId: number,
	expiryHours = 1,
): Promise<Bull.Job> {
	const delay = expiryHours * 60 * 60 * 1000;

	const job = await reservationExpiryQueue.add(
		"expire-reservation",
		{
			reservationId,
			scheduledAt: new Date(),
			expiryTime: new Date(Date.now() + delay),
		},
		{
			delay,
			jobId: `expire-${reservationId}`,
			removeOnComplete: true,
			removeOnFail: false,
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

		// 待機中・遅延中のジョブを検索
		const [waitingJobs, delayedJobs] = await Promise.all([
			reservationExpiryQueue.getJobs(["waiting"]),
			reservationExpiryQueue.getJobs(["delayed"]),
		]);

		const allJobs = [...waitingJobs, ...delayedJobs];
		const targetJob = allJobs.find((job) => job.id === jobId);

		if (targetJob) {
			await targetJob.remove();
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
// 通知機能（オプション）
// ========================================

async function sendExpiryNotification(reservation: any) {
	try {
		// メール通知、プッシュ通知などの実装
		console.log(
			`📧 Sending expiry notification for reservation ${reservation.id}`,
		);

		// 例: メール送信
		// await sendEmail({
		//     to: reservation.customer.email,
		//     subject: '予約期限切れのお知らせ',
		//     template: 'reservation-expired',
		//     data: { reservation }
		// });
	} catch (error) {
		console.error("🚨 Error sending expiry notification:", error);
		// 通知失敗は致命的エラーではないので、ここで処理を停止しない
	}
}

// ========================================
// 実際の使用例
// ========================================

// 予約作成API
export async function createReservationWithExpiry(reservationData: any) {
	try {
		const reservation = await prisma.reservation.create({
			data: {
				...reservationData,
				status: "created",
			},
		});

		await scheduleReservationExpiry(reservation.id, 1); // 1時間後

		return reservation;
	} catch (error) {
		console.error("🚨 Error creating reservation with expiry:", error);
		throw error;
	}
}

// 支払い完了時の処理
export async function confirmReservation(reservationId: number) {
	try {
		// 予約をconfirmedに更新
		const reservation = await prisma.reservation.update({
			where: { id: reservationId },
			data: {
				status: reservationStatus.Confirmed,
				updatedAt: new Date(),
			},
		});

		// 期限切れジョブをキャンセル
		await cancelReservationExpiry(reservationId);

		console.log(`✅ Reservation ${reservationId} confirmed successfully`);
		return reservation;
	} catch (error) {
		console.error(`🚨 Error confirming reservation ${reservationId}:`, error);
		throw error;
	}
}

// ========================================
// 管理・モニタリング機能
// ========================================

export async function getQueueStats() {
	const [waiting, active, completed, failed, delayed] = await Promise.all([
		reservationExpiryQueue.getWaiting(),
		reservationExpiryQueue.getActive(),
		reservationExpiryQueue.getCompleted(),
		reservationExpiryQueue.getFailed(),
		reservationExpiryQueue.getDelayed(),
	]);

	return {
		waiting: waiting.length,
		active: active.length,
		completed: completed.length,
		failed: failed.length,
		delayed: delayed.length,
		total: waiting.length + active.length + delayed.length,
	};
}

// 失敗したジョブを再実行
export async function retryFailedJobs() {
	const failedJobs = await reservationExpiryQueue.getFailed();

	for (const job of failedJobs) {
		await job.retry();
	}

	console.log(`🔄 Retried ${failedJobs.length} failed jobs`);
}

// キューのクリーンアップ
export async function cleanQueue() {
	await reservationExpiryQueue.clean(24 * 60 * 60 * 1000, "completed"); // 24時間以上前の完了ジョブを削除
	await reservationExpiryQueue.clean(7 * 24 * 60 * 60 * 1000, "failed"); // 7日以上前の失敗ジョブを削除

	console.log("🧹 Queue cleaned");
}

// ========================================
// アプリケーション初期化
// ========================================

export async function initializeQueue() {
	try {
		// キューの接続テスト
		await reservationExpiryQueue.isReady();
		console.log("✅ Bull Queue initialized successfully");

		// エラーハンドリングは既にbullConfigで設定済み
	} catch (error) {
		console.error("🚨 Queue initialization failed:", error);
		throw error;
	}
}

export async function closeQueue() {
	await closeAllQueues();
	console.log("👋 Queue connection closed");
}

// Graceful shutdown
process.on("SIGTERM", closeQueue);
process.on("SIGINT", closeQueue);
