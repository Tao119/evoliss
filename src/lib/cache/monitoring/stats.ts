import { getRedisClient } from '../redis';

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
  lastReset: Date;
}

interface DetailedCacheStats extends CacheStats {
  byKey: Record<string, {
    hits: number;
    misses: number;
    lastAccess: Date;
    avgTTL: number;
  }>;
  byPrefix: Record<string, CacheStats>;
}

class CacheMonitor {
  private stats: DetailedCacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0,
    lastReset: new Date(),
    byKey: {},
    byPrefix: {},
  };

  private readonly STATS_KEY = 'cache:stats';
  private readonly STATS_TTL = 86400 * 7; // 7日間保持

  async initialize() {
    try {
      const client = getRedisClient();
      const savedStats = await client.get(this.STATS_KEY);
      if (savedStats) {
        this.stats = JSON.parse(savedStats);
        this.stats.lastReset = new Date(this.stats.lastReset);
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  }

  recordHit(key: string) {
    this.stats.hits++;
    this.updateKeyStats(key, 'hit');
    this.updatePrefixStats(key, 'hit');
    this.calculateHitRate();
    this.saveStats();
  }

  recordMiss(key: string) {
    this.stats.misses++;
    this.updateKeyStats(key, 'miss');
    this.updatePrefixStats(key, 'miss');
    this.calculateHitRate();
    this.saveStats();
  }

  recordSet(key: string, ttl?: number) {
    this.stats.sets++;
    this.updateKeyStats(key, 'set', ttl);
    this.updatePrefixStats(key, 'set');
    this.saveStats();
  }

  recordDelete(key: string) {
    this.stats.deletes++;
    this.updatePrefixStats(key, 'delete');
    this.saveStats();
  }

  recordError(key: string) {
    this.stats.errors++;
    this.updatePrefixStats(key, 'error');
    this.saveStats();
  }

  private updateKeyStats(key: string, action: 'hit' | 'miss' | 'set', ttl?: number) {
    if (!this.stats.byKey[key]) {
      this.stats.byKey[key] = {
        hits: 0,
        misses: 0,
        lastAccess: new Date(),
        avgTTL: 0,
      };
    }

    const keyStats = this.stats.byKey[key];
    keyStats.lastAccess = new Date();

    if (action === 'hit') {
      keyStats.hits++;
    } else if (action === 'miss') {
      keyStats.misses++;
    } else if (action === 'set' && ttl) {
      // TTLの移動平均を計算
      const totalAccess = keyStats.hits + keyStats.misses;
      keyStats.avgTTL = totalAccess === 0 
        ? ttl 
        : (keyStats.avgTTL * totalAccess + ttl) / (totalAccess + 1);
    }
  }

  private updatePrefixStats(key: string, action: 'hit' | 'miss' | 'set' | 'delete' | 'error') {
    const prefix = this.extractPrefix(key);
    if (!prefix) return;

    if (!this.stats.byPrefix[prefix]) {
      this.stats.byPrefix[prefix] = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
        hitRate: 0,
        lastReset: new Date(),
      };
    }

    const prefixStats = this.stats.byPrefix[prefix];
    switch (action) {
      case 'hit':
        prefixStats.hits++;
        break;
      case 'miss':
        prefixStats.misses++;
        break;
      case 'set':
        prefixStats.sets++;
        break;
      case 'delete':
        prefixStats.deletes++;
        break;
      case 'error':
        prefixStats.errors++;
        break;
    }

    // プレフィックスごとのヒット率を計算
    const total = prefixStats.hits + prefixStats.misses;
    prefixStats.hitRate = total > 0 ? (prefixStats.hits / total) * 100 : 0;
  }

  private extractPrefix(key: string): string | null {
    const match = key.match(/^([^:]+):/);
    return match ? match[1] : null;
  }

  private calculateHitRate() {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private async saveStats() {
    try {
      const client = getRedisClient();
      await client.setex(this.STATS_KEY, this.STATS_TTL, JSON.stringify(this.stats));
    } catch (error) {
      console.error('Failed to save cache stats:', error);
    }
  }

  getStats(): CacheStats {
    const { byKey, byPrefix, ...basicStats } = this.stats;
    return basicStats;
  }

  getDetailedStats(): DetailedCacheStats {
    return { ...this.stats };
  }

  getKeyRecommendations(): Array<{
    key: string;
    recommendation: string;
    currentTTL: number;
    suggestedTTL: number;
  }> {
    const recommendations: Array<{
      key: string;
      recommendation: string;
      currentTTL: number;
      suggestedTTL: number;
    }> = [];

    Object.entries(this.stats.byKey).forEach(([key, stats]) => {
      const hitRate = (stats.hits / (stats.hits + stats.misses)) * 100;
      const accessFrequency = stats.hits + stats.misses;

      // 高頻度アクセスかつ高ヒット率の場合、TTLを延長推奨
      if (accessFrequency > 100 && hitRate > 80) {
        const suggestedTTL = Math.min(stats.avgTTL * 2, 86400); // 最大24時間
        if (suggestedTTL > stats.avgTTL * 1.5) {
          recommendations.push({
            key,
            recommendation: 'TTLを延長することで、キャッシュ効率が向上する可能性があります',
            currentTTL: stats.avgTTL,
            suggestedTTL,
          });
        }
      }

      // 低ヒット率の場合、TTLを短縮推奨
      if (accessFrequency > 50 && hitRate < 30) {
        const suggestedTTL = Math.max(stats.avgTTL * 0.5, 300); // 最小5分
        recommendations.push({
          key,
          recommendation: 'TTLを短縮することで、データの鮮度を保ちながらメモリを節約できます',
          currentTTL: stats.avgTTL,
          suggestedTTL,
        });
      }
    });

    return recommendations;
  }

  reset() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      lastReset: new Date(),
      byKey: {},
      byPrefix: {},
    };
    this.saveStats();
  }
}

// シングルトンインスタンス
export const cacheMonitor = new CacheMonitor();

// モニタリング統計を定期的に出力する関数
export function startCacheMonitoring(intervalMinutes: number = 60) {
  setInterval(() => {
    const stats = cacheMonitor.getDetailedStats();
    console.log('=== Cache Statistics ===');
    console.log(`Total Hit Rate: ${stats.hitRate.toFixed(2)}%`);
    console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`);
    console.log(`Sets: ${stats.sets}, Deletes: ${stats.deletes}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Last Reset: ${stats.lastReset.toISOString()}`);
    
    console.log('\n=== Cache Statistics by Prefix ===');
    Object.entries(stats.byPrefix).forEach(([prefix, prefixStats]) => {
      console.log(`${prefix}: Hit Rate ${prefixStats.hitRate.toFixed(2)}%, Hits: ${prefixStats.hits}, Misses: ${prefixStats.misses}`);
    });

    // TTL最適化の推奨事項を出力
    const recommendations = cacheMonitor.getKeyRecommendations();
    if (recommendations.length > 0) {
      console.log('\n=== TTL Optimization Recommendations ===');
      recommendations.forEach(rec => {
        console.log(`Key: ${rec.key}`);
        console.log(`  ${rec.recommendation}`);
        console.log(`  Current TTL: ${rec.currentTTL}s, Suggested: ${rec.suggestedTTL}s`);
      });
    }
  }, intervalMinutes * 60 * 1000);
}
