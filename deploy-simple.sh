#!/bin/bash

# エラーが発生したら即座に停止
set -e

# 色付きの出力のための設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ログ出力関数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# デプロイ開始
log_info "=== デプロイを開始します（簡易版） ==="
log_info "開始時刻: $(date '+%Y-%m-%d %H:%M:%S')"

# Gitの最新を取得
log_info "Gitリポジトリを更新しています..."
git pull
if [ $? -eq 0 ]; then
    log_info "Git pull完了"
else
    log_error "Git pullに失敗しました"
    exit 1
fi

# 依存関係のインストール（--no-deploymentオプション付き）
log_info "依存関係をインストールしています..."
npm install --no-deployment
if [ $? -eq 0 ]; then
    log_info "npm install完了"
else
    log_error "npm installに失敗しました"
    exit 1
fi

# ビルド
log_info "プロジェクトをビルドしています..."
npm run build
if [ $? -eq 0 ]; then
    log_info "ビルド完了"
else
    log_error "ビルドに失敗しました"
    exit 1
fi

# PM2でアプリケーションを再起動
log_info "アプリケーションを再起動しています..."
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js --name "evoliss"
if [ $? -eq 0 ]; then
    log_info "アプリケーション再起動完了"
else
    log_error "アプリケーション再起動に失敗しました"
    exit 1
fi

# PM2の状態を表示
log_info "現在のPM2プロセス状態:"
pm2 status

log_info "=== デプロイが完了しました ==="
log_info "完了時刻: $(date '+%Y-%m-%d %H:%M:%S')"
