# AWS SES セットアップガイド

## 📋 概要

このガイドでは、AWS SES を使用してメール送信機能を有効化する手順を説明します。

## 🚀 セットアップ手順

### 1. AWS アカウントの準備

1. [AWS Console](https://console.aws.amazon.com/) にログイン
2. リージョンを選択（推奨: `ap-northeast-1` 東京）

### 2. SES でメールアドレスを検証

#### 2.1 SES コンソールを開く

1. AWS Console で「SES」を検索
2. Amazon Simple Email Service を開く

#### 2.2 送信元メールアドレスを検証

1. 左メニューから「Verified identities」を選択
2. 「Create identity」をクリック
3. 以下を入力：
   - **Identity type**: Email address
   - **Email address**: `noreply@evoliss.com`（または使用するメールアドレス）
4. 「Create identity」をクリック
5. 登録したメールアドレスに検証メールが届く
6. メール内のリンクをクリックして検証完了

#### 2.3 ドメインを検証（推奨）

メールアドレスではなくドメイン全体を検証することも可能：

1. 「Create identity」をクリック
2. **Identity type**: Domain を選択
3. **Domain**: `evoliss.com` を入力
4. DNS レコードを追加（表示される CNAME レコードを DNS に追加）
5. 検証完了まで待機（通常 72 時間以内）

### 3. IAM ユーザーの作成

#### 3.1 IAM コンソールを開く

1. AWS Console で「IAM」を検索
2. 左メニューから「Users」を選択
3. 「Create user」をクリック

#### 3.2 ユーザー情報を入力

1. **User name**: `evoliss-ses-user`
2. 「Next」をクリック

#### 3.3 権限を設定

1. 「Attach policies directly」を選択
2. 「Create policy」をクリック（新しいタブで開く）
3. JSON タブを選択し、以下を貼り付け：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```

4. 「Next」をクリック
5. **Policy name**: `EvolissSESPolicy`
6. 「Create policy」をクリック
7. 元のタブに戻り、作成したポリシーを検索して選択
8. 「Next」→「Create user」をクリック

#### 3.4 アクセスキーを作成

1. 作成したユーザーをクリック
2. 「Security credentials」タブを選択
3. 「Create access key」をクリック
4. **Use case**: Application running outside AWS
5. 「Next」→「Create access key」をクリック
6. **Access key ID** と **Secret access key** をコピー
   ⚠️ Secret access key は後で確認できないので必ず保存！

### 4. 環境変数の設定

`.env` ファイルに以下を追加：

```env
# AWS SES 設定
EMAIL_FROM=noreply@evoliss.com
AWS_ACCESS_KEY_ID=AKIA...（コピーしたアクセスキーID）
AWS_SECRET_ACCESS_KEY=...（コピーしたシークレットアクセスキー）
AWS_REGION=ap-northeast-1

# 開発環境で実際にメールを送信する場合
ENABLE_EMAIL_SENDING=true
```

### 5. サンドボックスモードの解除（本番環境）

デフォルトでは、SES は**サンドボックスモード**で動作します：

- ✅ 検証済みメールアドレスにのみ送信可能
- ❌ 任意のメールアドレスには送信不可
- ❌ 送信制限: 200 通/日

#### 本番環境で使用する場合

1. SES コンソールで「Account dashboard」を開く
2. 「Request production access」をクリック
3. フォームに記入：
   - **Mail type**: Transactional
   - **Website URL**: https://evoliss.com
   - **Use case description**:

     ```
     We are building a coaching platform where users can book coaching sessions.
     We need to send transactional emails including:
     - Purchase confirmations
     - Message notifications
     - Reminder notifications 30 minutes before sessions

     Expected volume: ~1,000 emails per day
     ```
4. 送信して承認を待つ（通常 24 時間以内）

## 🧪 テスト

### テストスクリプトの作成

`scripts/test-ses.js` を作成：

```javascript
require("dotenv").config();
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const client = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testSES() {
  try {
    console.log("📧 Testing AWS SES...");

    const command = new SendEmailCommand({
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: ["your-test-email@example.com"], // テスト用メールアドレス
      },
      Message: {
        Subject: {
          Data: "AWS SES Test Email",
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: "<h1>Test Email</h1><p>AWS SES is working!</p>",
            Charset: "UTF-8",
          },
          Text: {
            Data: "Test Email - AWS SES is working!",
            Charset: "UTF-8",
          },
        },
      },
    });

    const response = await client.send(command);
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", response.MessageId);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testSES();
```

### テストの実行

```bash
node scripts/test-ses.js
```

## 🔍 トラブルシューティング

### エラー: "Email address is not verified"

**原因**: 送信元または送信先のメールアドレスが検証されていない

**解決方法**:

1. SES コンソールで「Verified identities」を確認
2. 送信元メールアドレスが検証済みか確認
3. サンドボックスモードの場合、送信先も検証が必要

### エラー: "The security token included in the request is invalid"

**原因**: AWS 認証情報が正しくない

**解決方法**:

1. `.env` の `AWS_ACCESS_KEY_ID` と `AWS_SECRET_ACCESS_KEY` を確認
2. IAM ユーザーが正しく作成されているか確認
3. アクセスキーが有効か確認

### エラー: "User is not authorized to perform: ses:SendEmail"

**原因**: IAM ユーザーに SES 権限がない

**解決方法**:

1. IAM コンソールでユーザーの権限を確認
2. `EvolissSESPolicy` が正しくアタッチされているか確認

### メールが届かない

**確認事項**:

1. スパムフォルダを確認
2. SES コンソールで送信履歴を確認
3. バウンス率を確認（高いと送信が制限される）

## 💰 コスト

### 無料枠

- 最初の 62,000 通/月: **無料**
- EC2 からの送信: 無料

### 有料

- 62,000 通以降: **$0.10 / 1,000 通**
- 受信: $0.10 / 1,000 通

### 例

- 月 10,000 通: **無料**
- 月 100,000 通: **約 $3.80**
- 月 1,000,000 通: **約 $93.80**

非常に安価で信頼性が高いサービスです！

## 📊 モニタリング

### CloudWatch でメトリクスを確認

1. CloudWatch コンソールを開く
2. 「Metrics」→「SES」を選択
3. 以下を確認：
   - **Send**: 送信数
   - **Bounce**: バウンス数
   - **Complaint**: 苦情数
   - **Reject**: 拒否数

### アラートの設定

バウンス率が高い場合にアラートを設定することを推奨：

1. CloudWatch で「Alarms」を選択
2. 「Create alarm」をクリック
3. SES メトリクスを選択
4. しきい値を設定（例: バウンス率 > 5%）

## 🔐 セキュリティのベストプラクティス

1. **アクセスキーの管理**

   - `.env` ファイルを `.gitignore` に追加
   - 本番環境では環境変数で管理
   - 定期的にローテーション

2. **最小権限の原則**

   - SES 送信権限のみを付与
   - 不要な権限は削除

3. **送信制限の設定**
   - CloudWatch でモニタリング
   - 異常な送信パターンを検知

## ✅ チェックリスト

- [ ] AWS アカウント作成
- [ ] SES でメールアドレス検証
- [ ] IAM ユーザー作成
- [ ] アクセスキー取得
- [ ] `.env` に環境変数設定
- [ ] テストスクリプトで動作確認
- [ ] 本番環境でサンドボックス解除申請
- [ ] CloudWatch でモニタリング設定

## 🎉 完了！

これで AWS SES を使用したメール送信が可能になりました！
