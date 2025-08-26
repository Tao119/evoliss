# デプロイスクリプト

## 使用可能なスクリプト

### 1. deploy.sh（フルデプロイ）
Prismaマイグレーションを含む完全なデプロイを実行します。

**実行内容:**
1. Gitリポジトリの更新 (`git pull`)
2. Prismaマイグレーションの実行 (`npx prisma migrate deploy`)
3. Prismaクライアントの生成 (`npx prisma generate`)
4. 依存関係のインストール (`npm install`)
5. プロジェクトのビルド (`npm run build`)
6. PM2でアプリケーションの再起動

### 2. deploy-simple.sh（簡易デプロイ）
Prismaマイグレーションを省略した簡易デプロイを実行します。

**実行内容:**
1. Gitリポジトリの更新 (`git pull`)
2. 依存関係のインストール (`npm install --no-deployment`)
3. プロジェクトのビルド (`npm run build`)
4. PM2でアプリケーションの再起動

## セットアップ

### 1. 実行権限の付与
```bash
chmod +x deploy.sh
chmod +x deploy-simple.sh
```

### 2. PM2のインストール（初回のみ）
```bash
npm install -g pm2
```

## 使用方法

### フルデプロイの実行
```bash
./deploy.sh
```

### 簡易デプロイの実行
```bash
./deploy-simple.sh
```

## エラー時の対処

スクリプトはエラーが発生すると自動的に停止します。
エラーメッセージを確認して、必要な対処を行ってください。

### よくあるエラーと対処法

1. **Git pullでコンフリクトが発生**
   ```bash
   git stash
   ./deploy.sh
   git stash pop  # 必要に応じて
   ```

2. **PM2プロセスが見つからない**
   初回実行時は自動的に新規起動されます。

3. **ビルドエラー**
   TypeScriptのエラーを修正してから再実行してください。

## ログの確認

PM2のログを確認する場合：
```bash
pm2 logs evoliss
```

PM2プロセスの状態を確認：
```bash
pm2 status
```
