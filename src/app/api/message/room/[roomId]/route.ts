import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { roomId: string } }
) {
    try {
        const roomId = parseInt(params.roomId);

        if (isNaN(roomId)) {
            return NextResponse.json(
                { error: "Invalid room ID" },
                { status: 400 }
            );
        }

        const room = await prisma.messageRoom.findUnique({
            where: { id: roomId },
            select: {
                id: true,
                roomKey: true,
                customerId: true,
                coachId: true,
            },
        });

        if (!room) {
            return NextResponse.json(
                { error: "Room not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: room,
        });

    } catch (error) {
        console.error("❌ Failed to get message room:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}