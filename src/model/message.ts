import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export const messageFuncs: { [funcName: string]: Function } = {
    readRoomByUserAndCourseId,
    readRoomByKey,
    sendMessage,
    sendFirstMessage,
    confirmUser,
    markMessagesAsRead
};


// 🔹 メッセージルームの取得（特定のユーザーとコースに関連）
async function readRoomByUserAndCourseId({ userId, courseId }: { userId: number; courseId: number }) {
    return await prisma.messageRoom.findFirst({
        where: {
            customerId: userId,
            courseId,
        },
    });
}

// 🔹 ルームのユーザー確認
async function confirmUser({ userId, roomKey }: { userId: number; roomKey: string }) {
    const room = await prisma.messageRoom.findUnique({
        where: { roomKey },
        include: { course: true },
    });

    if (!room || (room.customerId !== userId && room.course.coachId !== userId)) {
        return false;
    }
    return true;
}

async function readRoomByKey({ roomKey }: { roomKey: string }) {
    return await prisma.messageRoom.findUnique({
        where: { roomKey },
        select: { id: true, customerId: true, course: { select: { coach: { select: { name: true, icon: true, courses: true } }, title: true } }, messages: { include: { sender: true } } },
    });
}

async function sendMessage({ userId, roomKey, content }: { userId: number; roomKey: string; content: string }) {
    const room = await prisma.messageRoom.findUnique({
        where: { roomKey },
        select: { id: true, customerId: true, course: { select: { coachId: true } } },
    });

    if (!room || (room.customerId !== userId && room.course.coachId !== userId)) {
        throw new Error("Unauthorized");
    }

    return await prisma.message.create({
        data: {
            roomId: room.id,
            senderId: userId,
            content,
        },
        include: { room: true }
    });
}


async function sendFirstMessage({ userId, courseId, content }: { userId: number; courseId: number; content: string }) {
    const existingRoom = await prisma.messageRoom.findFirst({
        where: {
            customerId: userId,
            courseId,
        },
    });


    if (existingRoom) {
        return await prisma.message.create({
            data: {
                roomId: existingRoom.id,
                senderId: userId,
                content,
            },
        });
    }
    let roomKey: string = "";
    let isUnique = false;

    while (!isUnique) {
        roomKey = nanoid(10);
        const existingKey = await prisma.messageRoom.findUnique({
            where: { roomKey },
        });

        if (!existingKey) {
            isUnique = true;
        }
    }

    const newRoom = await prisma.messageRoom.create({
        data: {
            roomKey,
            customerId: userId,
            courseId,
        },
    });

    await prisma.message.create({
        data: {
            roomId: newRoom.id,
            senderId: userId,
            content,
        },
    });

    return newRoom
}

export async function markMessagesAsRead({ userId, roomKey }: { userId: number; roomKey: string }) {
    return await prisma.message.updateMany({
        where: {
            room: { roomKey },
            senderId: { not: userId }, // 自分が送ったものは関係なし
            isRead: false,
        },
        data: { isRead: true },
    });
}