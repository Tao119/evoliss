#!/bin/bash

echo "🔍 Redis設定ファイルの検索と修正"
echo "================================="

# 可能な設定ファイルの場所をすべて確認
POSSIBLE_PATHS=(
    "/usr/local/etc/redis.conf"
    "/opt/homebrew/etc/redis.conf"
    "/etc/redis/redis.conf"
    "/etc/redis.conf"
)

REDIS_CONF=""

echo "📌 Redis設定ファイルを検索中..."
for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        echo "✅ 発見: $path"
        # requirepassが設定されているか確認
        if grep -q "^requirepass" "$path"; then
            echo "  ⚠️  パスワードが設定されています"
            REDIS_CONF="$path"
        fi
    fi
done

# 実行中のRedisプロセスから設定ファイルを特定
echo -e "\n📌 実行中のRedisプロセスを確認..."
REDIS_PROCESS=$(ps aux | grep '[r]edis-server' | head -1)
if [ ! -z "$REDIS_PROCESS" ]; then
    echo "Redis プロセス: $REDIS_PROCESS"
    # 設定ファイルのパスを抽出
    CONFIG_FROM_PROCESS=$(echo "$REDIS_PROCESS" | grep -o '[^ ]*\.conf')
    if [ ! -z "$CONFIG_FROM_PROCESS" ]; then
        echo "使用中の設定ファイル: $CONFIG_FROM_PROCESS"
        REDIS_CONF="$CONFIG_FROM_PROCESS"
    fi
fi

if [ -z "$REDIS_CONF" ]; then
    echo "❌ Redis設定ファイルが見つかりません"
    echo ""
    echo "💡 Redisの設定を確認する別の方法:"
    echo "1. redis-cli で接続して CONFIG GET requirepass を実行"
    echo "2. brew list redis でインストールパスを確認"
    exit 1
fi

echo -e "\n📌 設定ファイル: $REDIS_CONF"
echo "現在のrequirepass設定:"
grep "^requirepass" "$REDIS_CONF" || echo "（パスワード設定なし）"

echo -e "\n💡 パスワードを無効化しますか？ (y/n)"
read -r response

if [[ "$response" == "y" ]]; then
    # バックアップ作成
    sudo cp "$REDIS_CONF" "$REDIS_CONF.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ バックアップを作成しました"
    
    # requirepassをコメントアウト
    sudo sed -i.tmp 's/^requirepass/#requirepass/' "$REDIS_CONF"
    echo "✅ パスワード設定を無効化しました"
    
    # Redisを再起動
    echo "📌 Redisを再起動中..."
    if command -v brew &> /dev/null; then
        brew services restart redis
    elif command -v systemctl &> /dev/null; then
        sudo systemctl restart redis
    else
        echo "⚠️  手動でRedisを再起動してください"
    fi
    
    sleep 3
    
    # 接続確認
    echo -e "\n📌 接続確認..."
    redis-cli ping && echo "✅ パスワードなしで接続成功！"
fi
