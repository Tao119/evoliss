import { prisma } from "@/lib/prisma";
import { safeTransaction } from "@/lib/transaction";
import { withCache, CACHE_PREFIX, CACHE_TTL, createCacheInvalidator } from "@/lib/cache";
import { coachFuncs } from "./coach";

const { invalidateCoachCache } = coachFuncs;

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
	invalidateUserCache,
};

// キャッシュ無効化関数
const userCacheInvalidator = createCacheInvalidator(CACHE_PREFIX.USER);

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
					reservations: {
						include: {
							timeSlots: true, customer: true, refunds: {
								include: {
									reservation: { include: { course: { include: { coach: true } } } },
								},
							},
						}
					},
					tagCourses: {
						include: {
							tag: true,
						},
					},
				},
			},
			paymentAccount: true,

			userPayment: true,
		},
	});
}
async function readUserById({ id, forceRefresh = false }: { id: number; forceRefresh?: boolean }) {
	const cacheKey = `${CACHE_PREFIX.USER}${id}`;

	// forceRefreshがtrueの場合はキャッシュをスキップして直接データベースから取得
	if (forceRefresh) {
		// キャッシュを無効化
		await userCacheInvalidator.invalidateById(id);

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
				userPayment: true,
				reservations: {
					select: {
						id: true,
						status: true,
						courseTime: true,
						createdAt: true,
						customerId: true,
						courseId: true,
					},
				},
				game: true,
			},
		});
	}

	return withCache(
		cacheKey,
		async () => {
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
					userPayment: true,
					reservations: {
						include: {
							course: {
								include: {
									coach: true, game: true,
									tagCourses: {
										include: {
											tag: true,
										},
									},
								}
							},
							review: true,
							timeSlots: true,

						}
					},
					game: true,
				},
			});
		},
		CACHE_TTL.SHORT
	);
}

async function readUserByEmail({ email, forceRefresh = false }: { email: string; forceRefresh?: boolean }) {
	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) return null;
	return readUserById({ id: user.id, forceRefresh });
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
	youtube,
	x,
	note
}: {
	id: number;
	bio?: string;
	icon?: string;
	name?: string;
	youtube?: string;
	x?: string;
	note?: string;
	gameId?: number;
}) {
	const result = await safeTransaction(async (tx) => {
		return tx.user.update({
			where: { id },
			data: { bio, icon, name, gameId, youtube, note, x },
		});
	});

	// キャッシュの無効化
	if (result) {
		await invalidateUserCache(id);
	}

	return result;
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
	const result = await safeTransaction(async (tx) => {
		return tx.user.update({
			where: { id },
			data: { bio, icon, name, isInitialized: true },
		});
	});

	// キャッシュの無効化
	if (result) {
		await invalidateUserCache(id);
	}

	return result;
}

// ユーザーキャッシュを無効化
async function invalidateUserCache(id?: number) {
	if (id) {
		// 特定のユーザーのキャッシュを削除
		await userCacheInvalidator.invalidateById(id);
		// コーチとして活動している場合はコーチキャッシュも無効化
		await invalidateCoachCache(id);
	} else {
		// 全てのユーザーキャッシュを削除
		await userCacheInvalidator.invalidateAll();
	}
}
