import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";
import { tree } from "next/dist/build/templates/app-page";

export const userFuncs: { [funcName: string]: Function } = {
    createUser,
    readUsers,
    updateUser,
    deleteUser,
    readUserByEmail,
    readUserById,
    updatePaymentAccount, savePayment
};

async function createUser({ email, name }: { email: string; name: string }) {
    return prisma.user.create({
        data: { email, name },
    });
}

async function readUsers() {
    return prisma.user.findMany({
        include: {
            courses: {
                include: {
                    coach: true,
                    reviews: true,
                    game: true,
                    reservations: { include: { schedule: true, customer: true } }
                }
            },
            userGames: {
                include: {
                    game: true,
                },
            },
            paymentAccount: true,
            refunds: { include: { reservation: { include: { course: { include: { coach: true } } } } } },
            userPayment: true,
        },
    });
}
async function readUserById({ id }: { id: number }) {
    return prisma.user.findUnique({
        where: { id },
        include: {
            courses: {
                include: {
                    coach: true,
                    reviews: true,
                    game: true,
                    messageRooms: {
                        include: {
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                    coach: {
                                        select: { id: true, name: true, icon: true },
                                    },
                                },
                            },
                            messages: {
                                orderBy: { sentAt: "asc" },
                                select: { content: true, sentAt: true, isRead: true, senderId: true },
                            },
                            purchaseMessages: {
                                orderBy: { sentAt: "asc" },
                                include: {
                                    sender: true, schedule: { include: { course: { include: { coach: true } } } }
                                }
                            },
                            customer: true,
                            reservations: true
                        },
                    },
                    reservations: { include: { schedule: true, customer: true, room: true } }
                }
            },
            userGames: {
                include: {
                    game: true,
                },
            },
            searchHistories: {
                where: { show: true },
                select: {
                    id: true,
                    query: true,
                },
                orderBy: {
                    searchedAt: "desc"
                }
            },
            messageRooms: {
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            coach: {
                                select: { id: true, name: true, icon: true },
                            },
                        },
                    },
                    messages: {
                        orderBy: { sentAt: "asc" },
                        select: { content: true, sentAt: true, isRead: true, senderId: true },
                    },
                    purchaseMessages: {
                        orderBy: { sentAt: "asc" },
                        include: {
                            sender: true, schedule: { include: { course: { include: { coach: true } } } }
                        }
                    },
                    customer: true
                },
            },
            paymentAccount: true,
            refunds: { include: { reservation: { include: { course: { include: { coach: true } } } } } },
            userPayment: true,
            reservations: { include: { course: { include: { coach: true } }, schedule: true, room: true } },
            notification: true
        },
    });
}

async function readUserByEmail({ email }: { email: string }) {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) return null
    return readUserById({ id: user.id });
}




async function deleteUser({ id }: { id: number }) {
    return prisma.user.delete({
        where: { id },
    });
}

async function updateUser({
    id,
    bio,
    header,
    icon,
    name,
    tags
}: {
    id: number;
    bio?: string;
    header?: string;
    icon?: string;
    name?: string,
    tags: string[]
}) {
    if (tags) {
        const existingGames = await prisma.game.findMany({
            where: { name: { in: tags } },
        });

        const existingGameNames = tags.map(tag => existingGames.find(game => game.name === tag)).filter(Boolean).map((t) => t && t.name);

        const newGames = tags.filter((tag) => !existingGameNames.includes(tag));

        if (newGames.length > 0) {
            await prisma.game.createMany({
                data: newGames.map((name) => ({ name })),
                skipDuplicates: false,
            });
        }

        const allGames = await prisma.game.findMany({
            where: { name: { in: tags } },
        });

        const sortedGames = tags.map(tag => allGames.find(game => game.name === tag)).filter(Boolean) as { id: number; name: string }[];

        const currentUserGames = await prisma.userGame.findMany({
            where: { userId: id },
        });
        const userGameIdsToRemove = currentUserGames
            .filter(userGame => !tags.includes(allGames.find(game => game.id === userGame.gameId)?.name || ""))
            .map(userGame => userGame.id);

        if (userGameIdsToRemove.length > 0) {
            await prisma.userGame.deleteMany({
                where: { id: { in: userGameIdsToRemove } },
            });
        }

        const existingUserGameIds = new Set(currentUserGames.map(ug => ug.gameId));
        const userGamesToAdd = sortedGames.filter(game => !existingUserGameIds.has(game.id));

        if (userGamesToAdd.length > 0) {
            await prisma.userGame.createMany({
                data: userGamesToAdd.map(game => ({
                    userId: id,
                    gameId: game.id,
                })),
            });
        }
    }

    return prisma.user.update({
        where: { id },
        data: { bio, header, icon, name },
    });
}
async function updatePaymentAccount({
    userId,
    bankName,
    branchName,
    accountType,
    accountNumber,
    accountHolder }: {
        userId: number,
        bankName: string,
        branchName: string,
        accountType: number,
        accountNumber: number,
        accountHolder: string
    }) {
    const existing = await prisma.paymentAccount.findUnique({
        where: { userId },
    });
    if (existing) {

        return prisma.paymentAccount.update({
            where: { userId },
            data: {
                bankName,
                branchName,
                accountType: accountType,
                accountNumber: accountNumber as unknown as string,
                accountHolder
            },
        })
    } else {
        return prisma.paymentAccount.create({
            data: {
                userId,
                bankName,
                branchName,
                accountType: accountType,
                accountNumber: accountNumber as unknown as string,
                accountHolder
            },

        });
    }
}


async function savePayment({
    userId,
    amount
}: {
    userId: number,
    amount: number
}) {
    console.log(userId, amount)
    return prisma.userPayment.create({
        data: {
            userId,
            amount
        },
    });
}