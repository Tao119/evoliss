#!/bin/bash

# Prisma CLI のエラーハンドリング
set -e

echo "🚀 Prisma マイグレーションのリセットを開始します（※データベースのデータは保持されます）"

# 1. 現在のDBスキーマを schema.prisma に反映
echo "📥 DBスキーマを schema.prisma に反映中..."
npx prisma db pull

# 2. 既存のマイグレーションフォルダをバックアップして削除
if [ -d "prisma/migrations" ]; then
  BACKUP_DIR="prisma/migrations_backup_$(date +%Y%m%d%H%M%S)"
  echo "📦 既存マイグレーションをバックアップ: $BACKUP_DIR"
  mv prisma/migrations "$BACKUP_DIR"
fi

# 3. 新しい初期マイグレーションを作成（SQL形式）
echo "📝 現在のスキーマから新しい初期マイグレーションを生成中..."
mkdir -p prisma/migrations/init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/init/migration.sql

# 4. マイグレーションが適用済みであることを Prisma に通知
echo "✅ Prisma に初期マイグレーションとして解決済みマークを追加中..."
npx prisma migrate resolve --applied init

# 5. Prisma Client の再生成
echo "⚙️ Prisma Client を再生成中..."
npx prisma generate

echo "🎉 完了！マイグレーション履歴はリセットされました（データベースは変更されていません）"
