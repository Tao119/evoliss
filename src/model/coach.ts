import { prisma } from "@/lib/prisma";
import { getFormattedDate } from "@/services/formatDate";
import { withTransaction, safeTransaction } from "@/lib/transaction";
import { withCache, CACHE_PREFIX, CACHE_TTL, createCacheInvalidator, deleteCachedData } from "@/lib/cache";

export const coachFuncs: { [funcName: string]: Function } = {
	readCoachById,
	readCoachesNumByQuery,
	readTopCoaches,
	readCoachesByQuery,
	readAvailableTimeSlots,
	readTimeSlotsByCoachId,
	createTimeSlots,
	updateTimeSlots,
	updateTimeSlotsMonthly,
	deleteTimeSlot,
	readTimeSlotById,
	readMonthlyStats,
	invalidateCoachCache,
};

// キャッシュ無効化関数
const coachCacheInvalidator = createCacheInvalidator(CACHE_PREFIX.COACH);

async function readCoachById({ id }: { id: number }) {
	return prisma.user.findUnique({
		where: { id },
		include: {
			courses: {
				select: {
					reviews: {
						select: {
							rating: true,
						},
					},
				},
			},
			game: true,
			timeSlots: {
				orderBy: {
					dateTime: "asc",
				},
			},
		},
	});
}

async function readTopCoaches() {
	const cacheKey = `${CACHE_PREFIX.TOP}coaches`;

	return withCache(
		cacheKey,
		async () => {
			const coaches = await prisma.user.findMany({
				where: {
					courses: {
						some: {},
					},
				},
				include: {
					courses: {
						include: {
							reviews: true,
							accesses: true,
						},
					},
				},
			});
			const sortedCoaches = coaches
				.map((coach) => ({
					...coach,
					accessCount: coach.courses.reduce(
						(sum, course) => sum + (course.accesses?.length || 0),
						0,
					),
				}))
				.sort((a, b) => b.accessCount - a.accessCount)
				.slice(0, 6);

			return sortedCoaches;
		},
		CACHE_TTL.MEDIUM // 30分キャッシュ
	);
}

