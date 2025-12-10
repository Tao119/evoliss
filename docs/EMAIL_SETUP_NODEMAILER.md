# Nodemailer でメール送信を設定する

## 1. パッケージのインストール

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

## 2. 環境変数の設定

`.env`に以下を追加：

```env
# Gmail を使う場合
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Gmailアプリパスワード
EMAIL_FROM=your-email@gmail.com

# または他のSMTPサービス
# EMAIL_HOST=smtp.sendgrid.net
# EMAIL_PORT=587
# EMAIL_USER=apikey
# EMAIL_PASSWORD=your-sendgrid-api-key
```

## 3. コードの実装

`src/lib/email/emailService.ts`を以下のように更新：

```typescript
import nodemailer from "nodemailer";

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// トランスポーターの作成（1回だけ）
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: false, // TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
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
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || "",
    });

    console.log("✅ Email sent:", info.messageId);
    return {
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return { success: false, error };
  }
}

// 残りのテンプレート関数は同じ...
```

## 4. Gmail アプリパスワードの取得方法

1. Google アカウントにログイン
2. https://myaccount.google.com/security にアクセス
3. 「2 段階認証プロセス」を有効化
4. 「アプリパスワード」を検索
5. 「メール」「その他」を選択
6. 生成されたパスワードを`.env`の`EMAIL_PASSWORD`に設定

## 5. テスト

```bash
# 開発環境（ログのみ）
NODE_ENV=development npm run dev

# 本番環境（実際に送信）
NODE_ENV=production npm run dev
```

## トラブルシューティング

### Gmail で送信できない

- 2 段階認証が有効になっているか確認
- アプリパスワードを使用しているか確認
- 「安全性の低いアプリのアクセス」は不要（アプリパスワードを使用）

### 送信エラー

```bash
# 接続テスト
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```
