
import { prisma } from "@/lib/prisma";
import { getFormattedDate } from "@/services/formatDate";
import { withTransaction, safeTransaction } from "@/lib/transaction";
import { withCache, CACHE_PREFIX, CACHE_TTL, createCacheInvalidator, generatePaginationCacheKey, deleteCachedData, deleteCachedDataByPattern } from "@/lib/cache";

export const courseFuncs: { [funcName: string]: Function } = {
	readCourses,
	readTopCourses,
	readCourseById,
	createCourse,
	updateCourse,
	updateCoursePublicStatus,
	deleteCourse,
	readCoursesNumByCoachId,
	readCoursesByCoachId,
	readRecommendedCourses,
	readCoursesByQuery,
	readCoursesNumByQuery,
	readCoursesNum,
	invalidateCourseCache,
};

// キャッシュ無効化関数
const courseCacheInvalidator = createCacheInvalidator(CACHE_PREFIX.COURSE);

async function readCourseById({ id }: { id: number }) {
	const cacheKey = `${CACHE_PREFIX.COURSE}${id}`;

	return withCache(
		cacheKey,
		async () => {
			return await prisma.course.findUnique({
				where: { id },
				include: {
					coach: {
						include: {
							courses: {
								include: {
									reviews: true,
									accesses: true,
								},
							},
							timeSlots: {
								select: {
									id: true,
									dateTime: true,
									reservation: true,
								},
								orderBy: {
									dateTime: "asc",
								},
							},
						},
					},
					reviews: {
						select: {
							id: true,
							rating: true,
							comment: true,
							customer: {
								select: { id: true, name: true, icon: true },
							},
							createdAt: true,
						},
					},
					tagCourses: {
						include: {
							tag: true,
						},
					},
					game: true,
					reservations: true,
				},
			});
		},
		CACHE_TTL.MEDIUM // 30分キャッシュ（コース詳細は頻繁にアクセスされる）
	);
}

// コーチの予約可能な時間枠を取得（Course関数として追加）

async function readCourses({ page, total }: { page: number; total: number }) {
	const skip = (page - 1) * total;

	const data = await prisma.course.findMany({
		where: {
			isPublic: true,
		},
		skip: skip,
		take: total,
		include: {
			coach: true,
			reviews: true,
			game: true,
			accesses: true,
			tagCourses: {
				include: {
					tag: true,
				},
			},
		},
		orderBy: {
			accesses: {
				_count: "desc",
			},
		},
	});

	return data;
}

async function readCoursesNum() {
	const count = await prisma.course.count({
		where: {
			isPublic: true,
		},
	});
	return count;
}

async function readTopCourses() {
	const cacheKey = `${CACHE_PREFIX.TOP}courses`;

	return withCache(
		cacheKey,
		async () => {
			return prisma.course.findMany({
				where: {
					isPublic: true,
				},
				include: {
					coach: true,
					reviews: true,
					game: true,
					accesses: true,
				},
				orderBy: {
					accesses: {
						_count: "desc",
					},
				},
				take: 10,
			});
		},
		CACHE_TTL.SHORT // 5分キャッシュ（ランキングは頻繁に変化）
	);
}

