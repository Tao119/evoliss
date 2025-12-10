// AWS SES テストスクリプト
require("dotenv").config();
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// テスト用メールアドレス（検証済みのアドレスに変更してください）
const TEST_EMAIL = process.argv[2] || "your-email@example.com";

async function testSES() {
  console.log("🔍 AWS SES 接続テスト開始...\n");

  // 環境変数の確認
  console.log("📋 環境変数チェック:");
  console.log("  EMAIL_FROM:", process.env.EMAIL_FROM || "❌ 未設定");
  console.log("  AWS_REGION:", process.env.AWS_REGION || "❌ 未設定");
  console.log(
    "  AWS_ACCESS_KEY_ID:",
    process.env.AWS_ACCESS_KEY_ID ? "✅ 設定済み" : "❌ 未設定"
  );
  console.log(
    "  AWS_SECRET_ACCESS_KEY:",
    process.env.AWS_SECRET_ACCESS_KEY ? "✅ 設定済み" : "❌ 未設定"
  );
  console.log("");

  if (
    !process.env.EMAIL_FROM ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
    console.error("❌ 必要な環境変数が設定されていません");
    console.log("\n💡 .env ファイルに以下を設定してください:");
    console.log("  EMAIL_FROM=noreply@evoliss.com");
    console.log("  AWS_ACCESS_KEY_ID=your_access_key");
    console.log("  AWS_SECRET_ACCESS_KEY=your_secret_key");
    console.log("  AWS_REGION=ap-northeast-1");
    process.exit(1);
  }

  try {
    // SESクライアントの作成
    const client = new SESClient({
      region: process.env.AWS_REGION || "ap-northeast-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log("📧 テストメール送信中...");
    console.log("  送信元:", process.env.EMAIL_FROM);
    console.log("  送信先:", TEST_EMAIL);
    console.log("");

    // メール送信コマンド
    const command = new SendEmailCommand({
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [TEST_EMAIL],
      },
      Message: {
        Subject: {
          Data: "【Evoliss】AWS SES テストメール",
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: `
              <h2>AWS SES テストメール</h2>
              <p>このメールは AWS SES の動作確認用です。</p>
              <p>メール送信機能が正常に動作しています！</p>
              <hr>
              <p style="color: #666; font-size: 12px;">
                送信元: ${process.env.EMAIL_FROM}<br>
                リージョン: ${process.env.AWS_REGION || "ap-northeast-1"}<br>
                送信日時: ${new Date().toLocaleString("ja-JP")}
              </p>
            `,
            Charset: "UTF-8",
          },
          Text: {
            Data: `
AWS SES テストメール

このメールは AWS SES の動作確認用です。
メール送信機能が正常に動作しています！

送信元: ${process.env.EMAIL_FROM}
リージョン: ${process.env.AWS_REGION || "ap-northeast-1"}
送信日時: ${new Date().toLocaleString("ja-JP")}
            `,
            Charset: "UTF-8",
          },
        },
      },
    });

    // メール送信
    const response = await client.send(command);

    console.log("✅ メール送信成功！");
    console.log("  Message ID:", response.MessageId);
    console.log("");
    console.log("📬 メールボックスを確認してください");
    console.log("  ※スパムフォルダも確認してください");
    console.log("");
    console.log("🎉 AWS SES が正常に動作しています！");
  } catch (error) {
    console.error("❌ エラーが発生しました:", error.message);
    console.log("");

    // エラー別の対処法
    if (error.message.includes("not verified")) {
      console.log("💡 対処法:");
      console.log("  1. AWS SES コンソールで送信元メールアドレスを検証");
      console.log("  2. サンドボックスモードの場合、送信先も検証が必要");
      console.log("  3. https://console.aws.amazon.com/ses/");
    } else if (error.message.includes("security token")) {
      console.log("💡 対処法:");
      console.log("  1. AWS_ACCESS_KEY_ID と AWS_SECRET_ACCESS_KEY を確認");
      console.log("  2. IAM ユーザーが正しく作成されているか確認");
    } else if (error.message.includes("not authorized")) {
      console.log("💡 対処法:");
      console.log("  1. IAM ユーザーに SES 送信権限があるか確認");
      console.log("  2. ポリシーが正しくアタッチされているか確認");
    } else {
      console.log("💡 詳細は docs/AWS_SES_SETUP_GUIDE.md を参照してください");
    }
  }
}

// 使い方の表示
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("AWS SES テストスクリプト");
  console.log("");
  console.log("使い方:");
  console.log("  node scripts/test-ses.js [送信先メールアドレス]");
  console.log("");
  console.log("例:");
  console.log("  node scripts/test-ses.js test@example.com");
  console.log("");
  console.log("注意:");
  console.log("  - .env ファイルに AWS 認証情報を設定してください");
  console.log("  - サンドボックスモードでは検証済みアドレスにのみ送信可能");
  process.exit(0);
}

testSES();
