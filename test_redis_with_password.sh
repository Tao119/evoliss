#!/bin/bash

echo "🔍 Redis接続テスト"
echo "=================="

# .envファイルからRedis設定を読み込む
if [ -f .env ]; then
    export $(grep -E '^REDIS_' .env | xargs)
fi

echo "📌 Redis設定:"
echo "- Host: $REDIS_HOST"
echo "- Port: $REDIS_PORT"
echo "- Password: $REDIS_PASSWORD"
echo "- DB: $REDIS_DB"

echo -e "\n📌 接続テスト..."
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping

if [ $? -eq 0 ]; then
    echo -e "\n✅ Redis接続成功!"
    
    echo -e "\n📌 Redisバージョン確認..."
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" INFO server | grep redis_version
    
    echo -e "\n📌 Luaスクリプトテスト..."
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" EVAL "return 'Hello from Lua'" 0
    
    echo -e "\n✅ すべてのテストが成功しました!"
else
    echo -e "\n❌ Redis接続に失敗しました"
fi
