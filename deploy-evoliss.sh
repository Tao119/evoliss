#!/bin/bash

# =============================================================================
# Evoliss 完全デプロイ実行スクリプト
# =============================================================================

set -e

log_info() { echo -e "\033[32m[INFO]\033[0m $1"; }
log_warn() { echo -e "\033[33m[WARN]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

log_info "=== Evoliss 完全デプロイ開始 ==="

# 前提条件チェック
log_info "前提条件をチェック中..."

# AWS CLI確認
if ! command -v aws &> /dev/null; then
    log_error "AWS CLIがインストールされていません"
    exit 1
fi

# AWS認証確認
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS認証が設定されていません"
    exit 1
fi

# Git確認
if ! command -v git &> /dev/null; then
    log_error "Gitがインストールされていません"
    exit 1
fi

# GitHub認証確認
log_info "GitHub認証を確認中..."
log_info "GitHub認証が未設定の場合は、以下のコマンドで設定してください："
log_info "  Personal Access Token: ./setup-github-auth.sh pat"
log_info "  Deploy Key: ./setup-github-auth.sh deploy-key"
log_info "  パブリックリポジトリ: ./setup-github-auth.sh public"
log_info ""
log_info "続行しますか？ (y/n)"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    log_info "デプロイをキャンセルしました"
    exit 0
fi

# キーペア確認
KEY_NAME="evoliss-keypair"
if ! aws ec2 describe-key-pairs --key-names $KEY_NAME --region ap-northeast-1 &> /dev/null; then
    log_warn "キーペア '$KEY_NAME' が存在しません"
    log_info "キーペアを作成しますか？ (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        aws ec2 create-key-pair --key-name $KEY_NAME --region ap-northeast-1 --query 'KeyMaterial' --output text > ${KEY_NAME}.pem
        chmod 400 ${KEY_NAME}.pem
        log_info "キーペアを作成しました: ${KEY_NAME}.pem"
    else
        log_error "キーペアが必要です"
        exit 1
    fi
fi

log_info "前提条件チェック完了"

# 1. 最新コードをGitHubにプッシュ
log_info "=== ステップ1: 最新コードをGitHubにプッシュ ==="
./push-to-github.sh

# 2. AWSデプロイ実行
log_info "=== ステップ2: AWSインフラストラクチャとアプリケーションデプロイ ==="
./aws-deployment/complete-evoliss-deployment.sh

log_info "=== Evoliss 完全デプロイ完了 ==="
log_info "次のステップ:"
log_info "1. Route53でドメイン設定"
log_info "2. SSL証明書設定"
log_info "3. アプリケーション動作確認"