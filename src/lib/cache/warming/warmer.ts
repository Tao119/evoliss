import { getRedisClient, CACHE_TTL, CACHE_PREFIX } from '../redis';
import { setCachedData } from '../utils';
import { prisma } from '@/lib/prisma';
import type { Course } from '@prisma/client';
import { readTopGames } from '@/model/game';
import { courseFuncs } from '@/model/course';
const { readTopCourses } = courseFuncs;
import { coachFuncs } from '@/model/coach';
const { readTopCoaches } = coachFuncs;
import { tagFuncs } from '@/model/tag';
const { readTags } = tagFuncs;

interface WarmingResult {
  success: boolean;
  warmedKeys: string[];
  failedKeys: string[];
  duration: number;
}

interface WarmingConfig {
  enabled: boolean;
  onStartup: boolean;
  schedule?: string; // cron形式
  items: Array<{
    name: string;
    key: string;
    ttl: number;
    fetchFn: () => Promise<any>;
    priority: number; // 1-10, 10が最高優先度
  }>;
}

// キャッシュウォーミング設定
const WARMING_CONFIG: WarmingConfig = {
  enabled: process.env.CACHE_WARMING_ENABLED !== 'false',
  onStartup: true,
  schedule: process.env.CACHE_WARMING_SCHEDULE || '0 */6 * * *', // デフォルト: 6時間ごと
  items: [
    {
      name: 'Tags',
      key: `${CACHE_PREFIX.TAG}all`,
      ttl: CACHE_TTL.VERY_LONG,
      fetchFn: () => readTags(),
      priority: 10,
    },
    {
      name: 'Top Games',
      key: `${CACHE_PREFIX.TOP}games`,
      ttl: CACHE_TTL.MEDIUM,
      fetchFn: () => readTopGames(),
      priority: 9,
    },
    {
      name: 'Top Courses',
      key: `${CACHE_PREFIX.TOP}courses`,
      ttl: CACHE_TTL.SHORT,
      fetchFn: () => readTopCourses(),
      priority: 8,
    },
    {
      name: 'Top Coaches',
      key: `${CACHE_PREFIX.TOP}coaches`,
      ttl: CACHE_TTL.MEDIUM,
      fetchFn: () => readTopCoaches(),
      priority: 8,
    },
  ],
};

class CacheWarmer {
  private isWarming = false;
  private lastWarmingTime: Date | null = null;
  private warmingHistory: WarmingResult[] = [];

  async warmCache(selectedItems?: string[]): Promise<WarmingResult> {
    if (this.isWarming) {
      console.log('Cache warming already in progress');
      return {
        success: false,
        warmedKeys: [],
        failedKeys: [],
        duration: 0,
      };
    }

    this.isWarming = true;
    const startTime = Date.now();
    const warmedKeys: string[] = [];
    const failedKeys: string[] = [];

    try {
      console.log('Starting cache warming...');

      // 優先度順にソート
      const itemsToWarm = WARMING_CONFIG.items
        .filter(item => !selectedItems || selectedItems.includes(item.name))
        .sort((a, b) => b.priority - a.priority);

      // 並列処理のバッチサイズ
      const BATCH_SIZE = 3;

      for (let i = 0; i < itemsToWarm.length; i += BATCH_SIZE) {
        const batch = itemsToWarm.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (item) => {
            try {
              console.log(`Warming cache for ${item.name}...`);
              const data = await item.fetchFn();
              await setCachedData(item.key, data, item.ttl);
              warmedKeys.push(item.key);
              console.log(`✓ Warmed cache for ${item.name}`);
            } catch (error) {
              console.error(`✗ Failed to warm cache for ${item.name}:`, error);
              failedKeys.push(item.key);
            }
          })
        );
      }

