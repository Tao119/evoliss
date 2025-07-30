'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
  lastReset: string;
}

interface CacheInfo {
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
}

interface WarmingStatus {
  isWarming: boolean;
  lastWarmingTime: string | null;
  history: Array<{
    success: boolean;
    warmedKeys: string[];
    failedKeys: string[];
    duration: number;
  }>;
  config: {
    enabled: boolean;
    onStartup: boolean;
    schedule: string;
    itemCount: number;
  };
}

export default function CacheDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [info, setInfo] = useState<CacheInfo | null>(null);
  const [warmingStatus, setWarmingStatus] = useState<WarmingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWarming, setIsWarming] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
      // 30秒ごとに自動更新
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [statsRes, infoRes, warmingRes] = await Promise.all([
        fetch('/api/cache/stats'),
        fetch('/api/cache/info'),
        fetch('/api/cache/warm'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (infoRes.ok) {
        const data = await infoRes.json();
        setInfo(data);
      }

      if (warmingRes.ok) {
        const data = await warmingRes.json();
        setWarmingStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch cache data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('統計情報をリセットしてもよろしいですか？')) return;

    try {
      const res = await fetch('/api/cache/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (res.ok) {
        alert('統計情報をリセットしました');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to reset stats:', error);
      alert('リセットに失敗しました');
    }
  };

  const handleWarmCache = async () => {
    setIsWarming(true);
    try {
      const res = await fetch('/api/cache/warm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`キャッシュウォーミング完了\n成功: ${result.warmedKeys.length}件\n失敗: ${result.failedKeys.length}件`);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to warm cache:', error);
      alert('キャッシュウォーミングに失敗しました');
    } finally {
      setIsWarming(false);
    }
  };

  if (loading) {
    return (
      <div className="p-admin-cache">
        <h1 className="p-admin-cache__title">キャッシュ管理</h1>
        <div>読み込み中...</div>
      </div>
    );
  }

  const hitRate = stats?.hitRate || 0;
  const totalRequests = (stats?.hits || 0) + (stats?.misses || 0);

  return (
    <div className="p-admin-cache">
      <h1 className="p-admin-cache__title">キャッシュ管理</h1>

      {/* 統計情報 */}
      <section className="p-admin-cache__section">
        <h2 className="p-admin-cache__section-title">統計情報</h2>
        <div className="p-admin-cache__stats-grid">
          <div className="p-admin-cache__stat-card">
            <h3>ヒット率</h3>
            <p className="p-admin-cache__stat-value">{hitRate.toFixed(2)}%</p>
          </div>
          <div className="p-admin-cache__stat-card">
            <h3>総リクエスト</h3>
            <p className="p-admin-cache__stat-value">{totalRequests.toLocaleString()}</p>
          </div>
          <div className="p-admin-cache__stat-card">
            <h3>ヒット数</h3>
            <p className="p-admin-cache__stat-value">{stats?.hits.toLocaleString() || 0}</p>
          </div>
          <div className="p-admin-cache__stat-card">
            <h3>ミス数</h3>
            <p className="p-admin-cache__stat-value">{stats?.misses.toLocaleString() || 0}</p>
          </div>
          <div className="p-admin-cache__stat-card">
            <h3>セット数</h3>
            <p className="p-admin-cache__stat-value">{stats?.sets.toLocaleString() || 0}</p>
          </div>
          <div className="p-admin-cache__stat-card">
            <h3>削除数</h3>
            <p className="p-admin-cache__stat-value">{stats?.deletes.toLocaleString() || 0}</p>
          </div>
        </div>
        <button 
          onClick={handleReset}
          className="p-admin-cache__button p-admin-cache__button--secondary"
        >
          統計をリセット
        </button>
      </section>

      {/* Redis情報 */}
      <section className="p-admin-cache__section">
        <h2 className="p-admin-cache__section-title">Redis情報</h2>
        <div className="p-admin-cache__info-grid">
          <div className="p-admin-cache__info-item">
            <span className="p-admin-cache__info-label">使用メモリ:</span>
            <span className="p-admin-cache__info-value">{info?.memory.used || 'N/A'}</span>
          </div>
          <div className="p-admin-cache__info-item">
            <span className="p-admin-cache__info-label">ピークメモリ:</span>
            <span className="p-admin-cache__info-value">{info?.memory.peak || 'N/A'}</span>
          </div>
          <div className="p-admin-cache__info-item">
            <span className="p-admin-cache__info-label">接続クライアント:</span>
            <span className="p-admin-cache__info-value">{info?.clients.connected || 0}</span>
          </div>
        </div>
      </section>

      {/* キャッシュウォーミング */}
      <section className="p-admin-cache__section">
        <h2 className="p-admin-cache__section-title">キャッシュウォーミング</h2>
        <div className="p-admin-cache__warming-info">
          <p>ステータス: {warmingStatus?.isWarming ? 'ウォーミング中...' : '待機中'}</p>
          <p>最終実行: {warmingStatus?.lastWarmingTime || '未実行'}</p>
          <p>設定: {warmingStatus?.config.enabled ? '有効' : '無効'}</p>
        </div>
        <button 
          onClick={handleWarmCache}
          disabled={isWarming || warmingStatus?.isWarming}
          className="p-admin-cache__button p-admin-cache__button--primary"
        >
          {isWarming ? 'ウォーミング中...' : 'キャッシュウォーミング実行'}
        </button>
      </section>
    </div>
  );
}