async function readCoursesByQuery({
	query,
	gameIds,
	tagIds,
	page,
	total,
	sortMethod = 0,
}: {
	query?: string;
	gameIds?: number[];
	tagIds?: number[];
	page: number;
	total: number;
	sortMethod?: number;
}) {
	const skip = (page - 1) * total;

	const AND: any[] = [];

	// 公開講座のみを取得
	AND.push({ isPublic: true });

	if (query?.trim()) {
		const q = query.trim();
		AND.push({
			OR: [
				{ title: { contains: q } },
				{ description: { contains: q } },
				{ coach: { name: { contains: q } } },
			],
		});
	}
	if (gameIds?.length) {
		AND.push({ gameId: { in: gameIds } });
	}
	if (tagIds?.length) {
		AND.push({
			tagCourses: { some: { tagId: { in: tagIds } } },
		});
	}

	const coursesRaw = await prisma.course.findMany({
		where: AND.length ? { AND } : undefined,
		include: {
			coach: { select: { id: true, name: true, icon: true, bio: true } },
			game: true,
			accesses: true,
			reviews: true,
			reservations: true, // ★ 追加：人気順用
			tagCourses: { include: { tag: true } },
		},
	});

	const decorated = coursesRaw.map((c) => {
		const reservationCount = c.reservations?.length || 0;
		const averageRating = c.reviews.length
			? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length
			: 0;

		return {
			...c,
			reservationCount,
			accessCount: c.accesses?.length || 0,
			reviewCount: c.reviews?.length || 0,
			averageRating,
			relevanceScore: calculateCourseRelevanceScore(c, query, gameIds, tagIds),
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
			if (b.reservationCount !== a.reservationCount) {
				return b.reservationCount - a.reservationCount;
			}
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}

	return sorted.slice(skip, skip + total);
}

async function readCoursesNumByQuery({
	query,
	gameIds,
	tagIds,
}: {
	query?: string;
	gameIds?: number[];
	tagIds?: number[];
}) {
	// 検索条件を構築（readCoursesByQueryと同じロジック）
	const whereConditions: any = {
		AND: [],
	};

	// 公開講座のみを取得
	whereConditions.AND.push({ isPublic: true });

	// フリーワード検索
	if (query && query.trim()) {
		const searchQuery = query.trim();
		whereConditions.AND.push({
			OR: [
				{ title: { contains: searchQuery } },
				{ description: { contains: searchQuery } },
				{ coach: { name: { contains: searchQuery } } },
			],
		});
	}

	// ゲームフィルター
	if (gameIds && gameIds.length > 0) {
		whereConditions.AND.push({
			gameId: { in: gameIds },
		});
	}

	// タグフィルター
	if (tagIds && tagIds.length > 0) {
		whereConditions.AND.push({
			tagCourses: {
				some: {
					tagId: { in: tagIds },
				},
			},
		});
	}

	const count = await prisma.course.count({
		where: whereConditions.AND.length > 0 ? whereConditions : undefined,
	});

	return count;
}

// 関連度スコア計算関数
function calculateCourseRelevanceScore(
	course: any,
	query?: string,
	gameIds?: number[],
	tagIds?: number[],
): number {
	let score = 0;

	if (
		!query &&
		(!gameIds || gameIds.length === 0) &&
		(!tagIds || tagIds.length === 0)
	) {
		return score;
	}

	const searchQuery = query?.toLowerCase().trim() || "";

	// フリーワード検索のスコア
	if (searchQuery) {
		// タイトル完全一致
		if (course.title?.toLowerCase() === searchQuery) {
			score += 100;
		}
		// タイトル部分一致
		else if (course.title?.toLowerCase().includes(searchQuery)) {
			score += 60;
		}

		// 説明文一致
		if (course.description?.toLowerCase().includes(searchQuery)) {
			score += 30;
		}

		// コーチ名一致
		if (course.coach?.name?.toLowerCase().includes(searchQuery)) {
			score += 40;
		}
	}

	// ゲーム一致
	if (gameIds && gameIds.length > 0 && gameIds.includes(course.gameId)) {
		score += 80;
	}

	// タグ一致
	if (tagIds && tagIds.length > 0) {
		const matchingTags =
			course.tagCourses?.filter((tc: any) => tagIds.includes(tc.tagId))
				.length || 0;
		score += matchingTags * 50;
	}

	// 人気度ボーナス
	const accessCount = course.accesses?.length || 0;
	const reviewCount = course.reviews?.length || 0;

	score += Math.min(accessCount * 0.1, 15); // 最大15ポイント
	score += Math.min(reviewCount * 0.5, 10); // 最大10ポイント

	return score;
}

async function readCoursesByCoachId({
	coachId,
	page,
	total,
}: { coachId: number; page: number; total: number }) {
	const skip = (page - 1) * total;
	return await prisma.course.findMany({
		where: {
			coachId,
			isPublic: true,
		},
		include: {
			coach: true,
			reviews: true,
			game: true,
			accesses: true,
			tagCourses: { include: { tag: true } },
		},
		skip: skip,
		take: total,
		orderBy: {
			accesses: {
				_count: "desc",
			},
		},
	});
}

async function readCoursesNumByCoachId({ coachId }: { coachId: number }) {
	const count = await prisma.course.count({
		where: {
			coachId,
			isPublic: true,
		},
	});
	return count;
}

async function readCoursesByGameId({
	gameId,
	page,
	total,
}: { gameId: number; page: number; total: number }) {
	const skip = (page - 1) * total;
	return await prisma.course.findMany({
		where: {
			gameId,
		},
		skip: skip,
		take: total,
		include: {
			coach: true,
			reviews: true,
			game: true,
			accesses: true,
		},
		orderBy: {
			accesses: {
				_count: "desc",
			},
		},
	});
}

async function createCourse({
	title,
	description,
	price,
	duration, // duration を追加
	coachId,
	image,
	gameId, // tag から gameId に変更
	tagIds, // タグIDの配列を追加
}: {
	title: string;
	description: string;
	price: number;
	duration: number; // 講座時間（分）
	coachId: number;
	image?: string;
	gameId: number; // 直接ゲームIDを指定
	tagIds?: number[]; // タグIDの配列
}) {
	const result = await withTransaction(async (tx) => {
		const newCourse = await tx.course.create({
			data: {
				title,
				description,
				price,
				duration,
				coachId,
				image,
				gameId,
			},
		});

		// タグの関連付け
		if (tagIds && tagIds.length > 0) {
			await tx.tagCourse.createMany({
				data: tagIds.map((tagId) => ({
					courseId: newCourse.id,
					tagId,
				})),
			});
		}

		return newCourse;
	});

	// キャッシュの無効化
	if (result) {
		await invalidateCourseCache();
	}

	return result;
}

async function updateCoursePublicStatus({
	id,
	isPublic,
}: {
	id: number;
	isPublic: boolean;
}) {
	const result = await safeTransaction(async (tx) => {
		return tx.course.update({
			where: { id },
			data: { isPublic },
		});
	});

	// キャッシュの無効化
	if (result) {
		await invalidateCourseCache(id);
	}

	return result;
}

async function updateCourse({
	id,
	title,
	description,
	price,
	duration,
	image,
	gameId,
	tagIds,
	isPublic,
}: {
	id: number;
	title?: string;
	description?: string;
	price?: number;
	duration?: number;
	image?: string;
	gameId?: number;
	tagIds?: number[];
	isPublic?: boolean;
}) {
	const result = await safeTransaction(async (tx) => {
		// 更新前のコース情報を取得（コーチID取得のため）
		const originalCourse = await tx.course.findUnique({
			where: { id },
			select: { coachId: true }
		});

		// コースの基本情報を更新
		const updatedCourse = await tx.course.update({
			where: { id },
			data: { title, description, price, duration, image, gameId, isPublic },
		});

		// タグの更新処理
		if (tagIds !== undefined) {
			// 既存のタグ関連を全て削除
			await tx.tagCourse.deleteMany({
				where: { courseId: id },
			});

			// 新しいタグ関連を作成
			if (tagIds.length > 0) {
				await tx.tagCourse.createMany({
					data: tagIds.map((tagId) => ({
						courseId: id,
						tagId,
					})),
				});
			}
		}

		return { updatedCourse, originalCourse };
	});

	// キャッシュの無効化
	if (result) {
		// 特定のコースのキャッシュを削除
		await invalidateCourseCache(id);

		// コーチのキャッシュも削除（coachモジュールのinvalidateCoachCacheをインポートする必要がある）
		if (result.originalCourse?.coachId) {
			await deleteCachedData(`${CACHE_PREFIX.COACH}${result.originalCourse.coachId}`);
		}

		// 検索結果のキャッシュも削除
		await deleteCachedDataByPattern(`${CACHE_PREFIX.SEARCH}*`);

		// トップコースのキャッシュも削除
		await deleteCachedData(`${CACHE_PREFIX.TOP}courses`);
	}

	return result?.updatedCourse;
}

async function readRecommendedCourses({
	userId,
	courseId,
}: { userId: number; courseId: number }) {
	try {
		const userSearchHistory = await prisma.searchHistory.findMany({
			where: { userId },
			select: { query: true },
		});

		const searchKeywords = userSearchHistory.map((history) =>
			history.query.toLowerCase(),
		);
		const courses = await prisma.course.findMany({
			where: {
				NOT: {
					id: courseId,
				},
				isPublic: true,
			},
			include: {
				coach: {
					select: { id: true, name: true, icon: true },
				},
				reviews: {
					select: { rating: true },
				},
				game: {
					select: { name: true },
				},
				accesses: {
					select: { createdAt: true },
					where: {
						createdAt: {
							gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
						},
					},
				},
				tagCourses: {
					include: {
						tag: true,
					},
				},
			},
		});

		const maxAccessCount = Math.max(
			...courses.map((c) => c.accesses.length),
			1,
		);
		const scoredCourses = courses.map((course) => {
			let searchScore = 0;
			if (searchKeywords.length > 0) {
				const matchCount = searchKeywords.filter(
					(keyword) =>
						course.title.toLowerCase().includes(keyword) ||
						(course.game?.name &&
							course.game?.name.toLowerCase().includes(keyword)),
				).length;
				searchScore = (matchCount / searchKeywords.length) * 100;
			}

			const avgRating =
				course.reviews.length > 0
					? course.reviews.reduce((sum, r) => sum + r.rating, 0) /
					course.reviews.length
					: 0;
			const ratingScore = (avgRating / 5) * 100;

			const accessScore = (course.accesses.length / maxAccessCount) * 100;

			const totalScore =
				searchScore * 0.5 + ratingScore * 0.3 + accessScore * 0.2;

			return { course, totalScore };
		});

		return scoredCourses
			.sort((a, b) => b.totalScore - a.totalScore)
			.slice(0, 5)
			.map((c) => c.course);
	} catch (error) {
		console.error("Error recommend course:", error);
	}
}

// コースキャッシュを無効化
async function invalidateCourseCache(id?: number) {
	if (id) {
		// 特定のコースのキャッシュを削除
		await courseCacheInvalidator.invalidateById(id);
	} else {
		// 全てのコースキャッシュを削除
		await courseCacheInvalidator.invalidateAll();
		// トップコースのキャッシュも削除
		await deleteCachedData(`${CACHE_PREFIX.TOP}courses`);
		// 検索結果のキャッシュも削除
		await deleteCachedDataByPattern(`${CACHE_PREFIX.SEARCH}*`);
	}
}

// コースを削除
async function deleteCourse({ id }: { id: number }) {
	const result = await safeTransaction(async (tx) => {
		// 削除前のコース情報を取得（コーチID取得のため）
		const courseToDelete = await tx.course.findUnique({
			where: { id },
			select: { coachId: true }
		});

		// 関連データを削除（カスケード削除が設定されていない場合）
		// TagCourseはカスケード削除が設定されているので自動削除
		// Reservation, Review, Accessなどもカスケード削除が設定されている場合は自動削除

		// コースを削除
		const deletedCourse = await tx.course.delete({
			where: { id },
		});

		return { deletedCourse, courseToDelete };
	});

	// キャッシュの無効化
	if (result) {
		// 特定のコースのキャッシュを削除
		await invalidateCourseCache(id);

		// コーチのキャッシュも削除
		if (result.courseToDelete?.coachId) {
			await deleteCachedData(`${CACHE_PREFIX.COACH}${result.courseToDelete.coachId}`);
		}

		// 検索結果のキャッシュも削除
		await deleteCachedDataByPattern(`${CACHE_PREFIX.SEARCH}*`);

		// トップコースのキャッシュも削除
		await deleteCachedData(`${CACHE_PREFIX.TOP}courses`);
	}

	return result?.deletedCourse;
}
