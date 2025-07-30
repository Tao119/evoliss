import { getRedisClient } from '../redis';
import { cacheMonitor } from './stats';

// キャッシュAPIのエンドポイント
export interface CacheApiEndpoints {
  '/api/cache/stats': {
    GET: {
      response: {
        stats: {
          hits: number;
          misses: number;
          sets: number;
          deletes: number;
          errors: number;
          hitRate: number;
          lastReset: string;
        };
        recommendations: Array<{
          key: string;
          recommendation: string;
          currentTTL: number;
          suggestedTTL: number;
        }>;
      };
    };
  };
  '/api/cache/stats/detailed': {
    GET: {
      response: {
        stats: any; // DetailedCacheStats
      };
    };
  };
  '/api/cache/info': {
    GET: {
      response: {
        memory: {
          used: string;
          peak: string;
          rss: string;
        };
        keyspace: Record<string, string>;
        clients: {
          connected: number;
          blocked: number;
        };
      };
    };
  };
  '/api/cache/keys': {
    GET: {
      query: {
        pattern?: string;
        limit?: number;
      };
      response: {
        keys: string[];
        total: number;
      };
    };
  };
  '/api/cache/flush': {
    POST: {
      body: {
        pattern?: string;
        confirm: boolean;
      };
      response: {
        success: boolean;
        deletedCount: number;
      };
    };
  };
}

// キャッシュ情報取得のヘルパー関数
export async function getCacheInfo() {
  try {
    const client = getRedisClient();
    const info = await client.info();
    
    // メモリ情報の抽出
    const memoryMatch = info.match(/used_memory_human:(.+)\r?\n/);
    const peakMatch = info.match(/used_memory_peak_human:(.+)\r?\n/);
    const rssMatch = info.match(/used_memory_rss_human:(.+)\r?\n/);
    
    // キースペース情報の抽出
    const keyspaceSection = info.split('# Keyspace')[1];
    const keyspace: Record<string, string> = {};
    if (keyspaceSection) {
      const lines = keyspaceSection.split('\n');
      for (const line of lines) {
        const match = line.match(/^(db\d+):(.+)/);
        if (match) {
          keyspace[match[1]] = match[2];
        }
      }
    }
    
    // クライアント情報の抽出
    const connectedMatch = info.match(/connected_clients:(\d+)/);
    const blockedMatch = info.match(/blocked_clients:(\d+)/);
    
    return {
      memory: {
        used: memoryMatch ? memoryMatch[1] : 'N/A',
        peak: peakMatch ? peakMatch[1] : 'N/A',
        rss: rssMatch ? rssMatch[1] : 'N/A',
      },
      keyspace,
      clients: {
        connected: connectedMatch ? parseInt(connectedMatch[1]) : 0,
        blocked: blockedMatch ? parseInt(blockedMatch[1]) : 0,
      },
    };
  } catch (error) {
    console.error('Failed to get cache info:', error);
    throw error;
  }
}

// キャッシュキー一覧取得
export async function getCacheKeys(pattern: string = '*', limit: number = 100) {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    
    return {
      keys: keys.slice(0, limit),
      total: keys.length,
    };
  } catch (error) {
    console.error('Failed to get cache keys:', error);
    throw error;
  }
}

// キャッシュクリア
export async function flushCache(pattern?: string): Promise<{ success: boolean; deletedCount: number }> {
  try {
    const client = getRedisClient();
    
    if (!pattern || pattern === '*') {
      // 全キャッシュクリア
      await client.flushdb();
      return { success: true, deletedCount: -1 }; // -1は全削除を示す
    } else {
      // パターンマッチによる削除
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
      return { success: true, deletedCount: keys.length };
    }
  } catch (error) {
    console.error('Failed to flush cache:', error);
    throw error;
  }
}

// モニタリングダッシュボード用のデータ取得
export async function getCacheDashboardData() {
  const stats = cacheMonitor.getDetailedStats();
  const info = await getCacheInfo();
  const recommendations = cacheMonitor.getKeyRecommendations();
  
  // プレフィックスごとの統計をソート
  const sortedPrefixStats = Object.entries(stats.byPrefix)
    .sort(([, a], [, b]) => (b.hits + b.misses) - (a.hits + a.misses))
    .slice(0, 10); // トップ10
  
  // 最もアクセスの多いキー
  const topKeys = Object.entries(stats.byKey)
    .sort(([, a], [, b]) => (b.hits + b.misses) - (a.hits + a.misses))
    .slice(0, 20)
    .map(([key, keyStats]) => ({
      key,
      hits: keyStats.hits,
      misses: keyStats.misses,
      hitRate: keyStats.hits / (keyStats.hits + keyStats.misses) * 100,
      lastAccess: keyStats.lastAccess,
    }));
  
  return {
    overview: {
      totalRequests: stats.hits + stats.misses,
      hitRate: stats.hitRate,
      memory: info.memory,
      clients: info.clients,
    },
    stats: {
      hits: stats.hits,
      misses: stats.misses,
      sets: stats.sets,
      deletes: stats.deletes,
      errors: stats.errors,
    },
    prefixStats: sortedPrefixStats,
    topKeys,
    recommendations,
    keyspace: info.keyspace,
  };
}
