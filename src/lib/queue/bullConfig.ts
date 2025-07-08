// ========================================
// lib/queue/bullConfig.ts - Bull Queue設定
// ========================================

import Bull from "bull";
import Redis from "ioredis";

// Redisクライアントファクトリー
function createRedisClient() {
    const client = new Redis({
        port: Number.parseInt(process.env.REDIS_PORT || "6379"),
        host: process.env.REDIS_HOST || "127.0.0.1",
        password: process.env.REDIS_PASSWORD,
        db: 0,
        // Bull Queueの要件
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        // 追加のオプション
        retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
    });

    client.on('error', (err) => {
        console.error('Redis Client Error:', err);
    });

    return client;
}

// Bull Queue作成ヘルパー
export function createBullQueue(queueName: string): Bull.Queue {
    const queue = new Bull(queueName, {
        createClient: (type) => {
            console.log(`Creating Redis client for Bull Queue: ${type}`);
            return createRedisClient();
        },
        defaultJobOptions: {
            removeOnComplete: 10,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000,
            },
        },
    });

    // エラーハンドリング
    queue.on('error', (error) => {
        console.error(`Queue ${queueName} error:`, error);
    });

    queue.on('failed', (job, err) => {
        console.error(`Job ${job.id} in queue ${queueName} failed:`, err);
    });

    return queue;
}

// シングルトンインスタンス
let queueInstance: Bull.Queue | null = null;

export function getReservationQueue(): Bull.Queue {
    if (!queueInstance) {
        queueInstance = createBullQueue('reservation-expiry');
    }
    return queueInstance;
}

export async function closeAllQueues() {
    if (queueInstance) {
        await queueInstance.close();
        queueInstance = null;
    }
}
