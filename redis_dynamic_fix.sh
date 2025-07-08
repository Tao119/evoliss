#!/bin/bash

echo "🔧 Redis設定の動的変更（再起動不要）"
echo "===================================="

echo -e "\n📌 現在のパスワード設定を確認..."

# 現在のパスワードで接続を試みる
echo -e "\n1. .envのパスワードで接続を試行..."
redis-cli -a "your_strong_password_here" ping 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ パスワード 'your_strong_password_here' で接続成功"
    CURRENT_PASSWORD="your_strong_password_here"
else
    echo "❌ .envのパスワードでは接続できません"
    
    echo -e "\n2. パスワードなしで接続を試行..."
    redis-cli ping 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ パスワードなしで接続可能"
        CURRENT_PASSWORD=""
    else
        echo "❌ パスワードが必要です"
        echo -e "\nRedisのパスワードを入力してください:"
        read -s CURRENT_PASSWORD
    fi
fi

if [ ! -z "$CURRENT_PASSWORD" ]; then
    echo -e "\n📌 パスワードを無効化中..."
    redis-cli -a "$CURRENT_PASSWORD" CONFIG SET requirepass "" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ パスワードを無効化しました（一時的）"
        echo ""
        echo "⚠️  注意: この変更は一時的です。Redisを再起動すると元に戻ります。"
        echo ""
        echo "💡 永続的に無効化するには:"
        echo "1. Redis設定ファイルを編集"
        echo "2. requirepass行をコメントアウト"
        echo "3. Redisを再起動"
    else
        echo "❌ パスワードの無効化に失敗しました"
    fi
else
    echo "✅ 既にパスワードは無効化されています"
fi

echo -e "\n📌 最終確認..."
redis-cli ping && echo "✅ 接続成功！"

echo -e "\n📌 Bull Queueテスト用の設定..."
echo "以下の内容で.envファイルを更新してください:"
echo ""
echo "REDIS_HOST=127.0.0.1"
echo "REDIS_PORT=6379"
echo "# REDIS_PASSWORD=  # パスワードなし"
echo "REDIS_DB=0"
