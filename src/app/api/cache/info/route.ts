import { NextRequest, NextResponse } from 'next/server';
import { getCacheInfo } from '@/lib/cache/monitoring/api';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const info = await getCacheInfo();
    return NextResponse.json(info);
  } catch (error) {
    console.error('Error getting cache info:', error);
    return NextResponse.json(
      { error: 'Failed to get cache information' },
      { status: 500 }
    );
  }
}
