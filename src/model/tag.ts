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
	
	return withCache(
		cacheKey,
		async () => {
			console.log(prisma.tag);
			const data = await prisma.tag.findMany({});
			return data;
		},
		CACHE_TTL.VERY_LONG // タグは変更頻度が低いので24時間キャッシュ
	);
}

// タグキャッシュを無効化（タグが更新された時に使用）
async function invalidateTagCache() {
	await tagCacheInvalidator.invalidateAll();
}
