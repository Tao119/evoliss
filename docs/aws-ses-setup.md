# AWS SES設定ガイド

## 1. AWS SESの初期設定

### 1.1 AWSコンソールでSESを有効化
1. AWSコンソールにログイン
2. Amazon SESサービスに移動
3. リージョンを「アジアパシフィック（東京）ap-northeast-1」に設定

### 1.2 ドメイン認証（info@evoliss.jp用）
1. SESコンソールで「Verified identities」を選択
2. 「Create identity」をクリック
3. 「Domain」を選択し、「evoliss.jp」を入力
4. 表示されるDNSレコードをドメインのDNS設定に追加：
   - CNAME レコード（3つ）
   - TXT レコード（1つ、DKIM用）
5. 認証が完了するまで待つ（最大72時間、通常は数分〜1時間）

### 1.3 メールアドレスの認証
1. 送信先のメールアドレス「NVOLTCoach@gmail.com」を認証
   - SESサンドボックス環境の場合のみ必要
   - 本番環境移行後は不要

## 2. IAMユーザーの作成

### 2.1 SES送信用のIAMユーザー作成
1. IAMコンソールで新しいユーザーを作成
2. ユーザー名: `evoliss-ses-sender`
3. アクセスキーを作成（プログラムによるアクセス）

### 2.2 必要な権限の付与
以下のポリシーをアタッチ：
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ses:FromAddress": "info@evoliss.jp"
        }
      }
    }
  ]
}
```

## 3. 環境変数の設定

`.env.local`に以下を追加：
```bash
# AWS設定
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# メール設定
SES_FROM_EMAIL=info@evoliss.jp
```

## 4. SESサンドボックスからの移行（本番環境用）

### 4.1 制限解除リクエスト
1. SESコンソールで「Account dashboard」を選択
2. 「Request production access」をクリック
3. 以下の情報を提供：
   - 使用目的: トランザクションメール（お問い合わせ確認メール）
   - 予想送信量: 月間〜1000通程度
   - バウンス処理の説明
   - 苦情処理の説明

### 4.2 承認後の設定
- 送信レート制限の確認
- バウンス・苦情通知の設定（SNS経由）

## 5. 送信テスト

### 5.1 SESシミュレーターを使用したテスト
テスト用メールアドレス：
- 成功: `success@simulator.amazonses.com`
- バウンス: `bounce@simulator.amazonses.com`
- 苦情: `complaint@simulator.amazonses.com`

### 5.2 実際のメールアドレスでのテスト
1. サンドボックス環境の場合は、受信者のメールアドレスを事前に認証
2. 本番環境の場合は、任意のメールアドレスに送信可能

## 6. モニタリング

### 6.1 CloudWatchメトリクス
- 送信数
- バウンス率
- 苦情率

### 6.2 アラート設定
- バウンス率が5%を超えた場合
- 苦情率が0.1%を超えた場合

## 7. ベストプラクティス

1. **送信レートの管理**
   - 急激な送信量の増加を避ける
   - 徐々に送信量を増やす

2. **リスト管理**
   - バウンスしたメールアドレスは削除
   - 苦情を受けたメールアドレスは即座に削除

3. **コンテンツ**
   - SPF、DKIM、DMARCを適切に設定
   - HTMLとテキストの両方のバージョンを提供
   - 明確な送信者情報を記載

4. **エラーハンドリング**
   - 一時的なエラーはリトライ
   - 恒久的なエラーは記録して対処
