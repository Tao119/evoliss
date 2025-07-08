// ========================================
// testQueue.ts - Bull Queue診断スクリプト
// ========================================

import { initializeQueue, reservationExpiryQueue, closeQueue } from './reservationQueue';

async function testBullQueue() {
    console.log('🔍 Bull Queue診断開始...\n');

    try {
        // 1. 初期化テスト
        console.log('📌 Step 1: キューの初期化');
        await initializeQueue();
        
        // 2. キューの状態確認
        console.log('\n📌 Step 2: キューの状態確認');
        const isReady = await reservationExpiryQueue.isReady();
        console.log('Queue is ready:', isReady);
        
        // 3. ジョブの追加テスト
        console.log('\n📌 Step 3: テストジョブの追加');
        const job = await reservationExpiryQueue.add('test-job', {
            testData: 'Hello Bull Queue',
            timestamp: new Date()
        });
        console.log('Job added successfully:', job.id);
        
        // 4. ジョブ数の確認
        console.log('\n📌 Step 4: ジョブ数の確認');
        const jobCounts = await reservationExpiryQueue.getJobCounts();
        console.log('Job counts:', jobCounts);
        
        // 5. クリーンアップ
        console.log('\n📌 Step 5: クリーンアップ');
        await job.remove();
        console.log('Test job removed');
        
    } catch (error) {
        const err = error as any;
        console.error('\n❌ エラーが発生しました:', error);
        console.error('Error stack:', err.stack || 'No stack trace available');
    } finally {
        // 6. 接続を閉じる
        console.log('\n📌 終了処理');
        await closeQueue();
        process.exit(0);
    }
}

// 実行
if (require.main === module) {
    testBullQueue();
}

export { testBullQueue };
