// ========================================
// lib/queue/reviewQueue.ts
// ========================================

import { reservationStatus } from "@/type/models";
import { PrismaClient } from "@prisma/client";
import Bull from "bull";
import { createBullQueue, closeAllQueues } from "./bullConfig";

const prisma = new PrismaClient();

// Bull Queue インスタンスを作成
export const autoReviewQueue = createBullQueue('auto-review');

// ========================================
// ジョブ処理定義
// ========================================

autoReviewQueue.process("auto-review", async (job) => {
	const { reservationId } = job.data;

	console.log(`🔄 Processing auto review for reservation ${reservationId}`);

	try {
		// 現在の予約状態を確認
		const reservation = await prisma.reservation.findUnique({
			where: { id: reservationId },
			include: {
				course: true,
				customer: true,
				review: true,
			},
		});

		if (!reservation) {
			console.log(`ℹ️ Reservation ${reservationId} not found`);
			return { success: false, reason: "Reservation not found" };
		}

		// 既にレビューがある場合はスキップ
		if (reservation.review) {
			console.log(
				`ℹ️ Reservation ${reservationId} already has a review, skipping auto review`,
			);
			return { success: false, reason: "Review already exists" };
		}

		// ステータスがDone以外の場合はスキップ
		if (reservation.status !== reservationStatus.Done) {
			console.log(
				`ℹ️ Reservation ${reservationId} status is ${reservation.status}, skipping auto review`,
			);
			return { success: false, reason: "Not in Done status" };
		}

		// トランザクションで自動レビュー作成
		await prisma.$transaction(async (tx) => {
			// レビューを作成（★5つ）
			await tx.review.create({
				data: {
					customerId: reservation.customerId,
					courseId: reservation.courseId,
					reservationId: reservation.id,
					rating: 5,
					comment: null, // 自動レビューのためコメントなし
				},
			});

			// 予約のステータスをReviewedに更新
			await tx.reservation.update({
				where: { id: reservationId },
				data: {
					status: reservationStatus.Reviewed,
					updatedAt: new Date(),
				},
			});
		});

		console.log(`✅ Auto review created for reservation ${reservationId}`);

		return {
			success: true,
			reservationId,
			reviewedAt: new Date(),
			rating: 5,
		};
	} catch (error) {
		console.error(`🚨 Error creating auto review for reservation ${reservationId}:`, error);
		throw error; // Bull Queueのリトライ機能を使用
	}
});

// ========================================
// 講義終了時の自動レビュージョブスケジュール
// ========================================

export async function scheduleAutoReview(
	reservationId: number,
	delayDays = 5,
): Promise<Bull.Job> {
	const delay = delayDays * 24 * 60 * 60 * 1000; // 5日後

	const job = await autoReviewQueue.add(
		"auto-review",
		{
			reservationId,
			scheduledAt: new Date(),
			reviewTime: new Date(Date.now() + delay),
		},
		{
			delay,
			jobId: `auto-review-${reservationId}`,
			removeOnComplete: true,
			removeOnFail: false,
		},
	);

	console.log(
		`⏰ Auto review scheduled for reservation ${reservationId} (Job ID: ${job.id})`,
	);
	return job;
}

// ========================================
// 手動レビュー時のジョブキャンセル
// ========================================

export async function cancelAutoReview(
	reservationId: number,
): Promise<boolean> {
	try {
		const jobId = `auto-review-${reservationId}`;

		// 待機中・遅延中のジョブを検索
		const [waitingJobs, delayedJobs] = await Promise.all([
			autoReviewQueue.getJobs(["waiting"]),
			autoReviewQueue.getJobs(["delayed"]),
		]);

		const allJobs = [...waitingJobs, ...delayedJobs];
		const targetJob = allJobs.find((job) => job.id === jobId);

		if (targetJob) {
			await targetJob.remove();
			console.log(`🚫 Auto review job cancelled for reservation ${reservationId}`);
			return true;
		} else {
			console.log(
				`ℹ️ No pending auto review job found for reservation ${reservationId}`,
			);
			return false;
		}
	} catch (error) {
		console.error(
			`🚨 Error cancelling auto review job for reservation ${reservationId}:`,
			error,
		);
		return false;
	}
}

// ========================================
// 管理・モニタリング機能
// ========================================

export async function getAutoReviewQueueStats() {
	const [waiting, active, completed, failed, delayed] = await Promise.all([
		autoReviewQueue.getWaiting(),
		autoReviewQueue.getActive(),
		autoReviewQueue.getCompleted(),
		autoReviewQueue.getFailed(),
		autoReviewQueue.getDelayed(),
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
export async function retryFailedAutoReviewJobs() {
	const failedJobs = await autoReviewQueue.getFailed();

	for (const job of failedJobs) {
		await job.retry();
	}

	console.log(`🔄 Retried ${failedJobs.length} failed auto review jobs`);
}

// キューのクリーンアップ
export async function cleanAutoReviewQueue() {
	await autoReviewQueue.clean(24 * 60 * 60 * 1000, "completed"); // 24時間以上前の完了ジョブを削除
	await autoReviewQueue.clean(7 * 24 * 60 * 60 * 1000, "failed"); // 7日以上前の失敗ジョブを削除

	console.log("🧹 Auto review queue cleaned");
}

// ========================================
// アプリケーション初期化
// ========================================

export async function initializeAutoReviewQueue() {
	try {
		// キューの接続テスト
		await autoReviewQueue.isReady();
		console.log("✅ Auto Review Queue initialized successfully");

		// エラーハンドリングは既にbullConfigで設定済み
	} catch (error) {
		console.error("🚨 Auto Review Queue initialization failed:", error);
		throw error;
	}
}

export async function closeAutoReviewQueue() {
	await autoReviewQueue.close();
	console.log("👋 Auto Review Queue connection closed");
}

// Graceful shutdown
process.on("SIGTERM", closeAutoReviewQueue);
process.on("SIGINT", closeAutoReviewQueue);
