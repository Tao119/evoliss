import { prisma } from "@/lib/prisma";
import { calculateScore } from "@/services/calcScore";

export const courseFuncs: { [funcName: string]: Function } = {
    readCourses,
    readTopCourses,
    readCoursesByGameId,
    readCoursesNumByGameId,
    readCourseByPaymentId,
    readCourseById,
    createCourse,
    updateCourse,
    readCoursesNumByCoachId,
    readCoursesByCoachId,
    readRecommendedCourses,
    readCoursesByQuery,
};

async function readCourseById({ id }: { id: number }) {
    return await prisma.course.findUnique({
        where: { id },
        include: {
            coach: {
                select: {
                    id: true,
                    name: true,
                    bio: true,
                    icon: true,
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
            },
            reviews: {
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    customer: {
                        select: { id: true, name: true, icon: true },
                    },
                    createdAt: true,
                },
            },
            game: true,
            schedules: {
                select: {
                    id: true,
                    startTime: true,
                    reservations: true
                },
            },
        },
    });
}

async function readCourses() {
    return prisma.course.findMany({
        include: {
            coach: true,
            reviews: true,
            game: true,
            accesses: true,
        },
        orderBy: {
            accesses: {
                _count: "desc",
            },
        },
    });
}

async function readTopCourses() {
    return prisma.course.findMany({
        include: {
            coach: true,
            reviews: true,
            game: true,
            accesses: true,
        },
        orderBy: {
            accesses: {
                _count: "desc",
            },
        },
        take: 10,
    });
}


async function readCoursesByCoachId({ coachId, page, total }: { coachId: number, page: number; total: number }) {
    const skip = (page - 1) * total;
    return await prisma.course.findMany({
        where: { coachId },
        include: {
            coach: true,
            reviews: true,
            game: true,
            accesses: true,
        },
        skip: skip,
        take: total,
        orderBy: {
            accesses: {
                _count: "desc",
            },
        },
    });
}
async function readCoursesNumByCoachId({ coachId }: { coachId: number }) {
    const data = await prisma.course.findMany({
        where: { coachId },
        include: {
            coach: true,
            reviews: true,
            game: true,
            accesses: true,
        },
        orderBy: {
            accesses: {
                _count: "desc",
            },
        },
    });
    return data.length
}

async function readCoursesNumByGameId({ gameId }: { gameId: number }) {
    const data = await prisma.course.findMany({
        where: {
            gameId
        },
        include: {
            coach: true,
            reviews: true,
            game: true,
            accesses: true,
        },
        orderBy: {
            accesses: {
                _count: "desc",
            },
        },
    });
    return data.length
}

async function readCoursesByGameId({ gameId, page, total }: { gameId: number, page: number; total: number }) {
    const skip = (page - 1) * total;
    return await prisma.course.findMany({
        where: {
            gameId
        },
        skip: skip,
        take: total,
        include: {
            coach: true,
            reviews: true,
            game: true,
            accesses: true,
        },
        orderBy: {
            accesses: {
                _count: "desc",
            },
        },
    });
}

async function createCourse({
    title,
    description,
    price,
    coachId,
    schedules,
    image,
    tag,
}: {
    title: string;
    description: string;
    price: number;
    coachId: number;
    schedules: Date[];
    image?: string;
    tag: string;
}) {
    try {
        const games = await prisma.game.findMany({
            where: { name: tag }
        });

        let game = games.find((g) => g.name === tag);
        if (!game) {
            game = await prisma.game.create({ data: { name: tag } });
        }

        const newCourse = await prisma.course.create({
            data: {
                title,
                description,
                price,
                coachId,
                image,
                gameId: game.id
            },
        });


        await prisma.schedule.createMany({
            data: schedules
                .filter((schedule) => schedule != null)
                .map((schedule) => {
                    return {
                        courseId: newCourse.id,
                        startTime: new Date(schedule),
                    }
                }),
        });
        return newCourse;
    } catch (error) {
        console.error("❌ Error creating course:", error);
        return { success: false, message: "講座の作成に失敗しました。" };
    }
}



