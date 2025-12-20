# 手動デプロイ手順書

## 概要

evoliss.jp アプリケーションの手動デプロイ手順です。
全ての自動化スクリプトを停止し、手動でのデプロイに切り替えました。

## 前提条件

- AWS CLI 設定済み（プロファイル: tao-evoliss）
- EC2 インスタンス: i-06d5f07aaf47bc9a4 (evoliss-production)
- 全プロセス停止済み

## 手動デプロイ手順

### 1. EC2 インスタンスに接続

```bash
aws ssm start-session --target i-06d5f07aaf47bc9a4 --profile tao-evoliss --region ap-northeast-1
```

### 2. アプリケーションディレクトリに移動

```bash
cd /opt/evoliss/current
```

### 3. 現在の状態確認

```bash
# Git状態確認
git status
git log -1 --oneline

# プロセス確認
pm2 status
ps aux | grep node | grep -v grep
netstat -tlnp | grep :3000
```

### 4. 最新コードを取得

```bash
# リモートから最新コードを取得
git fetch origin
git pull origin main

# 変更内容確認
git log -5 --oneline
```

### 5. 環境変数設定

```bash
# .envファイルが存在することを確認
ls -la .env

# 必要に応じて環境変数を更新
# nano .env
```

### 6. 依存関係インストール

```bash
# 本番用依存関係インストール
npm ci --production

# Prisma設定
npx prisma generate
npx prisma migrate deploy
```

### 7. アプリケーションビルド

```bash
# 既存ビルドファイル削除
rm -rf .next

# 新しくビルド
npm run build
```

### 8. PM2 設定ファイル確認・作成

```bash
# ecosystem.config.jsが存在するか確認
ls -la ecosystem.config.js

# 存在しない場合は作成
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'evoliss-production',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/evoliss/error.log',
    out_file: '/var/log/evoliss/out.log',
    log_file: '/var/log/evoliss/combined.log',
    time: true
  }]
}
EOF
```

### 9. アプリケーション起動

```bash
# PM2でアプリケーション起動
pm2 start ecosystem.config.js

# PM2設定保存
pm2 save
```

### 10. 起動確認

```bash
# PM2状態確認
pm2 status

# ローカルヘルスチェック
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000/

# ログ確認
pm2 logs evoliss-production --lines 20
```

### 11. 外部アクセス確認

ブラウザで https://evoliss.jp にアクセスして動作確認

## トラブルシューティング

### アプリケーションが起動しない場合

```bash
# ログ確認
pm2 logs evoliss-production

# ポート確認
netstat -tlnp | grep :3000

# プロセス強制終了
lsof -ti:3000 | xargs kill -9
```

### ビルドエラーの場合

```bash
# node_modules再インストール
rm -rf node_modules package-lock.json
npm install --production
npm run build
```

### データベース接続エラーの場合

```bash
# 環境変数確認
cat .env | grep DATABASE_URL

# Prisma再設定
npx prisma generate
npx prisma migrate deploy
```

## 緊急時の対応

### 全プロセス停止

```bash
pm2 stop all
pm2 delete all
lsof -ti:3000 | xargs kill -9
```

### 前のバージョンに戻す

```bash
git log --oneline -10
git reset --hard <前のコミットハッシュ>
npm ci --production
npm run build
pm2 restart evoliss-production
```

## 定期メンテナンス

### ログローテーション

```bash
pm2 flush
```

### システムリソース確認

```bash
free -h
df -h
pm2 monit
```

## 注意事項

- 本番環境での作業のため、慎重に実行してください
- 変更前には必ずバックアップを取ってください
- エラーが発生した場合は、すぐに前のバージョンに戻してください
- 作業後は必ず動作確認を行ってください
