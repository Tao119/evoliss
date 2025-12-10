# AWS SES でメール送信を設定する

## 1. パッケージのインストール

```bash
npm install @aws-sdk/client-ses
```

## 2. AWS SES の設定

### 2.1 メールアドレスの検証

1. AWS Console → SES → Verified identities
2. 「Create identity」をクリック
3. 送信元メールアドレスを登録
4. 受信したメールで検証

### 2.2 サンドボックスの解除（本番環境）

- デフォルトでは検証済みアドレスにのみ送信可能
- 本番環境では「Request production access」で解除申請

## 3. 環境変数の設定

`.env`に以下を追加：

```env
# AWS認証情報
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=ap-northeast-1

# メール送信元
EMAIL_FROM=noreply@evoliss.com
```

## 4. コードの実装

`src/lib/email/emailService.ts`を以下のように更新：

```typescript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// SESクライアントの作成（1回だけ）
let sesClient: SESClient | null = null;

function getSESClient() {
  if (!sesClient) {
    sesClient = new SESClient({
      region: process.env.AWS_REGION || "ap-northeast-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return sesClient;
}

export async function sendEmail({ to, subject, html, text }: EmailParams) {
  try {
    console.log("📧 Sending email:", { to, subject });

    // 開発環境ではログのみ
    if (process.env.NODE_ENV === "development") {
      console.log("Email content:", html);
      return { success: true, message: "Email logged (dev mode)" };
    }

    // 本番環境でメール送信
    const client = getSESClient();

    const command = new SendEmailCommand({
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: html,
            Charset: "UTF-8",
          },
          Text: {
            Data: text || "",
            Charset: "UTF-8",
          },
        },
      },
    });

    const response = await client.send(command);
    console.log("✅ Email sent:", response.MessageId);

    return {
      success: true,
      message: "Email sent successfully",
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error("❌ Email sending failed:", error);
    return { success: false, error: error.message };
  }
}

// 残りのテンプレート関数は同じ...
```

## 5. IAM ポリシーの設定

SES を使用する IAM ユーザーに以下のポリシーを付与：

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

## 6. テスト

```bash
# テストスクリプトを作成
node -e "
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const client = new SESClient({ region: 'ap-northeast-1' });

const command = new SendEmailCommand({
  Source: 'noreply@evoliss.com',
  Destination: { ToAddresses: ['test@example.com'] },
  Message: {
    Subject: { Data: 'Test Email' },
    Body: { Text: { Data: 'This is a test email' } }
  }
});

client.send(command)
  .then(res => console.log('Success:', res.MessageId))
  .catch(err => console.error('Error:', err));
"
```

## コスト

- 最初の 62,000 通/月: 無料
- それ以降: $0.10/1,000 通
- 非常に安価で信頼性が高い

## トラブルシューティング

### 送信エラー: "Email address is not verified"

- SES コンソールで送信元アドレスを検証
- サンドボックスモードでは受信者も検証が必要

### 認証エラー

- AWS_ACCESS_KEY_ID と AWS_SECRET_ACCESS_KEY が正しいか確認
- IAM ユーザーに SES 権限があるか確認

### リージョンエラー

- SES が利用可能なリージョンか確認
- 推奨: us-east-1, us-west-2, ap-northeast-1
