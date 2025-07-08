# Redis設定ガイド - パスワード認証エラーの解決

## 問題
```
redis-cli ping
(error) NOAUTH Authentication required.
```

## 解決方法

### 方法1: パスワードを使って接続（推奨）

`.env`ファイルに設定されているパスワードを使用：

```bash
# パスワード付きで接続
redis-cli -a your_strong_password_here ping

# または接続後に認証
redis-cli
127.0.0.1:6379> AUTH your_strong_password_here
OK
127.0.0.1:6379> ping
PONG
```

### 方法2: 開発環境用にパスワードを無効化

1. Redis設定ファイルを編集：
```bash
# Intel Macの場合
sudo nano /usr/local/etc/redis.conf

# M1 Macの場合
sudo nano /opt/homebrew/etc/redis.conf
```

2. `requirepass`行を探してコメントアウト：
```conf
# requirepass foobared
```

3. Redisを再起動：
```bash
brew services restart redis
```

4. 確認：
```bash
redis-cli ping
# PONGが返ってくれば成功
```

### 方法3: .envファイルのパスワードをRedisに設定

1. Redis設定ファイルを編集：
```bash
# Intel Macの場合
sudo nano /usr/local/etc/redis.conf

# M1 Macの場合
sudo nano /opt/homebrew/etc/redis.conf
```

2. `requirepass`を設定：
```conf
requirepass your_strong_password_here
```

3. Redisを再起動：
```bash
brew services restart redis
```

## アプリケーションでの使用

reservationQueue.tsは既に`.env`ファイルのパスワードを使用するように設定されています：

```typescript
const redisConfig = {
    port: Number.parseInt(process.env.REDIS_PORT || "6379"),
    host: process.env.REDIS_HOST || "127.0.0.1",
    password: process.env.REDIS_PASSWORD, // ここで.envのパスワードを使用
    // ...
};
```

## 診断スクリプトの実行

設定後、以下のスクリプトで接続を確認：

```bash
# Redis接続確認（.envのパスワードを自動的に使用）
npx ts-node src/lib/queue/checkRedis.ts

# Bull Queueのテスト
npx ts-node src/lib/queue/testQueue.ts
```
