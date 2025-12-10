import { prisma } from "@/lib/prisma";
import { safeTransaction } from "@/lib/transaction";

export const notificationFuncs: { [funcName: string]: Function } = {
	createNotification,
	readNotificationsByUserId,
	markNotificationAsRead,
	markAllNotificationsAsRead,
	deleteNotification,
	getUnreadNotificationCount,
};

async function createNotification({
	userId,
	type,
	title,
	message,
	relatedId,
}: {
	userId: number;
	type: string;
	title: string;
	message: string;
	relatedId?: number;
}) {
	return await safeTransaction(async (tx) => {
		return await tx.notification.create({
			data: {
				userId,
				type,
				title,
				message,
				relatedId,
			},
		});
	});
}

async function readNotificationsByUserId({
	userId,
	limit = 50,
}: {
	userId: number;
	limit?: number;
}) {
	return await prisma.notification.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		take: limit,
	});
}

async function markNotificationAsRead({ id }: { id: number }) {
	return await safeTransaction(async (tx) => {
		return await tx.notification.update({
			where: { id },
			data: { isRead: true },
		});
	});
}

async function markAllNotificationsAsRead({ userId }: { userId: number }) {
	return await safeTransaction(async (tx) => {
		return await tx.notification.updateMany({
			where: { userId, isRead: false },
			data: { isRead: true },
		});
	});
}

async function deleteNotification({ id }: { id: number }) {
	return await safeTransaction(async (tx) => {
		return await tx.notification.delete({
			where: { id },
		});
	});
}

async function getUnreadNotificationCount({ userId }: { userId: number }) {
	return await prisma.notification.count({
		where: { userId, isRead: false },
	});
}
