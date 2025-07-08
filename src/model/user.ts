import { prisma } from "@/lib/prisma";
import { safeTransaction } from "@/lib/transaction";

export const userFuncs: { [funcName: string]: Function } = {
	createUser,
	readUsers,
	updateUser,
	deleteUser,
	readUserByEmail,
	readUserById,
	updatePaymentAccount,
	savePayment,
	initializeUser,
};

async function createUser({ email }: { email: string }) {
	return safeTransaction(async (tx) => {
		return tx.user.create({
			data: { email },
		});
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
					reservations: { include: { timeSlots: true, customer: true } },
					tagCourses: {
						include: {
							tag: true,
						},
					},
				},
			},
			paymentAccount: true,
			refunds: {
				include: {
					reservation: { include: { course: { include: { coach: true } } } },
				},
			},
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
					tagCourses: {
						include: {
							tag: true,
						},
					},
					reservations: { include: { timeSlots: true, customer: true } },
				},
			},
			searchHistories: {
				where: { show: true },
				select: {
					id: true,
					query: true,
				},
				orderBy: {
					searchedAt: "desc",
				},
			},
			customerMessageRooms: {
				include: {
					coach: {
						include: { timeSlots: true },
					},
					messages: {
						orderBy: { sentAt: "asc" },
						select: {
							content: true,
							sentAt: true,
							isRead: true,
							senderId: true,
						},
					},
					customer: true,
				},
			},
			coachMessageRooms: {
				include: {
					coach: {
						include: { timeSlots: true },
					},
					messages: {
						orderBy: { sentAt: "asc" },
						select: {
							content: true,
							sentAt: true,
							isRead: true,
							senderId: true,
						},
					},
					customer: true,
				},
			},
			paymentAccount: true,
			refunds: {
				include: {
					reservation: { include: { course: { include: { coach: true } } } },
				},
			},
			userPayment: true,
			reservations: {
				include: { course: { include: { coach: true } }, timeSlots: true },
			},
			game: true,
		},
	});
}

async function readUserByEmail({ email }: { email: string }) {
	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) return null;
	return readUserById({ id: user.id });
}

async function deleteUser({ id }: { id: number }) {
	return safeTransaction(async (tx) => {
		return tx.user.delete({
			where: { id },
		});
	});
}

async function updateUser({
	id,
	bio,
	icon,
	name,
	gameId,
}: {
	id: number;
	bio?: string;
	icon?: string;
	name?: string;
	gameId?: number;
}) {
	console.log({
		id,
		bio,
		icon,
		name,
		gameId,
	})
	return safeTransaction(async (tx) => {
		return tx.user.update({
			where: { id },
			data: { bio, icon, name, gameId },
		});
	});
}
async function updatePaymentAccount({
	userId,
	bankName,
	branchName,
	accountType,
	accountNumber,
	accountHolder,
}: {
	userId: number;
	bankName: string;
	branchName: string;
	accountType: number;
	accountNumber: number;
	accountHolder: string;
}) {
	return safeTransaction(async (tx) => {
		const existing = await tx.paymentAccount.findUnique({
			where: { userId },
		});
		if (existing) {
			return tx.paymentAccount.update({
				where: { userId },
				data: {
					bankName,
					branchName,
					accountType: accountType,
					accountNumber: accountNumber as unknown as string,
					accountHolder,
				},
			});
		} else {
			return tx.paymentAccount.create({
				data: {
					userId,
					bankName,
					branchName,
					accountType: accountType,
					accountNumber: accountNumber as unknown as string,
					accountHolder,
				},
			});
		}
	});
}

async function savePayment({
	userId,
	amount,
}: {
	userId: number;
	amount: number;
}) {
	console.log(userId, amount);
	return safeTransaction(async (tx) => {
		return tx.userPayment.create({
			data: {
				userId,
				amount,
			},
		});
	});
}

async function initializeUser({
	id,
	bio,
	icon,
	name,
}: {
	id: number;
	bio?: string;
	header?: string;
	icon?: string;
	name?: string;
}) {
	return safeTransaction(async (tx) => {
		return tx.user.update({
			where: { id },
			data: { bio, icon, name, isInitialized: true },
		});
	});
}
