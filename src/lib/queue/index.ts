// ========================================
// lib/queue/index.ts - Queue初期化とエクスポート
// ========================================

import { reservationExpiryQueue, initializeQueue } from './reservationQueue';

// キューが初期化されているかを追跡
let isInitialized = false;

// キューの初期化を保証する関数
export async function ensureQueueInitialized() {
    if (!isInitialized) {
        try {
            await initializeQueue();
            isInitialized = true;
            console.log('✅ Queue initialized successfully');
        } catch (error) {
            console.error('🚨 Failed to initialize queue:', error);
            // 初期化に失敗してもアプリケーションは動作するようにする
            isInitialized = true; // 再試行を防ぐ
        }
    }
}

// エクスポート
export * from './reservationQueue';
