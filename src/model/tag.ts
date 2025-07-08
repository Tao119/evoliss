import { prisma } from "@/lib/prisma";

export const tagFuncs: { [funcName: string]: Function } = {
	readTags,
};

async function readTags() {
	console.log(prisma.tag);
	const data = await prisma.tag.findMany({});
	return data;
}
