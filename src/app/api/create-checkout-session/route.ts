import Stripe from "stripe";
import { NextResponse } from "next/server";


const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const amount = body.amount as number;
        const userId = body.userId as number;
        const courseId = body.courseId as number;
        const scheduleIds = body.scheduleIds as number[];

        if (!amount || !userId) {
            return NextResponse.json({ message: "Invalid request data", ok: false }, { status: 400 });
        }

        // StripeのCustomerオブジェクトを作成
        const customer = await stripe.customers.create({
            metadata: { userId: userId.toString() },
        });

        const session = await stripe.checkout.sessions.create({
            customer: customer.id, // ここで作成したCustomerを指定
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "jpy",
                        product_data: { name: "購入商品" }, // 商品名を簡単に設定
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
            metadata: { userId: userId.toString(), courseId: courseId.toString(), scheduleIds: JSON.stringify(scheduleIds) }, // メタデータにuserIdを含める
        });

        return NextResponse.json({ sessionUrl: session.url, ok: true });

    } catch (error) {
        console.error("Stripe Checkout Session Error:", error);
        return NextResponse.json({ message: "Internal Server Error", ok: false }, { status: 500 });
    }
}
