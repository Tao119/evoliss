import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { withTransaction, safeTransaction } from "@/lib/transaction";

export const messageFuncs: { [funcName: string]: Function } = {
	readRoomByUserAndCourseId,
	readRoomByKey,
	sendMessage,
	sendFirstMessage,
	confirmUser,
	markMessagesAsRead,
	readMessageRoomByKey,
	readMessagesByRoomId,
	// sendSystemMessage
};

async function readRoomByUserAndCourseId({
	userId,
	coachId,
}: { userId: number; coachId: number }) {
	return await prisma.messageRoom.findFirst({
		where: {
			customerId: userId,
			coachId,
		},
	});
}

async function confirmUser({
	userId,
	roomKey,
}: { userId: number; roomKey: string }) {
	const room = await prisma.messageRoom.findUnique({
		where: { roomKey },
	});

	if (!room || (room.customerId !== userId && room.coachId !== userId)) {
		return false;
	}
	return true;
}

async function readRoomByKey({ roomKey }: { roomKey: string }) {
	return await prisma.messageRoom.findUnique({
		where: { roomKey },
		select: {
			id: true,
			customerId: true,
			customer: true,
			coach: { include: { courses: true } },
			messages: { include: { sender: true } },
		},
	});
}

async function sendMessage({
	roomId,
	senderId,
	content,
}: { roomId: number; senderId: number; content: string }) {
	return safeTransaction(async (tx) => {
		const room = await tx.messageRoom.findUnique({
			where: { id: roomId },
		});

		if (!room || (room.customerId !== senderId && room.coachId !== senderId)) {
			throw new Error("Unauthorized");
		}

		return await tx.message.create({
			data: {
				roomId,
				senderId,
				content,
			},
			include: { sender: true },
		});
	});
}

// async function sendSystemMessage({ userId, coachId, timeSlotId }: { userId: number; coachId: number, timeSlotId: number }) {

//     console.log("sendsystem", { userId, coachId, timeSlotId })
//     const existingRoom = await prisma.messageRoom.findFirst({
//         where: {
//             customerId: userId,
//             coachId
//         },
//     });

//     console.log("existingRoom", existingRoom)
//     if (existingRoom) {
//         await prisma.purchaseMessage.create({
//             data: {
//                 roomId: existingRoom.id,
//                 senderId: userId,
//                 timeSlotId
//             },
//         });
//         return existingRoom
//     }
//     let roomKey: string = "";
//     let isUnique = false;

//     while (!isUnique) {
//         roomKey = nanoid(10);
//         const existingKey = await prisma.messageRoom.findUnique({
//             where: { roomKey },
//         });

//         if (!existingKey) {
//             isUnique = true;
//         }
//     }

//     const newRoom = await prisma.messageRoom.create({
//         data: {
//             roomKey,
//             customerId: userId,
//             coachId,
//         },
//     });
//     console.log("newRoom", newRoom)

//     await prisma.purchaseMessage.create({
//         data: {
//             roomId: newRoom.id,
//             senderId: userId,
//             timeSlotId
//         },
//     });

//     return newRoom
// }

async function sendFirstMessage({
	userId,
	coachId,
	content,
}: { userId: number; coachId: number; content: string }) {
	return withTransaction(async (tx) => {
		const existingRoom = await tx.messageRoom.findFirst({
			where: {
				customerId: userId,
				coachId,
			},
		});

		if (existingRoom) {
			await tx.message.create({
				data: {
					roomId: existingRoom.id,
					senderId: userId,
					content,
				},
			});
			return existingRoom;
		}
		let roomKey = "";
		let isUnique = false;

		while (!isUnique) {
			roomKey = nanoid(10);
			const existingKey = await tx.messageRoom.findUnique({
				where: { roomKey },
			});

			if (!existingKey) {
				isUnique = true;
			}
		}

		const newRoom = await tx.messageRoom.create({
			data: {
				roomKey,
				customerId: userId,
				coachId,
			},
		});

		await tx.message.create({
			data: {
				roomId: newRoom.id,
				senderId: userId,
				content,
			},
		});

		return newRoom;
	});
}

export async function markMessagesAsRead({
	userId,
	roomKey,
}: { userId: number; roomKey: string }) {
	return safeTransaction(async (tx) => {
		await tx.message.updateMany({
			where: {
				room: { roomKey },
				senderId: { not: userId },
				isRead: false,
			},
			data: { isRead: true },
		});
		// await tx.purchaseMessage.updateMany({
		//     where: {
		//         room: { roomKey },
		//         senderId: { not: userId },
		//         isRead: false,
		//     },
		//     data: { isRead: true },
		// });
		return true;
	});
}

async function readMessageRoomByKey({ roomKey }: { roomKey: string }) {
	return await prisma.messageRoom.findUnique({
		where: { roomKey },
		include: {
			customer: true,
			coach: true,
			messages: {
				include: { sender: true },
				orderBy: { sentAt: "asc" },
			},
		},
	});
}

async function readMessagesByRoomId({ roomId }: { roomId: number }) {
	return await prisma.message.findMany({
		where: { roomId },
		include: { sender: true },
		orderBy: { sentAt: "asc" },
	});
}
