export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeRedis } = await import('@/lib/cache/initialize');
    const { cacheMonitor, startCacheMonitoring } = await import('@/lib/cache/monitoring/stats');
    const { warmCacheOnStartup } = await import('@/lib/cache/warming/warmer');
    
    // Redis接続を初期化
    await initializeRedis();
    
    // キャッシュモニタリングを初期化
    await cacheMonitor.initialize();
    
    // 開発環境では詳細なモニタリングを有効化
    if (process.env.NODE_ENV === 'development') {
      startCacheMonitoring(5); // 5分ごとに統計を出力
    } else {
      startCacheMonitoring(60); // 本番環境では60分ごと
    }
    
    // キャッシュウォーミングを実行
    await warmCacheOnStartup();
  }
}
