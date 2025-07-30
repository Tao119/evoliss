import { getRedisClient, closeRedisClient } from '@/lib/cache';

// Next.jsサーバーの初期化時にRedis接続を確立
export async function initializeRedis() {
  try {
    const client = getRedisClient();
    // 接続確認
    await client.ping();
    console.log('✅ Redis initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
    // Redisの接続エラーがあってもアプリケーションは継続
  }
}

// アプリケーション終了時のクリーンアップ
export async function cleanupRedis() {
  try {
    await closeRedisClient();
    console.log('✅ Redis connection closed');
  } catch (error) {
    console.error('❌ Failed to close Redis connection:', error);
  }
}

// グレースフルシャットダウンの設定
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing Redis connection...');
    await cleanupRedis();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing Redis connection...');
    await cleanupRedis();
    process.exit(0);
  });
}
