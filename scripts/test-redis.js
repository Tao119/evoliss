// Redis接続テストスクリプト
const Redis = require("ioredis");

async function testRedis() {
  console.log("🔴 Redis接続テスト開始...\n");

  try {
    // Redis接続
    const redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    });

    // 接続確認
    const pong = await redis.ping();
    console.log("✅ Redis接続成功:", pong);

    // データの書き込みテスト
    await redis.set("test:key", "Hello Redis!");
    console.log("✅ データ書き込み成功");

    // データの読み込みテスト
    const value = await redis.get("test:key");
    console.log("✅ データ読み込み成功:", value);

    // データの削除
    await redis.del("test:key");
    console.log("✅ データ削除成功");

    // BullMQキューの確認
    const keys = await redis.keys("bull:*");
    console.log("\n📋 BullMQキュー一覧:");
    if (keys.length === 0) {
      console.log("  (まだキューがありません)");
    } else {
      keys.forEach((key) => console.log(`  - ${key}`));
    }

    // リマインダーキューの確認
    const reminderKeys = await redis.keys("bull:course-reminder:*");
    console.log("\n⏰ リマインダーキュー:");
    if (reminderKeys.length === 0) {
      console.log("  (まだリマインダーがありません)");
    } else {
      reminderKeys.forEach((key) => console.log(`  - ${key}`));
    }

    await redis.quit();
    console.log("\n✅ テスト完了！");
  } catch (error) {
    console.error("❌ エラー:", error.message);
    console.log("\n💡 解決方法:");
    console.log("  1. Redisが起動しているか確認: redis-cli ping");
    console.log("  2. Redisを起動: brew services start redis");
    console.log("  3. 環境変数を確認: REDIS_HOST, REDIS_PORT");
  }
}

testRedis();
