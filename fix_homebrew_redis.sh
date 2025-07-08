#!/bin/bash

echo "🔧 Homebrew Redis設定の修正"
echo "============================"

# M1 Mac用のパス
REDIS_CONF="/opt/homebrew/etc/redis.conf"

# Intel Mac用の代替パス
if [ ! -f "$REDIS_CONF" ]; then
    REDIS_CONF="/usr/local/etc/redis.conf"
fi

if [ ! -f "$REDIS_CONF" ]; then
    echo "❌ Redis設定ファイルが見つかりません"
    exit 1
fi

echo "📌 Redis設定ファイル: $REDIS_CONF"

# 現在の設定を確認
echo -e "\n現在のパスワード設定:"
grep "^requirepass" "$REDIS_CONF" || echo "（パスワード設定なし）"

# バックアップ作成
echo -e "\n📌 バックアップを作成..."
sudo cp "$REDIS_CONF" "$REDIS_CONF.backup.$(date +%Y%m%d_%H%M%S)"

# requirepassをコメントアウト
echo "📌 パスワード設定を無効化..."
sudo sed -i '' 's/^requirepass/#requirepass/' "$REDIS_CONF"

# 変更を確認
echo -e "\n変更後の設定:"
grep "#requirepass" "$REDIS_CONF" | head -1

# Redisを再起動
echo -e "\n📌 Redisを再起動..."
brew services restart redis

# 少し待つ
sleep 3

# 接続確認
echo -e "\n📌 接続確認..."
redis-cli ping

if [ $? -eq 0 ]; then
    echo -e "\n✅ 成功！パスワードなしで接続できます。"
    
    # .envファイルを更新
    echo -e "\n📌 .envファイルを更新..."
    if [ -f ".env" ]; then
        # REDIS_PASSWORDをコメントアウト
        sed -i '' 's/^REDIS_PASSWORD=/#REDIS_PASSWORD=/' .env
        echo "✅ .envファイルを更新しました"
    fi
    
    echo -e "\n💡 完了！アプリケーションを再起動してください:"
    echo "npm run dev"
else
    echo -e "\n❌ まだパスワードが必要です。"
    echo "手動で確認してください:"
    echo "cat $REDIS_CONF | grep requirepass"
fi