async function updateCourse({
    id,
    title,
    description,
    price,
    schedules,
    image,
    tag,
}: {
    id: number;
    title?: string;
    description?: string;
    price: number;
    schedules?: Date[];
    image?: string;
    tag?: string;
}) {
    try {
        let gameId: number | undefined;

        if (tag) {
            const games = await prisma.game.findMany({
                where: { name: tag }
            });
            let game = games.find((g) => g.name === tag)

            if (!game) {
                game = await prisma.game.create({
                    data: { name: tag }
                });
            }

            gameId = game.id;
        }

        if (schedules && schedules.length > 0) {
            const existingSchedules = await prisma.schedule.findMany({
                where: { courseId: id },
                select: {
                    id: true,
                    startTime: true,
                },
            });

            const schedulesToDelete = existingSchedules.filter(
                (existing) =>
                    !schedules.some(
                        (newSchedule) =>
                            new Date(existing.startTime).getTime() === new Date(newSchedule).getTime()
                    )
            );

            const schedulesToAdd = schedules.filter(
                (newSchedule) =>
                    !existingSchedules.some(
                        (existing) =>
                            new Date(existing.startTime).getTime() === new Date(newSchedule).getTime()
                    )
            );

            if (schedulesToDelete.length > 0) {
                await prisma.schedule.deleteMany({
                    where: {
                        id: { in: schedulesToDelete.map((s) => s.id) },
                    },
                });
            }

            if (schedulesToAdd.length > 0) {
                await prisma.schedule.createMany({
                    data: schedulesToAdd.map((schedule) => ({
                        courseId: id,
                        startTime: schedule,
                    })),
                });
            }
        }

        return prisma.course.update({
            where: { id },
            data: { title, description, price, image, gameId },
        });

    } catch (error) {
        console.error("Error editing course:", error);
        return { success: false, message: "講座の作成に失敗しました。" };
    }
}



async function readRecommendedCourses({ userId, courseId }: { userId: number; courseId: number }) {
    try {
        const userSearchHistory = await prisma.searchHistory.findMany({
            where: { userId },
            select: { query: true },
        });

        const searchKeywords = userSearchHistory.map((history) => history.query.toLowerCase());
        const courses = await prisma.course.findMany({
            include: {
                coach: {
                    select: { id: true, name: true, icon: true },
                },
                reviews: {
                    select: { rating: true },
                },
                game: {
                    select: { name: true },
                },
                accesses: {
                    select: { createdAt: true },
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                },
            },
        });

        const maxAccessCount = Math.max(...courses.map((c) => c.accesses.length), 1);
        const scoredCourses = courses.map((course) => {
            let searchScore = 0;
            if (searchKeywords.length > 0) {
                const matchCount = searchKeywords.filter((keyword) =>
                    course.title.toLowerCase().includes(keyword) ||
                    (course.game?.name && course.game.name.toLowerCase().includes(keyword))
                ).length;
                searchScore = (matchCount / searchKeywords.length) * 100;
            }

            const avgRating = course.reviews.length > 0
                ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
                : 0;
            const ratingScore = (avgRating / 5) * 100;

            const accessScore = (course.accesses.length / maxAccessCount) * 100;

            const totalScore = (searchScore * 0.5) + (ratingScore * 0.3) + (accessScore * 0.2);

            return { course, totalScore };
        });

        return scoredCourses
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 5)
            .map((c) => c.course);
    } catch (error) {
        console.error("Error recommend course:", error);
        return { success: false, message: "講座の作成に失敗しました。" };
    }
}

async function readCoursesByQuery({ query }: { query: string }) {
    query = query.toLowerCase();

    const courses = await prisma.course.findMany({
        include: {
            coach: {
                select: { id: true, name: true, icon: true },
            },
            reviews: {
                select: { rating: true },
            },
            game: {
                select: { name: true },
            },
            accesses: {
                select: { createdAt: true },
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            },
        },
        where: {
            OR: [
                { title: { contains: query } },
                { description: { contains: query } },
                { game: { name: { contains: query } } }
            ]
        },
        take: 50,
    });

    return courses
        .map((course) => ({
            ...course,
            // score: calculateScore(course, query),
        }))
        .sort((a, b) => b.accesses.length - a.accesses.length) // スコア順に並び替え
        .slice(0, 10); // トップ10を返す
}

async function readCourseByPaymentId({ paymentId }: { paymentId: number }) {
    return await prisma.course.findFirst({
        where: {
            schedules: {
                some: {
                    payments: {
                        some: {
                            id: paymentId,
                        },
                    },
                },
            },
        },
        include: {
            coach: {
                select: {
                    id: true,
                    name: true,
                    bio: true,
                    icon: true,
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
            },
            reviews: {
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    customer: {
                        select: { id: true, name: true, icon: true },
                    },
                    createdAt: true,
                },
            },
            game: true,
            schedules: {
                select: {
                    id: true,
                    startTime: true,
                    reservations: true
                },
            },
        },
    });
}