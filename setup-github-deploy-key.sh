#!/bin/bash

# =============================================================================
# GitHub Deploy Key 自動設定スクリプト
# =============================================================================

set -e

log_info() { echo -e "\033[32m[INFO]\033[0m $1"; }
log_warn() { echo -e "\033[33m[WARN]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

REPO_OWNER="Tao119"
REPO_NAME="evoliss"
KEY_NAME="evoliss-deploy-key"

log_info "=== GitHub Deploy Key 設定 ==="

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

# SSH鍵生成
log_info "SSH鍵を生成中..."
ssh-keygen -t ed25519 -f ~/.ssh/${KEY_NAME} -N "" -C "${KEY_NAME}@evoliss"

# 公開鍵をGitHubに追加
log_info "Deploy keyをGitHubリポジトリに追加中..."
PUBLIC_KEY=$(cat ~/.ssh/${KEY_NAME}.pub)

# GitHub APIでDeploy key追加
gh api \
    --method POST \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    /repos/${REPO_OWNER}/${REPO_NAME}/keys \
    -f title="${KEY_NAME}" \
    -f key="${PUBLIC_KEY}" \
    -F read_only=true

log_info "Deploy key追加完了"

# SSH設定ファイル更新
log_info "SSH設定を更新中..."
SSH_CONFIG_ENTRY="
# Evoliss Deploy Key
Host github-evoliss
    HostName github.com
    User git
    IdentityFile ~/.ssh/${KEY_NAME}
    IdentitiesOnly yes
"

if ! grep -q "github-evoliss" ~/.ssh/config 2>/dev/null; then
    echo "$SSH_CONFIG_ENTRY" >> ~/.ssh/config
    log_info "SSH設定を追加しました"
else
    log_info "SSH設定は既に存在します"
fi

# 接続テスト
log_info "GitHub接続をテスト中..."
if ssh -T git@github-evoliss 2>&1 | grep -q "successfully authenticated"; then
    log_info "GitHub接続テスト成功"
else
    log_warn "GitHub接続テストに失敗しました。手動で確認してください："
    log_warn "  ssh -T git@github-evoliss"
fi

log_info "=== Deploy Key設定完了 ==="
log_info "デプロイスクリプトでこのSSH設定を使用します"
log_info "秘密鍵パス: ~/.ssh/${KEY_NAME}"
log_info "SSH Host: github-evoliss"