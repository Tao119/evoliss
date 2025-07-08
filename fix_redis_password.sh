#!/bin/bash

echo "🔍 Redis パスワード設定ガイド"
echo "============================="

# .envファイルからパスワードを読み込む
if [ -f .env ]; then
    source .env
fi

echo -e "\n📌 現在の設定:"
echo "- .envのパスワード: $REDIS_PASSWORD"

echo -e "\n📌 Redisの設定を確認中..."

# Redisの設定ファイルを探す
if [ -f "/usr/local/etc/redis.conf" ]; then
    REDIS_CONF="/usr/local/etc/redis.conf"
elif [ -f "/opt/homebrew/etc/redis.conf" ]; then
    REDIS_CONF="/opt/homebrew/etc/redis.conf"
else
    echo "❌ Redis設定ファイルが見つかりません"
    exit 1
fi

echo "- Redis設定ファイル: $REDIS_CONF"

# 現在のrequirepass設定を確認
echo -e "\n📌 現在のrequirepass設定:"
grep -E "^requirepass" "$REDIS_CONF" || echo "パスワードが設定されていません"

echo -e "\n💡 推奨アクション:"
echo ""
echo "1. 開発環境でパスワードを無効化する場合:"
echo "   sudo sed -i '' 's/^requirepass/#requirepass/' $REDIS_CONF"
echo "   brew services restart redis"
echo ""
echo "2. .envのパスワードをRedisに設定する場合:"
echo "   sudo sed -i '' 's/^#*requirepass.*/requirepass your_strong_password_here/' $REDIS_CONF"
echo "   brew services restart redis"
echo ""
echo "3. 既存のRedisパスワードを確認して.envを更新する場合:"
echo "   現在のパスワードをコピーして.envファイルのREDIS_PASSWORDを更新"
echo ""
echo "どの方法を選びますか？ (1/2/3):"
