import { NextRequest, NextResponse } from "next/server";
import { adminFuncs } from "@/model/admin";
import { userFuncs } from "@/model/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

export async function POST(request: NextRequest) {
    try {
        // セッションからユーザー情報を取得
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: "認証が必要です" },
                { status: 401 }
            );
        }

        // データベースからユーザー情報を取得して管理者権限をチェック
        const user = await userFuncs.readUserByEmail({ email: session.user.email });

        if (!user || !user.isAdmin) {
            return NextResponse.json(
                { success: false, message: "管理者権限が必要です" },
                { status: 403 }
            );
        }

        const { funcName, param } = await request.json();

        if (!adminFuncs[funcName]) {
            return NextResponse.json(
                { success: false, message: "無効な関数名です" },
                { status: 400 }
            );
        }

        const result = await adminFuncs[funcName](param);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Admin API Error:", error);
        return NextResponse.json(
            { success: false, message: "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}