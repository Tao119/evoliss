import { prisma } from "@/lib/prisma";

export const accessFuncs: { [funcName: string]: Function } = {
    createAccess,
};

async function createAccess({
    userId,
    courseId
}: {
    userId: number;
    courseId: number;
}) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recentAccess = await prisma.courseAccess.findFirst({
        where: {
            userId,
            courseId,
            createdAt: {
                gte: fiveMinutesAgo,
            },
        },
    });

    if (recentAccess) {
        return { success: false, message: "5分以内のアクセスが既に存在します。" };
    }

    return prisma.courseAccess.create({
        data: {
            userId,
            courseId
        },
    });
}
