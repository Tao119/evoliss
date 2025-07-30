import { requestDB } from "@/services/axios";
import { reservationStatus } from "@/type/models";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(request: NextRequest) {
	console.log("🔍 Webhook Request Received");

	const body = await request.text();
	const headersList = await headers();
	const signature = headersList.get("stripe-signature");

	if (!signature) {
		console.error("🚨 Missing Stripe Signature");
		return NextResponse.json(
			{ message: "🚨 Bad request: Missing signature" },
			{ status: 400 },
		);
	}

	try {
		console.log("📥 Raw Body Length:", body.length);

		const event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET as string,
		);

		console.log("✅ Webhook Event Received:", event.type);

		if (event.type === "checkout.session.completed") {
			const session = event.data.object as Stripe.Checkout.Session;
			console.log(
				"💳 Checkout Session Completed:",
				JSON.stringify(session, null, 2),
			);

			const userId = session.metadata?.userId;
			const courseId = session.metadata?.courseId;
			const reservationId = session.metadata?.reservationId;
			const amount = session.amount_total;
			const timeSlotIds = session.metadata?.timeSlotIds;

			if (
				!userId ||
				!courseId ||
				!reservationId ||
				!timeSlotIds
			) {
				console.error("🚨 Missing required metadata:", {
					userId,
					timeSlotIds,
					courseId,
					reservationId,
				});
				return NextResponse.json(
					{ message: "🚨 Missing metadata" },
					{ status: 400 },
				);
			}

			const parsedUserId = Number.parseInt(userId);
			const parsedCourseId = Number.parseInt(courseId);
			const parsedTimeSlotIds = timeSlotIds.split(',').map(id => Number.parseInt(id.trim()));
			const parsedReservationId = Number.parseInt(reservationId);

			const courseRes = await requestDB("course", "readCourseById", {
				id: parsedCourseId,
			});
			const course = courseRes.data;
			const userRes = await requestDB("user", "readUserById", {
				id: parsedUserId,
			});
			const user = userRes.data;

			// MessageRoomを作成または取得
			let messageRoom = await prisma.messageRoom.findFirst({
				where: {
					customerId: parsedUserId,
					coachId: course.coachId,
				} as any,  // 一時的な回避策
			});

			if (!messageRoom) {
				// MessageRoomが存在しない場合は新規作成
				let roomKey = "";
				let isUnique = false;

				while (!isUnique) {
					// nanoidの代わりにランダムな文字列を生成
					roomKey = Math.random().toString(36).substring(2, 12);
					const existingKey = await prisma.messageRoom.findUnique({
						where: { roomKey },
					});

					if (!existingKey) {
						isUnique = true;
					}
				}

				messageRoom = await prisma.messageRoom.create({
					data: {
						roomKey,
						customerId: parsedUserId,
						coachId: course.coachId,
					},
				});

				console.log("📨 New MessageRoom created:", {
					roomId: messageRoom.id,
					roomKey: messageRoom.roomKey,
					customerId: parsedUserId,
					coachId: course.coachId,
				});

				// システムメッセージを送信（オプション）
				await prisma.message.create({
					data: {
						roomId: messageRoom.id,
						senderId: parsedUserId,
						content: `${course.title}の予約が完了しました。`,
					},
				});
			} else {
				console.log("📨 Existing MessageRoom found:", {
					roomId: messageRoom.id,
					roomKey: messageRoom.roomKey,
				});
			}

			// 予約のステータスを更新（roomIdも含めて）
			await requestDB("reservation", "updateReservation", {
				id: parsedReservationId,
				status: reservationStatus.Paid,
				roomId: messageRoom.id,
			});

			// 支払い記録を作成
			await requestDB("payment", "createPayment", {
				customerId: parsedUserId,
				reservationId: parsedReservationId,
				amount,
				method: "card",
			});

			console.log("📝 Payment Processing Completed:", {
				userId: parsedUserId,
				courseId: parsedCourseId,
				reservationId: parsedReservationId,
				messageRoomId: messageRoom.id,
			});

			return NextResponse.json({ message: "✅ Success" }, { status: 200 });
		}

		// その他のイベントタイプも処理したい場合はここに追加
		console.log(`ℹ️ Unhandled event type: ${event.type}`);
		return NextResponse.json(
			{ message: "Event received" },
			{ status: 200 },
		);
	} catch (err: any) {
		console.error("🚨 Webhook Handling Error:", err.message);
		console.error("🔍 Error Stack:", err.stack);

		return NextResponse.json({ error: err.message }, { status: 400 });
	}
}