#!/bin/bash

# =============================================================================
# GitHubへの最新コードプッシュスクリプト
# =============================================================================

set -e

log_info() { echo -e "\033[32m[INFO]\033[0m $1"; }
log_warn() { echo -e "\033[33m[WARN]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

log_info "=== 最新コードをGitHubにプッシュ ==="

# 現在のブランチ確認
CURRENT_BRANCH=$(git branch --show-current)
log_info "現在のブランチ: $CURRENT_BRANCH"

# 変更をステージング
log_info "変更をステージング中..."
git add .

# コミット（変更がある場合のみ）
if git diff --staged --quiet; then
    log_warn "コミットする変更がありません"
else
    log_info "変更をコミット中..."
    git commit -m "Deploy: Update for production deployment $(date '+%Y-%m-%d %H:%M:%S')"
fi

# プッシュ
log_info "GitHubにプッシュ中..."
git push origin $CURRENT_BRANCH

log_info "=== GitHubプッシュ完了 ==="