      // 人気コースの詳細をウォーミング（動的）
      try {
        const topCourses = await readTopCourses();
        if (topCourses && topCourses.length > 0) {
          const courseWarmingPromises = topCourses.slice(0, 5).map(async (course: any) => {
            const key = `${CACHE_PREFIX.COURSE}${course.id}`;
            try {
              const courseData = await prisma.course.findUnique({
                where: { id: course.id },
                include: {
                  coach: true,
                  tagCourses: {
                    include: {
                      tag: true,
                    },
                  },
                  game: true,
                },
              });
              if (courseData) {
                await setCachedData(key, courseData, CACHE_TTL.MEDIUM);
                warmedKeys.push(key);
              }
            } catch (error) {
              console.error(`Failed to warm course ${course.id}:`, error);
              failedKeys.push(key);
            }
          });

          await Promise.all(courseWarmingPromises);
        }
      } catch (error) {
        console.error('Failed to warm popular courses:', error);
      }

      const duration = Date.now() - startTime;
      const result: WarmingResult = {
        success: failedKeys.length === 0,
        warmedKeys,
        failedKeys,
        duration,
      };

      this.lastWarmingTime = new Date();
      this.warmingHistory.unshift(result);

      // 最新10件の履歴のみ保持
      if (this.warmingHistory.length > 10) {
        this.warmingHistory = this.warmingHistory.slice(0, 10);
      }

      console.log(`Cache warming completed in ${duration}ms`);
      console.log(`Warmed: ${warmedKeys.length} keys, Failed: ${failedKeys.length} keys`);

      return result;
    } finally {
      this.isWarming = false;
    }
  }

  async warmSpecificKeys(keys: string[]): Promise<WarmingResult> {
    const startTime = Date.now();
    const warmedKeys: string[] = [];
    const failedKeys: string[] = [];

    for (const key of keys) {
      try {
        const client = getRedisClient();
        const exists = await client.exists(key);

        if (!exists) {
          // キーが存在しない場合、設定から対応する取得関数を探す
          const config = WARMING_CONFIG.items.find(item => item.key === key);
          if (config) {
            const data = await config.fetchFn();
            await setCachedData(key, data, config.ttl);
            warmedKeys.push(key);
          } else {
            failedKeys.push(key);
          }
        } else {
          // 既存のキーのTTLをリフレッシュ
          const ttl = await client.ttl(key);
          if (ttl > 0 && ttl < 3600) { // 1時間未満の場合のみリフレッシュ
            const value = await client.get(key);
            if (value) {
              await client.expire(key, Math.max(ttl, 3600));
              warmedKeys.push(key);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to warm key ${key}:`, error);
        failedKeys.push(key);
      }
    }

    const duration = Date.now() - startTime;
    return {
      success: failedKeys.length === 0,
      warmedKeys,
      failedKeys,
      duration,
    };
  }

  getStatus() {
    return {
      isWarming: this.isWarming,
      lastWarmingTime: this.lastWarmingTime,
      history: this.warmingHistory,
      config: {
        enabled: WARMING_CONFIG.enabled,
        onStartup: WARMING_CONFIG.onStartup,
        schedule: WARMING_CONFIG.schedule,
        itemCount: WARMING_CONFIG.items.length,
      },
    };
  }

  getConfig() {
    return WARMING_CONFIG.items.map(item => ({
      name: item.name,
      key: item.key,
      ttl: item.ttl,
      priority: item.priority,
    }));
  }
}

// シングルトンインスタンス
export const cacheWarmer = new CacheWarmer();

// 起動時のキャッシュウォーミング
export async function warmCacheOnStartup() {
  if (!WARMING_CONFIG.enabled || !WARMING_CONFIG.onStartup) {
    console.log('Cache warming on startup is disabled');
    return;
  }

  console.log('Performing cache warming on startup...');
  await cacheWarmer.warmCache();
}

// 定期的なキャッシュウォーミング（cronジョブ用）
export async function scheduledCacheWarming() {
  if (!WARMING_CONFIG.enabled) {
    return;
  }

  console.log('Performing scheduled cache warming...');
  await cacheWarmer.warmCache();
}
