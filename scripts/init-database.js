const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log("🚀 データベース初期化を開始します...");

    // 1. Gameテーブルに「ポケモンカード」を挿入
    console.log("📦 Gameテーブルにポケモンカードを挿入中...");

    // 既存のポケモンカードゲームをチェック
    const existingGame = await prisma.game.findFirst({
      where: { name: "ポケモンカード" },
    });

    let gameId;
    if (existingGame) {
      console.log(
        "✅ ポケモンカードは既に存在します (ID: " + existingGame.id + ")"
      );
      gameId = existingGame.id;
    } else {
      const game = await prisma.game.create({
        data: {
          name: "ポケモンカード",
          image: null, // 必要に応じて後で画像URLを設定
        },
      });
      console.log("✅ ポケモンカードを挿入しました (ID: " + game.id + ")");
      gameId = game.id;
    }

    // 2. Tagテーブルにタグを挿入
    console.log("🏷️ Tagテーブルにタグを挿入中...");

    const tags = [
      "初心者向け",
      "上級者向け",
      "ジュニア向け",
      "特定デッキの基礎講座",
      "特定デッキの応用講座",
      "対面講座",
      "オンライン講座",
      "PTCGL",
      "社会人講師",
      "複数人OK",
    ];

    const createdTags = [];

    for (const tagName of tags) {
      // 既存のタグをチェック
      const existingTag = await prisma.tag.findFirst({
        where: { name: tagName },
      });

      if (existingTag) {
        console.log(
          `✅ タグ「${tagName}」は既に存在します (ID: ${existingTag.id})`
        );
        createdTags.push(existingTag);
      } else {
        const tag = await prisma.tag.create({
          data: { name: tagName },
        });
        console.log(`✅ タグ「${tagName}」を挿入しました (ID: ${tag.id})`);
        createdTags.push(tag);
      }
    }

    // 3. 結果の確認
    console.log("\n📊 初期化結果:");
    console.log(`- Game: ${gameId} (ポケモンカード)`);
    console.log(`- Tags: ${createdTags.length}個のタグ`);

    createdTags.forEach((tag) => {
      console.log(`  - ${tag.id}: ${tag.name}`);
    });

    console.log("\n🎉 データベース初期化が完了しました！");
  } catch (error) {
    console.error("❌ データベース初期化エラー:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトが直接実行された場合
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log("✅ 初期化スクリプトが正常に完了しました");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 初期化スクリプトでエラーが発生しました:", error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
