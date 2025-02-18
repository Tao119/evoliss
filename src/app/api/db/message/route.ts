import { messageFuncs } from "@/model/message";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { funcName, param } = await req.json();
        if (!Object.keys(messageFuncs).includes(funcName)) {
            return NextResponse.json({ success: false, message: "Invalid function" });
        }
        const result = await messageFuncs[funcName](param);
        return NextResponse.json({ success: true, data: result });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false, message: "Error occurred" });
    }
}
