// テスト用通知を作成するスクリプト
// 使い方: node scripts/create-test-notification.js <userId>

const axios = require("axios");

const userId = process.argv[2];

if (!userId) {
  console.error("❌ エラー: ユーザーIDを指定してください");
  console.log("使い方: node scripts/create-test-notification.js <userId>");
  process.exit(1);
}

async function createTestNotification() {
  try {
    console.log(`🔔 ユーザー${userId}にテスト通知を作成中...`);

    const response = await axios.post(
      "http://localhost:3000/api/db/notification",
      {
        funcName: "createNotification",
        userId: parseInt(userId),
        type: "test",
        title: "テスト通知",
        message: "これはテスト通知です。通知機能が正しく動作しています！",
        relatedId: null,
      }
    );

    if (response.data.success) {
      console.log("✅ テスト通知を作成しました！");
      console.log("📱 ブラウザで通知ベルを確認してください");
      console.log("\n通知内容:");
      console.log(JSON.stringify(response.data.data, null, 2));
    } else {
      console.error("❌ 通知の作成に失敗しました:", response.data.error);
    }
  } catch (error) {
    console.error("❌ エラー:", error.message);
    if (error.response) {
      console.error("レスポンス:", error.response.data);
    }
  }
}

createTestNotification();
