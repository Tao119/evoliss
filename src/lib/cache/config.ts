import Redis, { RedisOptions, Cluster } from 'ioredis';

// Redis接続設定の環境変数から取得
export interface RedisConfig {
  mode: 'standalone' | 'sentinel' | 'cluster';
  url?: string;
  password?: string;
  sentinels?: Array<{ host: string; port: number }>;
  sentinelPassword?: string;
  name?: string; // Sentinel master name
  clusterNodes?: Array<{ host: string; port: number }>;
}

export function getRedisConfig(): RedisConfig {
  const mode = process.env.REDIS_MODE || 'standalone';
  
  switch (mode) {
    case 'sentinel': {
      const sentinelHosts = process.env.REDIS_SENTINELS || 'localhost:26379';
      const sentinels = sentinelHosts.split(',').map(host => {
        const [hostname, port] = host.trim().split(':');
        return { host: hostname, port: parseInt(port) || 26379 };
      });
      
      return {
        mode: 'sentinel',
        sentinels,
        sentinelPassword: process.env.REDIS_SENTINEL_PASSWORD,
        name: process.env.REDIS_SENTINEL_MASTER || 'mymaster',
        password: process.env.REDIS_PASSWORD,
      };
    }
    
    case 'cluster': {
      const clusterHosts = process.env.REDIS_CLUSTERS || 'localhost:7000';
      const clusterNodes = clusterHosts.split(',').map(host => {
        const [hostname, port] = host.trim().split(':');
        return { host: hostname, port: parseInt(port) || 7000 };
      });
      
      return {
        mode: 'cluster',
        clusterNodes,
        password: process.env.REDIS_PASSWORD,
      };
    }
    
    default: // standalone
      return {
        mode: 'standalone',
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
      };
  }
}

export function createRedisClient(config: RedisConfig): Redis | Cluster {
  const commonOptions: RedisOptions = {
    password: config.password,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    // 高可用性のための追加設定
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Sentinelがマスター切り替えを行った場合、再接続
        return true;
      }
      return false;
    },
  };

  switch (config.mode) {
    case 'sentinel': {
      return new Redis({
        sentinels: config.sentinels!,
        sentinelPassword: config.sentinelPassword,
        name: config.name!,
        ...commonOptions,
        // Sentinel固有の設定
        enableOfflineQueue: true,
        sentinelRetryStrategy: (times) => {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
      });
    }
    
    case 'cluster': {
      return new Cluster(config.clusterNodes!, {
        redisOptions: commonOptions,
        clusterRetryStrategy: (times) => {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
        enableOfflineQueue: true,
        enableReadyCheck: true,
        scaleReads: 'slave', // 読み取りはスレーブから
        maxRedirections: 16,
        retryDelayOnFailover: 100,
        retryDelayOnClusterDown: 300,
        slotsRefreshTimeout: 2000,
        slotsRefreshInterval: 5000,
      });
    }
    
    default: // standalone
      if (config.url) {
        return new Redis(config.url, commonOptions);
      } else {
        throw new Error('Redis URL is required for standalone mode');
      }
  }
}

// ヘルスチェック関数
export async function checkRedisHealth(client: Redis | Cluster): Promise<{
  healthy: boolean;
  mode: string;
  info?: any;
  error?: string;
}> {
  try {
    // 基本的なping確認
    const pingResult = await client.ping();
    if (pingResult !== 'PONG') {
      return { healthy: false, mode: 'unknown', error: 'Ping failed' };
    }

    // モード別の追加チェック
    const config = getRedisConfig();
    
    if (config.mode === 'sentinel') {
      // Sentinelの状態確認
      const masterInfo = await (client as any).sentinel('master', config.name);
      return {
        healthy: true,
        mode: 'sentinel',
        info: {
          master: masterInfo,
        },
      };
    } else if (config.mode === 'cluster') {
      // Clusterの状態確認
      const clusterInfo = await (client as any).cluster('info');
      const clusterState = clusterInfo.includes('cluster_state:ok');
      return {
        healthy: clusterState,
        mode: 'cluster',
        info: {
          clusterInfo,
        },
        error: clusterState ? undefined : 'Cluster state is not OK',
      };
    } else {
      // Standaloneの情報取得
      const info = await client.info('server');
      return {
        healthy: true,
        mode: 'standalone',
        info: {
          version: info.match(/redis_version:(.+)/)?.[1],
        },
      };
    }
  } catch (error) {
    return {
      healthy: false,
      mode: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
