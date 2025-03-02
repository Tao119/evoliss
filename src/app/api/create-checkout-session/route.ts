import Stripe from "stripe";
import { NextResponse } from "next/server";
import { requestDB } from "@/services/axios";


const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const amount = body.amount as number;
        const userId = body.userId as number;
        const courseId = body.courseId as number;
        const courseName = body.courseName as string;
        const scheduleId = body.scheduleId as number[];


        if (!amount || !userId) {
            return NextResponse.json({ message: "Invalid request data", ok: false }, { status: 400 });
        }
        // StripeのCustomerオブジェクトを作成
        const customer = await stripe.customers.create({
            metadata: { userId: userId.toString() },
        });
        let res = await requestDB("payment", "readPaymentByCustomerAndSchedule", {
            customerId: userId,
            scheduleId,
        })
        let payment

        if (res.success) {
            payment = res.data
        }

        if (!payment) {
            res = await requestDB("payment", "createPayment", {
                customerId: userId,
                scheduleId,
                amount,
                method: "card",
            })
            if (res.success) {
                payment = res.data
            }
        }

        const session = await stripe.checkout.sessions.create({
            customer: customer.id, // ここで作成したCustomerを指定
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "jpy",
                        product_data: { name: courseName },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?paymentId=${payment.id}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
            metadata: { userId: userId.toString(), courseId: courseId.toString(), scheduleId: scheduleId.toString(), paymentId: payment.id.toString(), }, // メタデータにuserIdを含める
        });

        return NextResponse.json({ sessionUrl: session.url, ok: true });

    } catch (error) {
        console.error("Stripe Checkout Session Error:", error);
        return NextResponse.json({ message: "Internal Server Error", ok: false }, { status: 500 });
    }
}
