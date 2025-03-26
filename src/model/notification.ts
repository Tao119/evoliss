import { prisma } from "@/lib/prisma";

export const notificationFuncs: { [funcName: string]: Function } = {
    createNotification,
    markNotificationAsRead,
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
    senderId,
    roomId
}: {
    userId: number;
    senderId?: number;
    content: string
    roomId?: number
}) {
    return await prisma.notification.create({
        data: {
            userId,
            content,
            senderId,
            roomId
        }
    })
}

export async function markNotificationAsRead({ userId }: { userId: number }) {
    return await prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true },
    });
}
