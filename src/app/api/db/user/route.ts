import { userFuncs } from "@/model/user";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
    try {

        const { funcName, param } = await req.json();
        if (!Object.keys(userFuncs).includes(funcName)) {
            return NextResponse.json({ success: false });
        }
        const user = await userFuncs[funcName](param);
        return NextResponse.json({ success: true, data: user });
    } catch (e) {
        console.error(e)
        return NextResponse.json({ success: false });
    }
}
