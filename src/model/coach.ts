import { prisma } from "@/lib/prisma";
import { calculateScore } from "@/services/calcScore";

export const coachFuncs: { [funcName: string]: Function } = {
    readCoachById,
    readCoaches,
    readTopCoaches,
    readCoachesByQuery
};

async function readCoachById({ id }: { id: number }) {
    return prisma.user.findUnique({
        where: { id },
        include: {
            courses: {
                include: {
                    reviews: true,
                },
            },
            userGames: {
                include: {
                    game: true,
                },
            },
        },
    });
}


async function readCoaches() {
    return prisma.user.findMany({
        where: {
            courses: {
                some: {},
            },
        },
        include: {
            courses: {
                include: {
                    reviews: true,
                },
            },
            userGames: {
                include: {
                    game: true,
                },
            },
        },
    });
}


async function readTopCoaches() {
    const coaches = await prisma.user.findMany({
        where: {
            courses: {
                some: {},
            },
        },
        include: {
            courses: {
                include: {
                    reviews: true,
                    accesses: true,
                },
            },
            userGames: {
                include: {
                    game: true,
                },
            },
        },
    });
    const sortedCoaches = coaches
        .map((coach) => ({
            ...coach,
            accessCount: coach.courses.reduce(
                (sum, course) => sum + (course.accesses?.length || 0),
                0
            ),
        }))
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10);

    return sortedCoaches;
}
async function readCoachesByQuery({ query }: { query: string }) {
    query = query.toLowerCase();

    const coaches = await prisma.user.findMany({
        include: {
            courses: {
                include: {
                    reviews: true,
                    accesses: true,
                },
            },
            userGames: {
                include: {
                    game: true,
                },
            },
        },
        where: {
            AND: [
                { name: { contains: query } },
                { courses: { some: {} } }
            ]
        },
        take: 50,
    });
    console.log("coaches")
    console.log(coaches)

    return coaches
        .map((coach) => ({
            ...coach,
            // score: calculateScore(coach, query),
        }))
        .sort(
            (a, b) =>
                b.courses.reduce((sum, course) => sum + course.accesses.length, 0) -
                a.courses.reduce((sum, course) => sum + course.accesses.length, 0)
        )
        .slice(0, 10);
}
