import { prisma } from "@/lib/prisma";

export const notificationFuncs: { [funcName: string]: Function } = {
    createNotification,
    readNotification,
    getNotificationsByUserId
};

export async function getNotificationsByUserId({ userId }: { userId: number }) {
    return await prisma.notification.findMany({
        where: { userId },
        include: { sender: true }
    });
}

async function createNotification({
    userId,
    content,
    senderId
}: {
    userId: number;
    senderId?: number;
    content: string
}) {
    return await prisma.notification.create({
        data: {
            userId,
            content,
            senderId
        }
    })
}

export async function readNotification({ id }: { id: number }) {
    return await prisma.notification.updateMany({
        where: { id },
        data: { isRead: true },
    });
}