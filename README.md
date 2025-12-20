# Evoliss - オンラインコーチングプラットフォーム

Evoliss は、コーチとクライアントをつなぐオンラインコーチングプラットフォームです。

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **バックエンド**: Next.js API Routes, Prisma ORM
- **データベース**: MySQL (AWS RDS)
- **認証**: AWS Cognito, NextAuth.js
- **決済**: Stripe
- **ファイルストレージ**: AWS S3
- **メール**: AWS SES
- **キュー**: Redis, Bull
- **インフラ**: AWS (EC2, ALB, VPC, Route53)

## 開発環境セットアップ

### 前提条件

- Node.js 20 以上
- npm または yarn
- MySQL
- Redis

### インストール

```bash
# リポジトリクローン
git clone https://github.com/Tao119/evoliss.git
cd evoliss

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .envファイルを編集して必要な値を設定

# データベースセットアップ
npx prisma generate
npx prisma db push

# 開発サーバー起動
npm run dev
```

## 本番環境デプロイ

### AWS 本番デプロイ

統合されたデプロイスクリプトを使用して、AWS に完全なインフラストラクチャとアプリケーションをデプロイできます。

#### 前提条件

1. **AWS CLI 設定済み**

   ```bash
   aws configure
   ```

2. **適切な AWS 権限**（EC2, VPC, ALB, IAM, SSM 等）

3. **GitHub 認証設定**（以下のいずれか）

   **方法 1: Personal Access Token（推奨）**

   ```bash
   ./setup-github-auth.sh pat
   ```

   **方法 2: Deploy Key**

   ```bash
   ./setup-github-auth.sh deploy-key
   ```

   **方法 3: パブリックリポジトリ**

   ```bash
   ./setup-github-auth.sh public
   ```

#### デプロイ実行

```bash
# 完全デプロイ実行
./deploy-evoliss.sh
```

このスクリプトは以下を自動実行します：

1. **リソースクリーンアップ**: 既存の重複リソースを削除
2. **インフラ構築**: VPC, サブネット, セキュリティグループ, ALB, ターゲットグループ
3. **EC2 インスタンス作成**: Amazon Linux 2023, Node.js 20, Nginx, Redis
4. **SSM 設定**: VPC エンドポイント, IAM ロール
5. **アプリケーションデプロイ**: GitHub からクローン, ビルド, PM2 起動
6. **ヘルスチェック**: ALB ターゲットヘルス確認

#### デプロイ後の管理

```bash
# リソース状態確認
./aws-deployment/manage-evoliss.sh status

# アプリケーションログ確認
./aws-deployment/manage-evoliss.sh logs

# アプリケーション再起動
./aws-deployment/manage-evoliss.sh restart

# 最新コードで再デプロイ
./aws-deployment/manage-evoliss.sh deploy

# SSM接続
./aws-deployment/manage-evoliss.sh connect

# 全リソース削除
./aws-deployment/manage-evoliss.sh cleanup
```

### セキュリティ機能

- **ALB セキュリティグループ**: HTTP/HTTPS のみ許可
- **EC2 セキュリティグループ**: ALB からのアクセスのみ許可
- **SSM 接続**: SSH 不要のセキュアな管理
- **VPC エンドポイント**: プライベート通信
- **IAM ロール**: 最小権限の原則

### パフォーマンス最適化

- **Nginx 設定**:
  - Keep-alive 接続
  - Gzip 圧縮
  - 静的ファイルキャッシュ
  - プロキシバッファリング
- **タイムアウト対策**:
  - 適切なプロキシタイムアウト設定
  - ヘルスチェック最適化
  - 502/504 エラー対策

### 監視・ログ

- **CloudWatch**: メトリクス収集
- **アプリケーションログ**: PM2 経由
- **Nginx ログ**: アクセス・エラーログ
- **ヘルスチェック**: `/health` エンドポイント

## 開発

### ローカル開発

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番モード起動
npm start

# リント
npm run lint
```

### データベース

```bash
# Prismaスキーマ更新
npx prisma db push

# Prismaクライアント再生成
npx prisma generate

# データベースリセット
npx prisma db reset
```

## 環境変数

主要な環境変数：

```bash
# データベース
DATABASE_URI=mysql://user:password@host:port/database

# AWS Cognito
COGNITO_CLIENT_ID=your_client_id
COGNITO_CLIENT_SECRET=your_client_secret
COGNITO_ISSUER=your_cognito_issuer

# AWS S3
S3_BUCKET_NAME=your_bucket_name
NEXT_PUBLIC_S3_ACCESS_KEY=your_access_key
NEXT_PUBLIC_S3_SECRET_ACCESS_KEY=your_secret_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_SECRET_KEY=your_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secret
```

## ライセンス

このプロジェクトはプライベートプロジェクトです。
