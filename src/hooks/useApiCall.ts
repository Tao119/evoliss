import { useEffect, useRef, useState } from 'react';

/**
 * API呼び出しの重複を防ぐカスタムフック
 */
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 実行中のリクエストを追跡
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // クリーンアップ時に実行中のリクエストをキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      // 前のリクエストをキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // 新しいAbortControllerを作成
      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await apiCall();
        
        // コンポーネントがマウントされている場合のみ状態を更新
        if (isMountedRef.current) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (isMountedRef.current && err !== 'AbortError') {
          setError(err as Error);
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  
  return { data, loading, error };
}

/**
 * デバウンス付きの値を返すフック
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
