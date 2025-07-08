#!/bin/bash

echo "🔍 Redis接続状態の完全チェック"
echo "=============================="

echo -e "\n1️⃣ Redis設定ファイルの確認:"
if [ -f "/opt/homebrew/etc/redis.conf" ]; then
    echo "📍 /opt/homebrew/etc/redis.conf (M1 Mac)"
    grep -E "^requirepass|^#requirepass" "/opt/homebrew/etc/redis.conf" | head -3
fi

if [ -f "/usr/local/etc/redis.conf" ]; then
    echo "📍 /usr/local/etc/redis.conf (Intel Mac)"
    grep -E "^requirepass|^#requirepass" "/usr/local/etc/redis.conf" | head -3
fi

echo -e "\n2️⃣ Redisプロセスの確認:"
ps aux | grep '[r]edis-server' | head -1

echo -e "\n3️⃣ Redisサービスの状態:"
brew services list | grep redis

echo -e "\n4️⃣ 接続テスト:"
echo "- パスワードなしで接続:"
redis-cli ping 2>&1

echo -e "\n- .envのパスワードで接続:"
if [ -f .env ]; then
    REDIS_PASSWORD=$(grep '^REDIS_PASSWORD=' .env | cut -d'=' -f2)
    if [ ! -z "$REDIS_PASSWORD" ]; then
        redis-cli -a "$REDIS_PASSWORD" ping 2>&1
    else
        echo "  （.envにパスワードが設定されていません）"
    fi
fi

echo -e "\n5️⃣ Bull Queueテスト準備状況:"
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redisはパスワードなしでアクセス可能"
    echo "✅ Bull Queueは正常に動作するはずです"
else
    echo "❌ Redisにパスワードが必要です"
    echo "💡 fix_homebrew_redis.shを実行してください"
fi

echo -e "\n6️⃣ Node.js環境変数の確認:"
node -e "console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD || '(未設定)')"
