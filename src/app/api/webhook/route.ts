import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requestDB } from "@/services/axios";
import { Readable } from "stream";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

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
    console.log("🔍 Webhook Request Received");

    // 環境変数の確認
    console.log("🔍 STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "✅ Set" : "❌ Not Set");
    console.log("🔍 STRIPE_WEBHOOK_SECRET:", process.env.STRIPE_WEBHOOK_SECRET ? "✅ Set" : "❌ Not Set");

    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        console.error("🚨 Missing Stripe Signature");
        return NextResponse.json({ message: "🚨 Bad request: Missing signature" }, { status: 400 });
    }

    try {
        const rawBody = await getRawBody(request.body as unknown as Readable);
        console.log("📥 Raw Body:", rawBody.toString());

        const event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );

        console.log("✅ Webhook Event Received:", event.type);
        console.log("🔍 Event Data:", JSON.stringify(event, null, 2));

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log("💳 Checkout Session Completed:", JSON.stringify(session, null, 2));

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

            console.log("🔍 Parsed Metadata:", {
                userId: parsedUserId,
                courseId: parsedCourseId,
                scheduleId: parsedScheduleId,
                paymentId: parsedPaymentId,
                amount,
            });

            const courseRes = await requestDB("course", "readCourseById", { id: parsedCourseId });
            console.log("📚 Course Data:", courseRes.data);

            const userRes = await requestDB("user", "readUserById", { id: parsedUserId });
            console.log("👤 User Data:", userRes.data);

            await requestDB("payment", "updatePayment", { id: parsedPaymentId, status: 1 });
            console.log("✅ Payment updated");

            const room = await requestDB("message", "sendSystemMessage", {
                userId: parsedUserId,
                courseId: parsedCourseId,
                scheduleId: parsedScheduleId
            });
            console.log("📩 System Message Sent:", room);

            await requestDB("notification", "createNotification", {
                userId: courseRes.data.coachId,
                content: `${userRes.data.name}さんがあなたの講座を購入しました。`,
                senderId: parsedUserId
            });
            console.log("🔔 Notification Created");

            await requestDB("reservation", "createReservation", {
                userId: parsedUserId,
                courseId: parsedCourseId,
                scheduleId: parsedScheduleId,
                roomId: room.id
            });
            console.log("📝 Reservation Created");

            return NextResponse.json({ message: "✅ Reservations created" }, { status: 200 });
        }

        return NextResponse.json({ message: "Unhandled event type" }, { status: 400 });

    } catch (err: any) {
        console.error("🚨 Webhook Handling Error:", err);
        console.error("🔍 Error Stack:", err.stack);

        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
