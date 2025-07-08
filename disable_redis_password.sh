#!/bin/bash

echo "🔧 Redis パスワード無効化スクリプト（開発環境用）"
echo "================================================"

# Redisの設定ファイルを探す
if [ -f "/usr/local/etc/redis.conf" ]; then
    REDIS_CONF="/usr/local/etc/redis.conf"
elif [ -f "/opt/homebrew/etc/redis.conf" ]; then
    REDIS_CONF="/opt/homebrew/etc/redis.conf"
else
    echo "❌ Redis設定ファイルが見つかりません"
    exit 1
fi

echo "📌 Redis設定ファイル: $REDIS_CONF"

# バックアップを作成
echo "📌 設定ファイルのバックアップを作成..."
sudo cp "$REDIS_CONF" "$REDIS_CONF.backup.$(date +%Y%m%d_%H%M%S)"

# requirepassをコメントアウト
echo "📌 パスワード設定を無効化..."
sudo sed -i '' 's/^requirepass/#requirepass/' "$REDIS_CONF" 2>/dev/null || sudo sed -i 's/^requirepass/#requirepass/' "$REDIS_CONF"

# Redisを再起動
echo "📌 Redisを再起動..."
brew services restart redis

# 少し待つ
sleep 2

# 接続確認
echo -e "\n📌 接続確認..."
redis-cli ping

if [ $? -eq 0 ]; then
    echo "✅ Redis接続成功！パスワードなしで接続できます。"
    echo ""
    echo "💡 次のステップ:"
    echo "1. .envファイルのREDIS_PASSWORDを空にするか、コメントアウト"
    echo "   # REDIS_PASSWORD=your_strong_password_here"
    echo ""
    echo "2. アプリケーションを再起動"
else
    echo "❌ 接続に失敗しました"
fi
