// API呼び出しの最適化とキャッシング
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分

export async function cachedRequestDB<T = any>(
  modelName: string,
  funcName: string,
  param?: any,
  useCache = true
): Promise<T> {
  const cacheKey = `${modelName}-${funcName}-${JSON.stringify(param || {})}`;
  
  // キャッシュチェック
  if (useCache) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached.data;
    }
  }
  
  try {
    // 既存のrequestDBを使用
    const { requestDB } = await import('@/services/axios');
    const result = await requestDB(modelName, funcName, param);
    
    // キャッシュに保存
    apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    console.error(`API call failed for ${modelName}.${funcName}:`, error);
    throw error;
  }
}

// 同時実行を制限
const pendingRequests = new Map<string, Promise<any>>();

export async function throttledRequestDB<T = any>(
  modelName: string,
  funcName: string,
  param?: any
): Promise<T> {
  const key = `${modelName}-${funcName}-${JSON.stringify(param || {})}`;
  
  // 既に実行中のリクエストがある場合は待機
  if (pendingRequests.has(key)) {
    console.log(`Waiting for pending request: ${key}`);
    return pendingRequests.get(key);
  }
  
  // 新しいリクエストを開始
  const promise = (async () => {
    try {
      const { requestDB } = await import('@/services/axios');
      const result = await requestDB(modelName, funcName, param);
      return result;
    } finally {
      // リクエスト完了後にクリア
      pendingRequests.delete(key);
    }
  })();
  
  pendingRequests.set(key, promise);
  return promise;
}
