import { prisma } from "@/lib/prisma";
import { getFormattedDate } from "@/services/formatDate";
import { withTransaction, safeTransaction } from "@/lib/transaction";

export const courseFuncs: { [funcName: string]: Function } = {
	readCourses,
	readTopCourses,
	readCourseById,
	createCourse,
	updateCourse,
	readCoursesNumByCoachId,
	readCoursesByCoachId,
	readRecommendedCourses,
	readCoursesByQuery,
	readCoursesNumByQuery,
	readCoursesNum,
};

async function readCourseById({ id }: { id: number }) {
	return await prisma.course.findUnique({
		where: { id },
		include: {
			coach: {
				select: {
					id: true,
					name: true,
					bio: true,
					icon: true,
					game: true,
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
}

// コーチの予約可能な時間枠を取得（Course関数として追加）

async function readCourses({ page, total }: { page: number; total: number }) {
	const skip = (page - 1) * total;

	const data = await prisma.course.findMany({
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
	const count = await prisma.course.count({});
	return count;
}

async function readTopCourses() {
	return prisma.course.findMany({
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
		where: { coachId },
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
		where: { coachId },
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
	return withTransaction(async (tx) => {
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
}

async function updateCourse({
	id,
	title,
	description,
	price,
	duration,
	image,
	gameId,
}: {
	id: number;
	title?: string;
	description?: string;
	price?: number;
	duration?: number;
	image?: string;
	gameId?: number;
}) {
	return safeTransaction(async (tx) => {
		return tx.course.update({
			where: { id },
			data: { title, description, price, duration, image, gameId },
		});
	});
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
							course.game.name.toLowerCase().includes(keyword)),
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
