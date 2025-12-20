#!/bin/bash

# =============================================================================
# GitHub認証設定統合スクリプト
# =============================================================================

set -e

log_info() { echo -e "\033[32m[INFO]\033[0m $1"; }
log_warn() { echo -e "\033[33m[WARN]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

show_help() {
    echo "GitHub認証設定スクリプト"
    echo ""
    echo "使用方法: $0 [方法]"
    echo ""
    echo "方法:"
    echo "  pat         - Personal Access Token設定"
    echo "  deploy-key  - Deploy Key設定"
    echo "  public      - パブリックリポジトリ設定確認"
    echo "  help        - このヘルプを表示"
}

setup_pat() {
    log_info "=== Personal Access Token設定 ==="
    ./setup-github-pat.sh
}

setup_deploy_key() {
    log_info "=== Deploy Key設定 ==="
    ./setup-github-deploy-key.sh
}

check_public() {
    log_info "=== パブリックリポジトリ確認 ==="
    
    # リポジトリの可視性確認
    if command -v gh &> /dev/null && gh auth status &> /dev/null; then
        VISIBILITY=$(gh api repos/Tao119/evoliss --jq '.private')
        if [ "$VISIBILITY" = "true" ]; then
            log_warn "リポジトリはプライベートです"
            log_info "パブリックリポジトリとしてクローンするには："
            log_info "1. GitHubでリポジトリをパブリックに変更"
            log_info "2. または Personal Access Token / Deploy Key を使用"
        else
            log_info "リポジトリはパブリックです - 認証なしでクローン可能"
        fi
    else
        log_warn "GitHub CLIが設定されていないため、可視性を確認できません"
        log_info "手動でGitHubリポジトリの設定を確認してください"
    fi
    
    # クローンテスト
    log_info "パブリッククローンをテスト中..."
    TEMP_DIR=$(mktemp -d)
    if git clone https://github.com/Tao119/evoliss.git "$TEMP_DIR" &> /dev/null; then
        log_info "パブリッククローンテスト成功"
        rm -rf "$TEMP_DIR"
    else
        log_error "パブリッククローンテスト失敗 - 認証が必要です"
        rm -rf "$TEMP_DIR"
    fi
}

# メイン処理
case "${1:-help}" in
    pat)
        setup_pat
        ;;
    deploy-key)
        setup_deploy_key
        ;;
    public)
        check_public
        ;;
    help|*)
        show_help
        ;;
esac