import { prisma } from "@/lib/prisma";
import { safeTransaction } from "@/lib/transaction";
import { ContactStatus } from "@/type/models";

export const contactFuncs: { [funcName: string]: Function } = {
	createContact,
	readContacts,
	readContactById,
	updateContactStatus,
	readContactsByStatus,
	readContactsCount,
};

// お問い合わせを作成
async function createContact({
	name,
	email,
	message,
}: {
	name: string;
	email: string;
	message: string;
}) {
	return await safeTransaction(async (tx) => {
		return await tx.contact.create({
			data: {
				name,
				email,
				message,
				status: ContactStatus.Pending,
			},
		});
	});
}

// お問い合わせ一覧を取得
async function readContacts({
	page = 1,
	total = 20,
}: {
	page?: number;
	total?: number;
}) {
	const skip = (page - 1) * total;

	return await prisma.contact.findMany({
		skip,
		take: total,
		orderBy: {
			createdAt: "desc",
		},
	});
}

// 特定のお問い合わせを取得
async function readContactById({ id }: { id: number }) {
	return await prisma.contact.findUnique({
		where: { id },
	});
}

// お問い合わせのステータスを更新
async function updateContactStatus({
	id,
	status,
}: {
	id: number;
	status: ContactStatus;
}) {
	return await safeTransaction(async (tx) => {
		return await tx.contact.update({
			where: { id },
			data: { status },
		});
	});
}

// ステータス別にお問い合わせを取得
async function readContactsByStatus({
	status,
	page = 1,
	total = 20,
}: {
	status: ContactStatus;
	page?: number;
	total?: number;
}) {
	const skip = (page - 1) * total;

	return await prisma.contact.findMany({
		where: { status },
		skip,
		take: total,
		orderBy: {
			createdAt: "desc",
		},
	});
}

// お問い合わせの総数を取得
async function readContactsCount({ status }: { status?: ContactStatus }) {
	return await prisma.contact.count({
		where: status !== undefined ? { status } : undefined,
	});
}
