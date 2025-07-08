import { prisma } from "@/lib/prisma";

export const notificationFuncs: { [funcName: string]: Function } = {
	createNotification,
	readNotifications,
	markAsRead,
	deleteNotification,
};

async function createNotification({
	userId,
	title,
	message,
	type,
}: {
	userId: number;
	title: string;
	message: string;
	type?: string;
}) {
	// For now, return a mock response since Notification model doesn't exist in schema
	return {
		id: Date.now(),
		userId,
		title,
		message,
		type: type || "info",
		isRead: false,
		createdAt: new Date(),
	};
}

async function readNotifications({ userId }: { userId: number }) {
	// For now, return empty array since Notification model doesn't exist in schema
	return [];
}

async function markAsRead({ notificationId }: { notificationId: number }) {
	// For now, return success response
	return { success: true };
}

async function deleteNotification({ notificationId }: { notificationId: number }) {
	// For now, return success response
	return { success: true };
}