import { prisma } from "@/lib/prisma";
import { safeTransaction } from "@/lib/transaction";

export const historyFuncs: { [funcName: string]: Function } = {
	createHistory,
	deleteHistoryFromList,
};

async function createHistory({
	userId,
	query,
}: {
	userId: number;
	query: string;
}) {
	return safeTransaction(async (tx) => {
		return tx.searchHistory.create({
			data: {
				userId,
				query,
			},
		});
	});
}

async function deleteHistoryFromList({ id }: { id: number }) {
	return safeTransaction(async (tx) => {
		return tx.searchHistory.update({
			where: { id },
			data: { show: false },
		});
	});
}
