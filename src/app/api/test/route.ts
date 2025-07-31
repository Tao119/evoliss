import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/cache/redis';
import { CACHE_PREFIX } from '@/lib/cache';

export async function GET() {
  try {
    // 1. データベースから直接読み取る
    const gamesFromDB = await prisma.game.findMany({});
    const tagsFromDB = await prisma.tag.findMany({});
    
    console.log('Direct DB - Games:', gamesFromDB);
    console.log('Direct DB - Tags:', tagsFromDB);

    // 2. Redisの接続状態を確認
    let redisStatus = 'disconnected';
    let cachedGames = null;
    let cachedTags = null;
    
    try {
      const redis = getRedisClient();
      const ping = await redis.ping();
      redisStatus = ping === 'PONG' ? 'connected' : 'error';
      
      // キャッシュから読み取り
      const gamesCacheKey = `${CACHE_PREFIX.GAME}all`;
      const tagsCacheKey = `${CACHE_PREFIX.TAG}all`;
      
      const cachedGamesStr = await redis.get(gamesCacheKey);
      const cachedTagsStr = await redis.get(tagsCacheKey);
      
      if (cachedGamesStr) {
        cachedGames = JSON.parse(cachedGamesStr);
      }
      if (cachedTagsStr) {
        cachedTags = JSON.parse(cachedTagsStr);
      }
    } catch (redisError) {
      console.error('Redis error:', redisError);
      redisStatus = `error: ${redisError}`;
    }

    // 3. APIを通じて取得
    const { requestDB } = await import('@/services/axios');
    let apiGames = null;
    let apiTags = null;
    
    try {
      const gamesResponse = await requestDB("game", "readAllGames");
      apiGames = gamesResponse;
      
      const tagsResponse = await requestDB("tag", "readTags");
      apiTags = tagsResponse;
    } catch (apiError) {
      console.error('API error:', apiError);
    }

    return NextResponse.json({
      database: {
        games: { count: gamesFromDB.length, data: gamesFromDB },
        tags: { count: tagsFromDB.length, data: tagsFromDB }
      },
      redis: {
        status: redisStatus,
        cachedGames: cachedGames ? { count: cachedGames.length, data: cachedGames } : null,
        cachedTags: cachedTags ? { count: cachedTags.length, data: cachedTags } : null
      },
      api: {
        games: apiGames,
        tags: apiTags
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Failed to run test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}