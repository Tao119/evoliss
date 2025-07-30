import { prisma } from "@/lib/prisma";
import { reservationStatus } from "@/type/models";
import { safeTransaction } from "@/lib/transaction";
import { cancelAutoReview } from "@/lib/queue/reviewQueue";

export const reviewFuncs: { [funcName: string]: Function } = {
	createReview,
	readReviewsByCustomer,
	readReviewsByCourse,
	checkReviewExists,
};

async function createReview({
	customerId,
	courseId,
	reservationId,
	rating,
	comment,
}: {
	customerId: number;
	courseId: number;
	reservationId: number;
	rating: number;
	comment?: string;
}) {
	return safeTransaction(async (tx) => {
		// 予約の確認
		const reservation = await tx.reservation.findUnique({
			where: { id: reservationId },
			include: {
				course: true,
			},
		});

		if (!reservation) {
			throw new Error("予約が見つかりません");
		}

		if (reservation.customerId !== customerId) {
			throw new Error("この予約にレビューを投稿する権限がありません");
		}

		if (reservation.courseId !== courseId) {
			throw new Error("予約と講座のIDが一致しません");
		}

		// 既存のレビューがないか確認
		const existingReview = await tx.review.findUnique({
			where: { reservationId },
		});

		if (existingReview) {
			throw new Error("この予約には既にレビューが存在します");
		}

		// レビューを作成
		const review = await tx.review.create({
			data: {
				customerId,
				courseId,
				reservationId,
				rating,
				comment: comment || null,
			},
		});

		// 予約のステータスをReviewedに更新
		await tx.reservation.update({
			where: { id: reservationId },
			data: {
				status: reservationStatus.Reviewed,
			},
		});

		// 自動レビュージョブをキャンセル
		try {
			await cancelAutoReview(reservationId);
			console.log(`✅ Auto review job cancelled for reservation ${reservationId}`);
		} catch (error) {
			console.error(`⚠️ Failed to cancel auto review job for reservation ${reservationId}:`, error);
			// エラーが発生してもレビューの作成は継続
		}

		return { success: true, review };
	});
}

async function readReviewsByCustomer({
	customerId,
}: {
	customerId: number;
}) {
	try {
		return await prisma.review.findMany({
			where: { customerId },
			include: {
				course: {
					include: {
						coach: true,
						game: true,
					},
				},
				reservation: {
					include: {
						timeSlots: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	} catch (error) {
		console.error("🚨 Error reading reviews:", error);
		return [];
	}
}

async function readReviewsByCourse({
	courseId,
}: {
	courseId: number;
}) {
	try {
		return await prisma.review.findMany({
			where: { courseId },
			include: {
				customer: {
					select: {
						id: true,
						name: true,
						icon: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	} catch (error) {
		console.error("🚨 Error reading reviews:", error);
		return [];
	}
}

async function checkReviewExists({
	reservationId,
}: {
	reservationId: number;
}) {
	try {
		const review = await prisma.review.findUnique({
			where: { reservationId },
		});
		return !!review;
	} catch (error) {
		console.error("🚨 Error checking review:", error);
		return false;
	}
}
