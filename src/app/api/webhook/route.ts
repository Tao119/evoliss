import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Readable } from "stream";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const config = {
    api: {
        bodyParser: false,
    },
};

async function getRawBody(request: Request): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const readable = request.body as unknown as Readable;

    for await (const chunk of readable) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export async function POST(request: Request) {
    console.log("🔍 Webhook Request Received");

    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        console.error("🚨 Missing Stripe Signature");
        return NextResponse.json({ message: "🚨 Bad request: Missing signature" }, { status: 400 });
    }

    try {
        // **修正: rawBody を正しく取得**
        const rawBody = await getRawBody(request);
        console.log("📥 Raw Body Length:", rawBody.length);
        console.log("📥 Raw Body as String:", rawBody.toString());
        console.log("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET as string)
        console.log("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY as string)

        const event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );

        console.log("✅ Webhook Event Received:", event.type);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log("💳 Checkout Session Completed:", JSON.stringify(session, null, 2));

            return NextResponse.json({ message: "✅ Success" }, { status: 200 });
        }

        return NextResponse.json({ message: "Unhandled event type" }, { status: 400 });

    } catch (err: any) {
        console.error("🚨 Webhook Handling Error:", err.message);
        console.error("🔍 Error Stack:", err.stack);

        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
