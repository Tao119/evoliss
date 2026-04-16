const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
	const games = [
		{ name: "ポケモンカードゲーム" },
		{ name: "遊戯王OCG" },
		{ name: "マジック：ザ・ギャザリング" },
		{ name: "ヴァンガード" },
		{ name: "デュエル・マスターズ" },
	];

	for (const game of games) {
		const existing = await prisma.game.findFirst({ where: { name: game.name } });
		if (!existing) {
			await prisma.game.create({ data: game });
			console.log(`ゲーム追加: ${game.name}`);
		} else {
			console.log(`ゲームはすでに存在: ${game.name}`);
		}
	}

	const tags = [
		{ name: "初心者向け" },
		{ name: "中級者向け" },
		{ name: "上級者向け" },
		{ name: "デッキ構築" },
		{ name: "プレイング" },
		{ name: "大会対策" },
		{ name: "環境デッキ" },
		{ name: "カジュアル" },
	];

	for (const tag of tags) {
		const existing = await prisma.tag.findFirst({ where: { name: tag.name } });
		if (!existing) {
			await prisma.tag.create({ data: tag });
			console.log(`タグ追加: ${tag.name}`);
		} else {
			console.log(`タグはすでに存在: ${tag.name}`);
		}
	}

	console.log("シード完了");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
