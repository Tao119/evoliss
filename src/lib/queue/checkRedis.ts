// ========================================
// checkRedis.ts - Redis接続確認スクリプト
// ========================================

import Redis from 'ioredis';

async function checkRedisConnection() {
    console.log('🔍 Redis接続確認開始...\n');

    const redisConfig = {
        port: Number.parseInt(process.env.REDIS_PORT || "6379"),
        host: process.env.REDIS_HOST || "127.0.0.1",
        password: process.env.REDIS_PASSWORD,
        db: 0,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
    };

    console.log('📌 Redis設定:');
    console.log('- Host:', redisConfig.host);
    console.log('- Port:', redisConfig.port);
    console.log('- Password:', redisConfig.password ? '設定済み' : 'なし');
    console.log('- DB:', redisConfig.db);

    const redis = new Redis(redisConfig);

    try {
        // 接続テスト
        console.log('\n📌 Redis接続テスト...');
        const pong = await redis.ping();
        console.log('✅ Redis接続成功! Response:', pong);

        // Redisバージョン確認
        const info = await redis.info('server');
        const versionMatch = info.match(/redis_version:(\S+)/);
        if (versionMatch) {
            console.log('📌 Redisバージョン:', versionMatch[1]);
        }

        // Lua機能テスト
        console.log('\n📌 Lua機能テスト...');
        const luaResult = await redis.eval('return "Hello from Lua"', 0);
        console.log('✅ Lua実行成功! Result:', luaResult);

    } catch (error) {
        const err = error as any;
        console.error('\n❌ エラーが発生しました:', err.message || error);
        console.error('Error type:', err.constructor?.name || 'Unknown');
        
        if (err.code === 'ECONNREFUSED') {
            console.error('\n💡 Redisサーバーが起動していない可能性があります。');
            console.error('以下のコマンドでRedisを起動してください:');
            console.error('  brew services start redis  (macOS)');
            console.error('  sudo systemctl start redis (Linux)');
            console.error('  redis-server               (直接起動)');
        }
    } finally {
        await redis.disconnect();
        console.log('\n👋 Redis接続を閉じました');
    }
}

// 実行
if (typeof require !== 'undefined' && require.main === module) {
    checkRedisConnection();
} else {
    // ESモジュールとして実行された場合
    checkRedisConnection().catch(console.error);
}

export { checkRedisConnection };
