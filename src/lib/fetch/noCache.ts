/**
 * キャッシュを無効化したfetch関数のラッパー
 * Next.jsのfetchキャッシュを完全に無効化します
 */

type FetchOptions = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

/**
 * キャッシュを無効化してfetchを実行
 */
export async function fetchNoCache(
  url: string | URL | Request, 
  options?: FetchOptions
): Promise<Response> {
  const noCacheOptions: FetchOptions = {
    ...options,
    // キャッシュを無効化
    cache: 'no-store',
    next: {
      ...options?.next,
      revalidate: 0,
    },
    headers: {
      ...options?.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  };

  return fetch(url, noCacheOptions);
}

/**
 * グローバルfetchを上書き（必要に応じて使用）
 * このファイルをインポートするだけで、すべてのfetchがキャッシュ無効化される
 */
if (typeof globalThis.fetch !== 'undefined' && process.env.DISABLE_CACHE === 'true') {
  const originalFetch = globalThis.fetch;
  
  globalThis.fetch = async function(
    url: string | URL | Request, 
    options?: FetchOptions
  ): Promise<Response> {
    return fetchNoCache(url, options);
  };
}
