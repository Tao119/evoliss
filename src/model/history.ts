import { prisma } from "@/lib/prisma";

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
    return prisma.searchHistory.create({
        data: {
            userId,
            query,
        },
    });
}

async function deleteHistoryFromList({ id }: { id: number }) {
    return prisma.searchHistory.update({
        where: { id },
        data: { show: false },
    });
}
