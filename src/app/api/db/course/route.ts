import { courseFuncs } from "@/model/course";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { funcName, param } = await req.json();
        if (!Object.keys(courseFuncs).includes(funcName)) {
            return NextResponse.json({ success: false });
        }
        const result = await courseFuncs[funcName](param);
        return NextResponse.json({ success: true, data: result });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ success: false });
    }
}
