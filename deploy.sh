#!/bin/bash

# =============================================================================
# 簡単デプロイスクリプト - Git ベース
# ローカルでコミット・プッシュ → EC2でgit pull → PM2再起動
# =============================================================================

set -e

# 色付きログ関数
log_info() { echo -e "\033[36m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[32m[SUCCESS]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

log_info "=== 簡単 Git ベース デプロイ ==="

# 1. ローカルでの事前チェック
log_info "1. Git 状態確認中..."

# 未コミットの変更をチェック
if ! git diff-index --quiet HEAD --; then
    log_error "未コミットの変更があります。先にコミットしてください。"
    git status
    exit 1
fi

# 現在のブランチを取得
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CURRENT_COMMIT=$(git rev-parse --short HEAD)

log_info "デプロイ対象: ブランチ $CURRENT_BRANCH (コミット $CURRENT_COMMIT)"

# 2. GitHubにプッシュ
log_info "2. GitHub にプッシュ中..."
git push origin $CURRENT_BRANCH
log_success "プッシュ完了"

# 3. EC2デプロイ（AWS CLI使用）
log_info "3. EC2でデプロイ実行中..."

# EC2インスタンスID
INSTANCE_ID="i-06d5f07aaf47bc9a4"  # evoliss-production
AWS_REGION="ap-northeast-1"
AWS_PROFILE="tao-evoliss"

# Session Manager経由でデプロイコマンド実行
DEPLOY_SCRIPT="
cd /opt/evoliss/current
git fetch origin
git reset --hard origin/$CURRENT_BRANCH
npm ci --production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart evoliss-production || pm2 start ecosystem.config.js
pm2 save
echo 'デプロイ完了: コミット $(git rev-parse --short HEAD)'
"

aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=[\"$DEPLOY_SCRIPT\"]" \
    --region $AWS_REGION \
    --profile $AWS_PROFILE

log_success "=== デプロイ完了 ==="
log_info "EC2でのデプロイ状況は AWS Systems Manager Session Manager で確認してください"