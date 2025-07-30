import { NextRequest, NextResponse } from 'next/server';
import { cacheMonitor } from '@/lib/cache/monitoring/stats';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック（必要に応じて実装）
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: 管理者権限のチェックを追加
    // if (!isAdmin(session.user)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const detailed = request.nextUrl.searchParams.get('detailed') === 'true';
    
    if (detailed) {
      const stats = cacheMonitor.getDetailedStats();
      return NextResponse.json({ stats });
    } else {
      const stats = cacheMonitor.getStats();
      const recommendations = cacheMonitor.getKeyRecommendations();
      return NextResponse.json({ stats, recommendations });
    }
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to get cache statistics' },
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
    const { action } = body;

    if (action === 'reset') {
      cacheMonitor.reset();
      return NextResponse.json({ success: true, message: 'Cache statistics reset' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to manage cache statistics' },
      { status: 500 }
    );
  }
}
