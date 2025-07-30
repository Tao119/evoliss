import { contactFuncs } from "@/model/contact";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const { funcName, param } = await req.json();
		if (!Object.keys(contactFuncs).includes(funcName)) {
			return NextResponse.json({ success: false });
		}
		const contact = await contactFuncs[funcName](param);
		return NextResponse.json({ success: true, data: contact });
	} catch (e) {
		console.error(e);
		return NextResponse.json({ success: false });
	}
}