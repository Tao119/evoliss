import { Redis, Cluster } from 'ioredis';
import { getRedisConfig, createRedisClient, checkRedisHealth } from './config';

// Redisクライアントのシングルトンインスタンス
let redisClient: Redis | Cluster | null = null;

// Redis接続の初期化
export function getRedisClient(): Redis | Cluster {
  if (!redisClient) {
    const config = getRedisConfig();
    redisClient = createRedisClient(config);

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log(`Redis Client Connected (${config.mode} mode)`);
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });

    // Sentinel固有のイベント
    if (config.mode === 'sentinel') {
      redisClient.on('+switch-master', (master: any) => {
        console.log('Redis Sentinel: Master switched', master);
      });
    }

    // 定期的なヘルスチェック（本番環境向け）
    if (process.env.NODE_ENV === 'production') {
      setInterval(async () => {
        const health = await checkRedisHealth(redisClient!);
        if (!health.healthy) {
          console.error('Redis health check failed:', health.error);
        }
      }, 60000); // 1分ごと
    }
  }

  return redisClient;
}

// Redisクライアントを閉じる
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// キャッシュのTTL設定（秒）
export const CACHE_TTL = {
  SHORT: 300,      // 5分 - 頻繁に変更される可能性があるデータ
  MEDIUM: 1800,    // 30分 - 中程度の変更頻度のデータ
  LONG: 3600,      // 1時間 - あまり変更されないデータ
  VERY_LONG: 86400, // 24時間 - ほとんど変更されないデータ
} as const;

// キャッシュキーのプレフィックス
export const CACHE_PREFIX = {
  TAG: 'tag:',
  GAME: 'game:',
  COURSE: 'course:',
  USER: 'user:',
  COACH: 'coach:',
  SEARCH: 'search:',
  TOP: 'top:',
  MESSAGE: 'message:',
} as const;
