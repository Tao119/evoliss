import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/cache/redis';
import { CACHE_PREFIX } from '@/lib/cache';

export async function POST(req: Request) {
  try {
    // 開発環境でのみ実行可能にする
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'This endpoint is only available in development' }, { status: 403 });
    }

    const redis = getRedisClient();
    
    // すべてのゲームとタグのキャッシュをクリア
    const gameKeys = await redis.keys(`${CACHE_PREFIX.GAME}*`);
    const tagKeys = await redis.keys(`${CACHE_PREFIX.TAG}*`);
    
    const allKeys = [...gameKeys, ...tagKeys];
    
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleared ${allKeys.length} cache keys`,
      clearedKeys: allKeys
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}