import { NextRequest, NextResponse } from "next/server";
import { notificationFuncs } from "@/model/notification";

export async function POST(request: NextRequest) {
	try {
		const { funcName, param } = await request.json();

		if (!funcName || !notificationFuncs[funcName]) {
			return NextResponse.json(
				{ success: false, error: "Invalid function name" },
				{ status: 400 }
			);
		}

		const result = await notificationFuncs[funcName](param);

		return NextResponse.json({ success: true, data: result });
	} catch (error: any) {
		console.error("Notification API Error:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
