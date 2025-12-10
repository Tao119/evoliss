import { NextResponse } from "next/server";

// リマインダーWorkerの初期化
let isInitialized = false;

export async function GET() {
    try {
        if (!isInitialized) {
            // リマインダーWorkerを初期化
            const { initReminderWorker } = await import("@/lib/queue/reminderQueue");
            initReminderWorker();
            isInitialized = true;
            console.log("✅ Background workers initialized");
        }

        return NextResponse.json({
            success: true,
            message: "Workers initialized"
        });
    } catch (error) {
        console.error("❌ Failed to initialize workers:", error);
        return NextResponse.json(
            { success: false, error: "Failed to initialize workers" },
            { status: 500 }
        );
    }
}
