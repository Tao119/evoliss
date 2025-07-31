import { prisma } from "@/lib/prisma";
import { withCache, CACHE_PREFIX, CACHE_TTL, createCacheInvalidator } from "@/lib/cache";

export const tagFuncs: { [funcName: string]: Function } = {
	readTags,
	invalidateTagCache,
};

// キャッシュ無効化関数
const tagCacheInvalidator = createCacheInvalidator(CACHE_PREFIX.TAG);

async function readTags() {
	const cacheKey = `${CACHE_PREFIX.TAG}all`;
	
	// デバッグ用: キャッシュをバイパス
	if (process.env.BYPASS_CACHE === 'true') {
		console.log('Bypassing cache for readTags');
		const data = await prisma.tag.findMany({});
		console.log('readTags direct DB result:', data.length, 'tags found');
		console.log('Tags:', data);
		return data;
	}
	
	return withCache(
		cacheKey,
		async () => {
			console.log('Fetching tags from database...');
			const data = await prisma.tag.findMany({});
			console.log('readTags result:', data.length, 'tags found');
			console.log('Tags:', data);
			return data;
		},
		CACHE_TTL.VERY_LONG // タグは変更頻度が低いので24時間キャッシュ
	);
}

// タグキャッシュを無効化（タグが更新された時に使用）
async function invalidateTagCache() {
	await tagCacheInvalidator.invalidateAll();
}
