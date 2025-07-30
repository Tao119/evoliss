import { NextRequest, NextResponse } from 'next/server';
import { cacheWarmer } from '@/lib/cache/warming/warmer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = cacheWarmer.getStatus();
    const config = cacheWarmer.getConfig();
    
    return NextResponse.json({ status, config });
  } catch (error) {
    console.error('Error getting warming status:', error);
    return NextResponse.json(
      { error: 'Failed to get warming status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, keys } = body;

    let result;
    if (keys && Array.isArray(keys)) {
      // 特定のキーをウォーミング
      result = await cacheWarmer.warmSpecificKeys(keys);
    } else {
      // 設定されたアイテムをウォーミング
      result = await cacheWarmer.warmCache(items);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error warming cache:', error);
    return NextResponse.json(
      { error: 'Failed to warm cache' },
      { status: 500 }
    );
  }
}
