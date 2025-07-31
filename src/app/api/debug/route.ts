import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // 開発環境でのみ実行可能にする
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'This endpoint is only available in development' }, { status: 403 });
    }

    // 直接データベースから読み取る（キャッシュを使わない）
    const games = await prisma.game.findMany({});
    const tags = await prisma.tag.findMany({});
    
    console.log('Direct DB query - Games:', games);
    console.log('Direct DB query - Tags:', tags);

    return NextResponse.json({ 
      success: true,
      games: {
        count: games.length,
        data: games
      },
      tags: {
        count: tags.length,
        data: tags
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}