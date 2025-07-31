import { getRedisClient, CACHE_TTL, CACHE_PREFIX } from './redis';
import { cacheMonitor } from './monitoring/stats';

export interface CacheOptions {
  ttl?: number;
  key?: string;
}

/**
 * キャッシュから値を取得
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  // 環境変数でキャッシュを完全に無効化
  if (process.env.DISABLE_CACHE === 'true') {
    return null;
  }

  try {
    const client = getRedisClient();
    const data = await client.get(key);
    
    if (!data) {
      cacheMonitor.recordMiss(key);
      return null;
    }
    
    cacheMonitor.recordHit(key);
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    cacheMonitor.recordError(key);
    return null;
  }
}

/**
 * キャッシュに値を設定
 */
export async function setCachedData<T>(
  key: string, 
  data: T, 
  ttl: number = CACHE_TTL.MEDIUM
): Promise<void> {
  // 環境変数でキャッシュを完全に無効化
  if (process.env.DISABLE_CACHE === 'true') {
    return;
  }

  try {
    const client = getRedisClient();
    await client.setex(key, ttl, JSON.stringify(data));
    cacheMonitor.recordSet(key, ttl);
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    cacheMonitor.recordError(key);
    // キャッシュエラーは無視して処理を続行
  }
}

/**
 * キャッシュを削除
 */
export async function deleteCachedData(key: string | string[]): Promise<void> {
  // 環境変数でキャッシュを完全に無効化
  if (process.env.DISABLE_CACHE === 'true') {
    return;
  }

  try {
    const client = getRedisClient();
    if (Array.isArray(key)) {
      if (key.length > 0) {
        await client.del(...key);
        key.forEach(k => cacheMonitor.recordDelete(k));
      }
    } else {
      await client.del(key);
      cacheMonitor.recordDelete(key);
    }
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
    if (Array.isArray(key)) {
      key.forEach(k => cacheMonitor.recordError(k));
    } else {
      cacheMonitor.recordError(key);
    }
  }
}

/**
 * パターンに一致するキャッシュを削除
 */
export async function deleteCachedDataByPattern(pattern: string): Promise<void> {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error(`Cache delete by pattern error for ${pattern}:`, error);
  }
}

/**
 * キャッシュラッパー関数
 * データ取得関数をラップして、自動的にキャッシュを管理
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // 環境変数でキャッシュを完全に無効化
  if (process.env.DISABLE_CACHE === 'true') {
    return await fetchFn();
  }

  // キャッシュから取得を試みる
  const cached = await getCachedData<T>(key);
  if (cached !== null) {
    return cached;
  }

  // キャッシュがない場合はデータを取得
  const data = await fetchFn();
  
  // 取得したデータをキャッシュに保存
  await setCachedData(key, data, ttl);
  
  return data;
}

/**
 * キャッシュの無効化関数を生成
 */
export function createCacheInvalidator(prefix: string) {
  return {
    // 特定のIDのキャッシュを削除
    invalidateById: async (id: number | string) => {
      await deleteCachedData(`${prefix}${id}`);
    },
    
    // プレフィックスに一致する全てのキャッシュを削除
    invalidateAll: async () => {
      await deleteCachedDataByPattern(`${prefix}*`);
    },
    
    // 複数のIDのキャッシュを削除
    invalidateByIds: async (ids: (number | string)[]) => {
      const keys = ids.map(id => `${prefix}${id}`);
      await deleteCachedData(keys);
    }
  };
}

/**
 * ページネーション付きキャッシュキーの生成
 */
export function generatePaginationCacheKey(
  prefix: string,
  page: number,
  total: number,
  params?: Record<string, any>
): string {
  let key = `${prefix}page:${page}:total:${total}`;
  
  if (params) {
    const sortedParams = Object.keys(params)
      .sort()
      .filter(k => params[k] !== undefined && params[k] !== null)
      .map(k => `${k}:${params[k]}`)
      .join(':');
    
    if (sortedParams) {
      key += `:${sortedParams}`;
    }
  }
  
  return key;
}
