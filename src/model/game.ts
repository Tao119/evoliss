import { prisma } from "@/lib/prisma";
import { calculateScore } from "@/services/calcScore";
import { withCache, CACHE_PREFIX, CACHE_TTL, createCacheInvalidator, generatePaginationCacheKey, deleteCachedData } from "@/lib/cache";

export const gameFuncs: { [funcName: string]: Function } = {
	readGames,
	readAllGames,
	readGamesNum,
	readTopGames,
	readGameById,
	readGamesByQuery,
	invalidateGameCache,
};

// キャッシュ無効化関数
const gameCacheInvalidator = createCacheInvalidator(CACHE_PREFIX.GAME);

async function readGameById({ id }: { id: number }) {
	const cacheKey = `${CACHE_PREFIX.GAME}${id}`;

	return withCache(
		cacheKey,
		async () => {
			return prisma.game.findUnique({
				where: { id },
				include: {
					courses: {
						include: {
							coach: true,
							accesses: true,
						},
					},
				},
			});
		},
		CACHE_TTL.LONG // 1時間キャッシュ
	);
}

async function readAllGames() {
	const cacheKey = `${CACHE_PREFIX.GAME}all`;

	// デバッグ用: キャッシュをバイパス
	if (process.env.BYPASS_CACHE === 'true') {
		console.log('Bypassing cache for readAllGames');
		const data = await prisma.game.findMany({
			include: {
				courses: {
					include: {
						coach: true,
						accesses: true,
					},
				},
			},
		});
		console.log('readAllGames direct DB result:', data.length, 'games found');
		return data;
	}

	return withCache(
		cacheKey,
		async () => {
			// すべてのゲームを取得（coursesの有無に関わらず）
			const data = await prisma.game.findMany({
				include: {
					courses: {
						include: {
							coach: true,
							accesses: true,
						},
					},
				},
			});
			console.log('readAllGames result:', data.length, 'games found');
			return data;
		},
		CACHE_TTL.LONG
	);
}

async function readGames({ page, total }: { page: number; total: number }) {
	const skip = (page - 1) * total;

	const data = await prisma.game.findMany({
		where: {
			courses: {
				some: {},
			},
		},
		skip: skip,
		take: total,
		include: {
			courses: {
				include: {
					coach: true,
					accesses: true,
				},
			},
		},
	});

	return data;
}

async function readGamesNum() {
	const data = await prisma.game.findMany({
		where: {
			courses: {
				some: {},
			},
		},
		include: {
			courses: {
				include: {
					coach: true,
					accesses: true,
				},
			},
		},
	});
	return data.length;
}

export async function readTopGames() {
	const cacheKey = `${CACHE_PREFIX.TOP}games`;

	return withCache(
		cacheKey,
		async () => {
			const games = await prisma.game.findMany({
				where: {
					courses: {
						some: {},
					},
				},
				include: {
					courses: {
						include: {
							coach: true,
							accesses: true,
						},
					},
				},
			});

			const sortedGames = games
				.map((game) => ({
					...game,
					accessCount: game.courses.reduce(
						(sum, c) => sum + (c.accesses?.length || 0),
						0,
					),
				}))
				.sort((a, b) => b.accessCount - a.accessCount)
				.slice(0, 3);

			return sortedGames;
		},
		CACHE_TTL.MEDIUM
	);
}

async function readGamesByQuery({ query }: { query: string }) {
	query = query.toLowerCase();

	const games = await prisma.game.findMany({
		include: {
			courses: {
				include: {
					coach: true,
					accesses: true,
				},
			},
		},
		where: { name: { contains: query } },
		take: 50,
	});

	return games
		.map((game) => ({
			...game,
			// score: calculateScore(game, query),
		}))
		.sort(
			(a, b) =>
				b.courses.reduce((sum, course) => sum + course.accesses.length, 0) -
				a.courses.reduce((sum, course) => sum + course.accesses.length, 0),
		)
		.slice(0, 10);
}

// ゲームキャッシュを無効化（ゲーム情報が更新された時に使用）
async function invalidateGameCache(id?: number) {
	if (id) {
		// 特定のゲームのキャッシュを削除
		await gameCacheInvalidator.invalidateById(id);
	} else {
		// 全てのゲームキャッシュを削除
		await gameCacheInvalidator.invalidateAll();
		// トップゲームのキャッシュも削除
		await deleteCachedData(`${CACHE_PREFIX.TOP}games`);
	}
}
