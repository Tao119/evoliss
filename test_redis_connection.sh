#!/bin/bash

echo "🔍 Redisの接続確認"
echo "=================="

# .envファイルのパスワードを読み込む
if [ -f .env ]; then
    # コメントを除外してREDIS_PASSWORDを抽出
    REDIS_PASSWORD=$(grep '^REDIS_PASSWORD=' .env | cut -d'=' -f2)
fi

echo "📌 Redisに接続中..."

if [ -z "$REDIS_PASSWORD" ]; then
    echo "パスワードなしで接続を試行..."
    redis-cli ping
else
    echo "パスワード付きで接続を試行..."
    redis-cli -a "$REDIS_PASSWORD" ping
fi

if [ $? -eq 0 ]; then
    echo "✅ Redis接続成功!"
else
    echo "❌ Redis接続失敗"
    echo ""
    echo "💡 以下を確認してください:"
    echo "1. Redisが起動しているか: brew services list"
    echo "2. .envファイルのREDIS_PASSWORDが正しいか"
    echo "3. Redisの設定ファイルでrequirepassが設定されているか"
fi
