# Redis起動ガイド

## macOS (Homebrew)

### インストール
```bash
# Homebrewでインストール
brew install redis

# インストール確認
redis-server --version
```

### 起動方法

#### 方法1: サービスとして起動（推奨）
```bash
# Redisをバックグラウンドサービスとして起動
brew services start redis

# 起動状態を確認
brew services list

# 停止する場合
brew services stop redis

# 再起動する場合
brew services restart redis
```

#### 方法2: 直接起動
```bash
# フォアグラウンドで起動（ターミナルを閉じると停止）
redis-server

# バックグラウンドで起動
redis-server --daemonize yes

# カスタム設定ファイルで起動
redis-server /usr/local/etc/redis.conf
```

## Linux (Ubuntu/Debian)

### インストール
```bash
# apt-getでインストール
sudo apt update
sudo apt install redis-server

# インストール確認
redis-server --version
```

### 起動方法
```bash
# systemctlで起動
sudo systemctl start redis-server

# 自動起動を有効化
sudo systemctl enable redis-server

# 起動状態を確認
sudo systemctl status redis-server

# 停止する場合
sudo systemctl stop redis-server

# 再起動する場合
sudo systemctl restart redis-server
```

## Docker

### Dockerで起動
```bash
# 基本的な起動
docker run -d -p 6379:6379 --name redis redis:latest

# データを永続化する場合
docker run -d -p 6379:6379 --name redis -v redis-data:/data redis:latest

# パスワード付きで起動
docker run -d -p 6379:6379 --name redis redis:latest redis-server --requirepass yourpassword

# 起動確認
docker ps

# ログ確認
docker logs redis
```

## Windows

### WSL2を使用（推奨）
```bash
# WSL2内でUbuntuの手順に従う
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

### Redis for Windows
```bash
# chocolateyでインストール
choco install redis-64

# またはGitHubから直接ダウンロード
# https://github.com/microsoftarchive/redis/releases
```

## 接続確認

### redis-cliで確認
```bash
# Redisに接続
redis-cli

# 接続後、pingコマンドで確認
127.0.0.1:6379> ping
PONG

# 終了
127.0.0.1:6379> quit
```

### 特定のホスト・ポートに接続
```bash
redis-cli -h localhost -p 6379

# パスワード付きの場合
redis-cli -h localhost -p 6379 -a yourpassword
```

## トラブルシューティング

### ポートが使用中の場合
```bash
# 6379ポートを使用しているプロセスを確認
lsof -i :6379  # macOS/Linux
netstat -ano | findstr :6379  # Windows

# プロセスを終了
kill -9 <PID>  # macOS/Linux
```

### ログの確認
```bash
# macOS (Homebrew)
tail -f /usr/local/var/log/redis.log

# Linux
sudo tail -f /var/log/redis/redis-server.log

# Docker
docker logs -f redis
```

### 設定ファイルの場所
- macOS: `/usr/local/etc/redis.conf`
- Linux: `/etc/redis/redis.conf`
- Docker: コンテナ内の `/usr/local/etc/redis/redis.conf`

## Evolissプロジェクト用の推奨設定

1. `.env`ファイルに以下を追加：
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# REDIS_PASSWORD=yourpassword  # パスワードを設定した場合
```

2. Redisが起動しているか確認：
```bash
npx ts-node src/lib/queue/checkRedis.ts
```

3. Bull Queueのテスト：
```bash
npx ts-node src/lib/queue/testQueue.ts
```
