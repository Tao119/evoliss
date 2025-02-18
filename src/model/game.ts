import { prisma } from "@/lib/prisma";
import { calculateScore } from "@/services/calcScore";

export const gameFuncs: { [funcName: string]: Function } = {
    readGames,
    readTopGames,
    readGameById,
    readGamesByQuery
};


async function readGameById({ id }: { id: number }) {
    return prisma.game.findUnique({
        where: { id },
        include: {
            courses: {
                include: {
                    coach: true,
                    accesses: true,
                },
            },
            userGames: {
                include: {
                    user: true,
                },
            },
        },
    })
}

async function readGames() {
    return prisma.game.findMany({
        where: {
            courses: {
                some: {}
            },
        },
        include: {
            courses: {
                include: {
                    coach: true,
                    accesses: true,
                },
            },
            userGames: {
                include: {
                    user: true,
                },
            },
        },
    });
}

export async function readTopGames() {
    const games = await prisma.game.findMany({
        where: {
            courses: {
                some: {}
            },
        },
        include: {
            courses: {
                include: {
                    coach: true,
                    accesses: true,
                },
            },
            userGames: {
                include: {
                    user: true,
                },
            },
        },
    });

    const sortedGames = games
        .map((game) => ({
            ...game,
            accessCount: game.courses.reduce(
                (sum, c) => sum + (c.accesses?.length || 0),
                0
            ),
        }))
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10);

    return sortedGames;
}

async function readGamesByQuery({ query }: { query: string }) {
    query = query.toLowerCase();

    const games = await prisma.game.findMany({
        include: {
            courses: {
                include: {
                    coach: true,
                    accesses: true,
                },
            },
            userGames: {
                include: {
                    user: true,
                },
            },
        },
        where: { name: { contains: query } },
        take: 50,
    });

    return games
        .map((game) => ({
            ...game,
            // score: calculateScore(game, query),
        }))
        .sort(
            (a, b) =>
                b.courses.reduce((sum, course) => sum + course.accesses.length, 0) -
                a.courses.reduce((sum, course) => sum + course.accesses.length, 0)
        )
        .slice(0, 10);
}
