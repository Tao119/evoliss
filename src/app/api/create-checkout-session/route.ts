import { requestDB } from "@/services/axios";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const amount = body.amount as number;
		const userId = body.userId as number;
		const courseId = body.courseId as number;
		const courseName = body.courseName as string;
		const timeSlotIds = body.timeSlotIds as number[];

		if (!amount || !userId) {
			return NextResponse.json(
				{ message: "Invalid request data", ok: false },
				{ status: 400 },
			);
		}
		const customer = await stripe.customers.create({
			metadata: { userId: userId.toString() },
		});
		const resRead = await requestDB(
			"reservation",
			"readReservationByCustomerAndSchedule",
			{
				customerId: userId,
				timeSlotIds: timeSlotIds,
			},
		);
		let reservation;

		if (resRead.success) {
			console.log("---------- resRead.data ----------");
			console.log(resRead.data);
			const reservations = resRead.data;
			if (reservations.length > 1) {
				return NextResponse.json(
					{
						ok: false,
						message:
							"処理が完了しませんでした。\n日程が誤っている可能性があります。",
					},
					{ status: 400 },
				);
			} else if (reservations.length === 1) {
				reservation = reservations[0];
			}
		}

		if (!reservation) {
			const resCreate = await requestDB("reservation", "createReservation", {
				userId: userId,
				courseId: courseId,
				timeSlotIds: timeSlotIds,
			});
			console.log("---------- resCreate.data ----------");
			console.log(resCreate.data);
			if (resCreate.success) {
				reservation = resCreate.data;
			}
		}

		console.log({
			userId: userId,
			courseId: courseId,
			timeSlotIds: timeSlotIds,
			reservation: reservation,
		});

		if (!reservation) {
			return NextResponse.json({
				ok: false,
				message:
					"処理が完了しませんでした。\n購入済みのスケジュールである可能性があります。",
			});
		}

		const session = await stripe.checkout.sessions.create({
			customer: customer.id,
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
			success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?reservationId=${reservation.id}`,
			cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/course/${courseId}`,
			metadata: {
				userId: userId.toString(),
				courseId: courseId.toString(),
				timeSlotIds: timeSlotIds.toString(),
				reservationId: reservation.id.toString(),
			},
		});

		return NextResponse.json({ sessionUrl: session.url, ok: true });
	} catch (error) {
		console.error("Stripe Checkout Session Error:", error);
		return NextResponse.json(
			{ message: "Internal Server Error", ok: false },
			{ status: 500 },
		);
	}
}
