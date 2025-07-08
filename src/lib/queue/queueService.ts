// ========================================
// lib/queue/queueService.ts - Queue管理サービス
// ========================================

import { scheduleReservationExpiry, cancelReservationExpiry, ensureQueueInitialized } from './index';

export interface QueueServiceOptions {
    throwOnError?: boolean;  // エラー時に例外をスローするか
    logErrors?: boolean;     // エラーをログに記録するか
}

export class QueueService {
    private static isEnabled: boolean = true;  // キューサービスの有効/無効
    
    // キューサービスの有効/無効を設定
    static setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        console.log(`📌 Queue service ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    // 予約期限切れジョブをスケジュール
    static async scheduleReservationExpiry(
        reservationId: number, 
        expiryHours: number = 1,
        options: QueueServiceOptions = { throwOnError: false, logErrors: true }
    ) {
        if (!this.isEnabled) {
            console.log(`ℹ️ Queue service is disabled, skipping expiry schedule for reservation ${reservationId}`);
            return null;
        }
        
        try {
            await ensureQueueInitialized();
            const job = await scheduleReservationExpiry(reservationId, expiryHours);
            return job;
        } catch (error) {
            if (options.logErrors) {
                console.error(`🚨 Failed to schedule reservation expiry for ${reservationId}:`, error);
            }
            
            if (options.throwOnError) {
                throw error;
            }
            
            return null;
        }
    }
    
    // 予約期限切れジョブをキャンセル
    static async cancelReservationExpiry(
        reservationId: number,
        options: QueueServiceOptions = { throwOnError: false, logErrors: true }
    ) {
        if (!this.isEnabled) {
            console.log(`ℹ️ Queue service is disabled, skipping expiry cancellation for reservation ${reservationId}`);
            return false;
        }
        
        try {
            await ensureQueueInitialized();
            const result = await cancelReservationExpiry(reservationId);
            return result;
        } catch (error) {
            if (options.logErrors) {
                console.error(`🚨 Failed to cancel reservation expiry for ${reservationId}:`, error);
            }
            
            if (options.throwOnError) {
                throw error;
            }
            
            return false;
        }
    }
}

// 環境変数でキューサービスを無効化できるようにする
if (process.env.DISABLE_QUEUE_SERVICE === 'true') {
    QueueService.setEnabled(false);
}
