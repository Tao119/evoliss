#!/bin/bash

# Redis設定確認スクリプト

echo "🔍 Redis設定確認"
echo "=================="

# Homebrew Redis設定ファイルの場所を確認
REDIS_CONF="/usr/local/etc/redis.conf"
if [ -f "$REDIS_CONF" ]; then
    echo "✅ Redis設定ファイル: $REDIS_CONF"
    
    # パスワード設定を確認
    echo -e "\n📌 パスワード設定:"
    grep -E "^requirepass|^#requirepass" "$REDIS_CONF" | head -5
    
else
    # M1 Macの場合の別の場所
    REDIS_CONF="/opt/homebrew/etc/redis.conf"
    if [ -f "$REDIS_CONF" ]; then
        echo "✅ Redis設定ファイル: $REDIS_CONF (M1 Mac)"
        
        echo -e "\n📌 パスワード設定:"
        grep -E "^requirepass|^#requirepass" "$REDIS_CONF" | head -5
    else
        echo "❌ Redis設定ファイルが見つかりません"
    fi
fi

echo -e "\n📌 環境変数のRedisパスワード:"
echo "REDIS_PASSWORD=$REDIS_PASSWORD"

echo -e "\n💡 推奨アクション:"
echo "1. Redisのパスワードを無効化する場合:"
echo "   - 設定ファイルの 'requirepass' 行をコメントアウト"
echo "   - brew services restart redis"
echo ""
echo "2. 環境変数のパスワードを使用する場合:"
echo "   - redis-cli -a your_strong_password_here"
echo ""
echo "3. パスワードを設定/変更する場合:"
echo "   - 設定ファイルの 'requirepass your_new_password' を設定"
echo "   - brew services restart redis"
