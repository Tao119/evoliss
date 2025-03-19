import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { requestDB } from "@/services/axios";
import { Readable } from "stream";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const prisma = new PrismaClient();

export const config = {
    api: {
        bodyParser: false,
    },
};

async function getRawBody(readable: Readable) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export async function POST(request: Request) {
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ message: "🚨 Bad request: Missing signature" }, { status: 400 });
    }

    try {
        const rawBody = await getRawBody(request.body as unknown as Readable);

        const event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );

        console.log("✅ Webhook Event Received:", event.type);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log("💳 Checkout Session Completed:", session);

            const userId = session.metadata?.userId;
            const scheduleId = session.metadata?.scheduleId;
            const courseId = session.metadata?.courseId;
            const paymentId = session.metadata?.paymentId;
            const amount = session.amount_total;

            if (!userId || !scheduleId || !courseId || !paymentId) {
                console.error("🚨 Missing required metadata:", {
                    userId,
                    scheduleId,
                    courseId,
                    paymentId
                });
                return NextResponse.json({ message: "🚨 Missing metadata" }, { status: 400 });
            }

            const parsedUserId = parseInt(userId);
            const parsedCourseId = parseInt(courseId);
            const parsedScheduleId = parseInt(scheduleId);
            const parsedPaymentId = parseInt(paymentId);

            const courseRes = await requestDB("course", "readCourseById", {
                id: parsedCourseId,
            });
            const course = courseRes.data;
            const userRes = await requestDB("user", "readUserById", {
                id: parsedUserId,
            });
            const user = userRes.data;

            await requestDB("payment", "updatePayment", { id: parsedPaymentId, status: 1 });
            const room = await requestDB("message", "sendSystemMessage", { userId: parsedUserId, courseId: parsedCourseId, scheduleId: parsedScheduleId });
            await requestDB("notification", "createNotification", {
                userId: course.coachId,
                content: `${user.name}さんがあなたの講座を購入しました。`,
                senderId: parsedUserId
            });
            await requestDB("reservation", "createReservation", { userId: parsedUserId, courseId: parsedCourseId, scheduleId: parsedScheduleId, roomId: room.id });

            console.log("📝 Reservations Created:", {
                userId: parsedUserId,
                courseId: parsedCourseId,
                scheduleId: parsedScheduleId,
                paymentId: parsedPaymentId,
                roomId: room.id
            });

            return NextResponse.json({ message: "✅ Reservations created" }, { status: 200 });
        }

        return NextResponse.json({ message: "Unhandled event type" }, { status: 400 });

    } catch (err: any) {
        console.error("🚨 Webhook Handling Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