async function readCoachesByQuery({
	query,
	page,
	total,
	sortMethod = 0,
}: {
	query?: string;
	page: number;
	total: number;
	sortMethod?: number;
}) {
	const skip = (page - 1) * total;

	const AND: any[] = [{ courses: { some: {} } }];
	if (query?.trim()) {
		const q = query.trim();
		AND.push({
			OR: [{ name: { contains: q } }, { bio: { contains: q } }],
		});
	}

	const coachesRaw = await prisma.user.findMany({
		where: { AND },
		include: {
			courses: {
				include: {
					reservations: true,
					reviews: true,
					accesses: true,
				},
			},
			game: true
		},
	});

	const decorated = coachesRaw.map((c) => {
		const totalReservations = c.courses.reduce(
			(sum, course) => sum + (course.reservations?.length || 0),
			0,
		);
		const averageRating = c.courses.length
			? c.courses.reduce((sum, course) => {
				const avg = course.reviews.length
					? course.reviews.reduce((s, r) => s + r.rating, 0) /
					course.reviews.length
					: 0;
				return sum + avg;
			}, 0) / c.courses.length
			: 0;

		return {
			...c,
			totalReservations,
			accessCount: c.courses.reduce(
				(sum, course) => sum + (course.accesses?.length || 0),
				0,
			),
			reviewCount: c.courses.reduce(
				(sum, course) => sum + (course.reviews?.length || 0),
				0,
			),
			averageRating,
			relevanceScore: calculateRelevanceScore(c, query),
		};
	});

	let sorted: typeof decorated;
	if (sortMethod == 1) {
		sorted = decorated.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);
	} else {
		sorted = decorated.sort((a, b) => {
			if (b.totalReservations !== a.totalReservations) {
				return b.totalReservations - a.totalReservations;
			}
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}

	return sorted.slice(skip, skip + total);
}

async function readCoachesNumByQuery({
	query,
}: {
	query?: string;
}) {
	const whereConditions: any = {
		AND: [{ courses: { some: {} } }],
	};

	if (query && query.trim()) {
		const searchQuery = query.trim();
		whereConditions.AND.push({
			OR: [
				{ name: { contains: searchQuery } },
				{ bio: { contains: searchQuery } },
			],
		});
	}

	const count = await prisma.user.count({
		where: whereConditions,
	});

	return count;
}

function calculateRelevanceScore(coach: any, query?: string): number {
	let score = 0;

	if (!query) return score;

	const searchQuery = query.toLowerCase().trim();

	if (coach.name?.toLowerCase() === searchQuery) {
		score += 100;
	} else if (coach.name?.toLowerCase().includes(searchQuery)) {
		score += 50;
	}

	if (coach.bio?.toLowerCase().includes(searchQuery)) {
		score += 20;
	}

	const accessCount =
		coach.courses?.reduce(
			(sum: number, course: any) => sum + (course.accesses?.length || 0),
			0,
		) || 0;
	const reviewCount =
		coach.courses?.reduce(
			(sum: number, course: any) => sum + (course.reviews?.length || 0),
			0,
		) || 0;

	score += Math.min(accessCount * 0.1, 10);
	score += Math.min(reviewCount * 0.5, 15);

	return score;
}

async function readAvailableTimeSlots({ coachId }: { coachId: number }) {
	const currentDateTime = getFormattedDate(new Date(), "YYYY-MM-dd HH:mm");

	return await prisma.timeSlot.findMany({
		where: {
			coachId,
			// dateTime: {
			//     gte: currentDateTime
			// },
			// reservation: null
		},
		select: {
			id: true,
			coachId: true,
			dateTime: true,
			reservation: true,
			createdAt: true,
			updatedAt: true,
		},
		orderBy: {
			dateTime: "asc",
		},
	});
}

async function readTimeSlotsByCoachId({
	coachId,
	startDate,
	endDate,
}: {
	coachId: number;
	startDate?: string;
	endDate?: string;
}) {
	const whereCondition: any = {
		coachId,
	};

	if (startDate && endDate) {
		whereCondition.dateTime = {
			gte: `${startDate} 00:00`,
			lte: `${endDate} 23:59`,
		};
	} else if (startDate) {
		whereCondition.dateTime = {
			gte: `${startDate} 00:00`,
		};
	}

	return await prisma.timeSlot.findMany({
		where: whereCondition,
		include: {
			reservation: {
				include: {
					course: {
						select: {
							title: true,
							duration: true,
						},
					},
					customer: {
						select: {
							name: true,
							icon: true,
						},
					},
				},
			},
		},
		orderBy: {
			dateTime: "asc",
		},
	});
}

async function createTimeSlots({
	coachId,
	timeSlots,
}: {
	coachId: number;
	timeSlots: string[];
}) {
	const result = await withTransaction(async (tx) => {
		const existingSlots = await tx.timeSlot.findMany({
			where: {
				coachId,
				dateTime: {
					in: timeSlots,
				},
			},
			select: {
				dateTime: true,
			},
		});

		const existingDateTimes = existingSlots.map((slot) => slot.dateTime);
		const newTimeSlots = timeSlots.filter(
			(dateTime) => !existingDateTimes.includes(dateTime),
		);

		if (newTimeSlots.length === 0) {
			return { created: 0, skipped: timeSlots.length, coachId };
		}

		const createResult = await tx.timeSlot.createMany({
			data: newTimeSlots.map((dateTime) => ({
				coachId,
				dateTime,
			})),
			skipDuplicates: true,
		});

		return {
			created: createResult.count,
			skipped: timeSlots.length - createResult.count,
			coachId
		};
	});

	// キャッシュの無効化
	if (result && result.created > 0) {
		// コーチキャッシュを無効化
		await invalidateCoachCache(result.coachId);
	}

	return result;
}

async function updateTimeSlots({
	coachId,
	timeSlots,
}: {
	coachId: number;
	timeSlots: string[];
}) {
	const result = await withTransaction(async (tx) => {
		// 指定された日付範囲の既存のタイムスロットを削除（予約済みを除く）
		const dates = [...new Set(timeSlots.map(ts => ts.split(' ')[0]))];
		
		if (dates.length > 0) {
			const startDate = dates[0] + ' 00:00:00';
			const endDate = dates[dates.length - 1] + ' 23:59:59';
			
			// 予約のないタイムスロットのみ削除
			await tx.timeSlot.deleteMany({
				where: {
					coachId,
					dateTime: {
						gte: startDate,
						lte: endDate,
					},
					reservationId: null,
				},
			});
		}
		
		// 新しいタイムスロットを作成
		if (timeSlots.length > 0) {
			const createResult = await tx.timeSlot.createMany({
				data: timeSlots.map((dateTime) => ({
					coachId,
					dateTime,
				})),
				skipDuplicates: true,
			});
			
			return {
				created: createResult.count,
				coachId,
			};
		}
		
		return {
			created: 0,
			coachId,
		};
	});

	// キャッシュの無効化
	if (result && result.created >= 0) {
		// コーチキャッシュを無効化
		await invalidateCoachCache(result.coachId);
	}

	return result;
}

async function updateTimeSlotsMonthly({
	coachId,
	timeSlots,
	deleteSlotIds,
	month,
}: {
	coachId: number;
	timeSlots: string[];
	deleteSlotIds: number[];
	month: string;
}) {
	const result = await withTransaction(async (tx) => {
		// 削除対象のスロットを削除（予約がないもののみ）
		if (deleteSlotIds.length > 0) {
			await tx.timeSlot.deleteMany({
				where: {
					id: {
						in: deleteSlotIds,
					},
					coachId,
					reservationId: null,
				},
			});
		}
		
		// 新しいタイムスロットを作成
		let created = 0;
		if (timeSlots.length > 0) {
			// 既存のスロットと重複しないようにフィルタリング
			const existingSlots = await tx.timeSlot.findMany({
				where: {
					coachId,
					dateTime: {
						in: timeSlots,
					},
				},
				select: {
					dateTime: true,
				},
			});

			const existingDateTimes = existingSlots.map((slot) => slot.dateTime);
			const newTimeSlots = timeSlots.filter(
				(dateTime) => !existingDateTimes.includes(dateTime),
			);

			if (newTimeSlots.length > 0) {
				const createResult = await tx.timeSlot.createMany({
					data: newTimeSlots.map((dateTime) => ({
						coachId,
						dateTime,
					})),
					skipDuplicates: true,
				});
				created = createResult.count;
			}
		}
		
		return {
			created,
			deleted: deleteSlotIds.length,
			coachId,
		};
	});

	// キャッシュの無効化
	if (result) {
		// コーチキャッシュを無効化
		await invalidateCoachCache(result.coachId);
	}

	return result;
}

async function deleteTimeSlot({ id }: { id: number }) {
	const result = await safeTransaction(async (tx) => {
		const timeSlot = await tx.timeSlot.findUnique({
			where: { id },
			include: {
				reservation: true,
			},
		});

		if (!timeSlot) {
			throw new Error("時間枠が見つかりません");
		}

		if (timeSlot.reservation) {
			throw new Error("予約がある時間枠は削除できません");
		}

		const deletedSlot = await tx.timeSlot.delete({
			where: { id },
		});

		return { deletedSlot, coachId: timeSlot.coachId };
	});

	// キャッシュの無効化
	if (result && result.coachId) {
		// コーチキャッシュを無効化
		await invalidateCoachCache(result.coachId);
	}

	return result?.deletedSlot;
}

async function readTimeSlotById({ id }: { id: number }) {
	return await prisma.timeSlot.findUnique({
		where: { id },
		include: {
			coach: {
				select: {
					id: true,
					name: true,
					icon: true,
				},
			},
			reservation: {
				include: {
					course: {
						select: {
							title: true,
							duration: true,
							price: true,
						},
					},
					customer: {
						select: {
							id: true,
							name: true,
							icon: true,
						},
					},
				},
			},
		},
	});
}

async function readMonthlyStats({
	coachId,
	year,
	month,
}: {
	coachId: number;
	year: number;
	month: number;
}) {
	const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
	const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

	const timeSlots = await prisma.timeSlot.findMany({
		where: {
			coachId,
			dateTime: {
				gte: `${startDate} 00:00`,
				lte: `${endDate} 23:59`,
			},
		},
		include: {
			reservation: {
				include: {
					payment: true,
				},
			},
		},
	});

	const totalSlots = timeSlots.length;
	const bookedSlots = timeSlots.filter((slot) => slot.reservation).length;
	const availableSlots = totalSlots - bookedSlots;
	const totalRevenue = timeSlots.reduce(
		(sum, slot) => sum + (slot.reservation?.payment?.amount || 0),
		0,
	);

	return {
		totalSlots,
		bookedSlots,
		availableSlots,
		bookingRate: totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0,
		totalRevenue,
	};
}

// コーチキャッシュを無効化
async function invalidateCoachCache(id?: number) {
	if (id) {
		// 特定のコーチのキャッシュを削除
		await coachCacheInvalidator.invalidateById(id);
	} else {
		// 全てのコーチキャッシュを削除
		await coachCacheInvalidator.invalidateAll();
		// トップコーチのキャッシュも削除
		await deleteCachedData(`${CACHE_PREFIX.TOP}coaches`);
	}
}
