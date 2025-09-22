import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { withTransaction, safeTransaction } from "@/lib/transaction";
import { withCache, CACHE_PREFIX, CACHE_TTL, createCacheInvalidator, deleteCachedData } from "@/lib/cache";
import { userFuncs } from "./user";

const { invalidateUserCache } = userFuncs;

export const messageFuncs: { [funcName: string]: Function } = {
	readRoomByUserAndCourseId,
	readRoomByKey,
	sendMessage,
	sendFirstMessage,
	sendPurchaseMessage,
	confirmUser,
	markMessagesAsRead,
	readMessageRoomByKey,
	readMessagesByRoomId,
	invalidateMessageCache,
	// sendSystemMessage
};

// キャッシュ無効化関数
const messageCacheInvalidator = createCacheInvalidator(CACHE_PREFIX.MESSAGE);

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
	const result = await safeTransaction(async (tx) => {
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

	// メッセージ送信後にキャッシュを無効化
	if (result) {
		// ルーム情報を取得してroomKeyを取得
		const room = await prisma.messageRoom.findUnique({
			where: { id: roomId },
			select: { roomKey: true },
		});
		if (room) {
			await invalidateMessageCache(room.roomKey);
		}
		// ユーザーのキャッシュも無効化（メッセージ一覧が変わるため）
		const roomData = await prisma.messageRoom.findUnique({
			where: { id: roomId },
			select: { customerId: true, coachId: true },
		});
		if (roomData) {
			await invalidateUserCache(roomData.customerId);
			await invalidateUserCache(roomData.coachId);
		}
	}

	return result;
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

async function sendPurchaseMessage({
	userId,
	coachId,
	courseTitle,
}: { userId: number; coachId: number; courseTitle: string }) {
	return withTransaction(async (tx) => {
		// 既存のメッセージルームを探す
		const existingRoom = await tx.messageRoom.findFirst({
			where: {
				customerId: userId,
				coachId,
			},
		});

		const purchaseMessage = `${courseTitle}を購入いただき、ありがとうございます！講座に関してご質問がございましたら、お気軽にメッセージをお送りください。`;

		if (existingRoom) {
			// 既存のルームがある場合、そこにメッセージを送信
			const message = await tx.message.create({
				data: {
					roomId: existingRoom.id,
					senderId: coachId, // コーチからのメッセージ
					content: purchaseMessage,
				},
				include: { sender: true },
			});

			// キャッシュを無効化
			await invalidateMessageCache(existingRoom.roomKey);
			await invalidateUserCache(userId);
			await invalidateUserCache(coachId);

			return { room: existingRoom, message };
		} else {
			// 新しいルームを作成
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

			const message = await tx.message.create({
				data: {
					roomId: newRoom.id,
					senderId: coachId, // コーチからのメッセージ
					content: purchaseMessage,
				},
				include: { sender: true },
			});

			// キャッシュを無効化
			await invalidateUserCache(userId);
			await invalidateUserCache(coachId);

			return { room: newRoom, message };
		}
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
	const cacheKey = `${CACHE_PREFIX.MESSAGE}room:${roomKey}`;

	return withCache(
		cacheKey,
		async () => {
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
		},
		CACHE_TTL.SHORT // 5分キャッシュ（メッセージは頻繁に更新される）
	);
}

async function readMessagesByRoomId({ roomId }: { roomId: number }) {
	return await prisma.message.findMany({
		where: { roomId },
		include: { sender: true },
		orderBy: { sentAt: "asc" },
	});
}

// メッセージキャッシュを無効化
async function invalidateMessageCache(roomKey?: string) {
	if (roomKey) {
		// 特定のルームのキャッシュを削除
		await deleteCachedData(`${CACHE_PREFIX.MESSAGE}room:${roomKey}`);
	} else {
		// 全てのメッセージキャッシュを削除
		await messageCacheInvalidator.invalidateAll();
	}
}
