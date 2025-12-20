#!/bin/bash

# =============================================================================
# GitHub Personal Access Token 設定スクリプト
# =============================================================================

set -e

log_info() { echo -e "\033[32m[INFO]\033[0m $1"; }
log_warn() { echo -e "\033[33m[WARN]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

log_info "=== GitHub Personal Access Token 設定 ==="

# GitHub CLIの確認
if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) がインストールされていません"
    log_info "インストール方法:"
    log_info "  macOS: brew install gh"
    log_info "  Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    exit 1
fi

# GitHub認証確認
if ! gh auth status &> /dev/null; then
    log_info "GitHub認証が必要です"
    gh auth login
fi

# Personal Access Token作成
log_info "Personal Access Tokenを作成中..."
log_info "必要な権限: repo (Full control of private repositories)"

TOKEN=$(gh auth token)

if [ -z "$TOKEN" ]; then
    log_error "Personal Access Tokenの取得に失敗しました"
    log_info "手動でトークンを作成してください:"
    log_info "1. https://github.com/settings/tokens にアクセス"
    log_info "2. 'Generate new token (classic)' をクリック"
    log_info "3. 'repo' 権限を選択"
    log_info "4. トークンを生成してコピー"
    exit 1
fi

# 環境変数ファイルに追加
ENV_FILE="aws-deployment/.env.production"
if grep -q "GITHUB_TOKEN" "$ENV_FILE"; then
    log_info "GITHUB_TOKENは既に設定されています"
else
    echo "" >> "$ENV_FILE"
    echo "# GitHub Personal Access Token" >> "$ENV_FILE"
    echo "GITHUB_TOKEN=$TOKEN" >> "$ENV_FILE"
    log_info "GITHUB_TOKENを環境変数ファイルに追加しました"
fi

# 接続テスト
log_info "GitHub API接続をテスト中..."
if gh api user &> /dev/null; then
    log_info "GitHub API接続テスト成功"
else
    log_error "GitHub API接続テストに失敗しました"
    exit 1
fi

log_info "=== Personal Access Token設定完了 ==="
log_info "デプロイ時にこのトークンが使用されます"