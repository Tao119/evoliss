import { requestDB } from "@/services/axios";
import { reservationStatus } from "@/type/models";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Stripe webhookのためにbodyParserを無効化
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
	console.log("🔍 Webhook Request Received");

	let body: string;
	let signature: string | null;

	try {
		// リクエストボディを生のテキストとして取得
		body = await request.text();

		// ヘッダーから署名を取得
		const headersList = await headers();
		signature = headersList.get("stripe-signature");

		console.log("📥 Raw Body Length:", body.length);
		console.log("🔑 Signature Present:", !!signature);
	} catch (error) {
		console.error("❌ Error reading request:", error);
		return NextResponse.json(
			{ error: "Failed to read request body" },
			{ status: 400 }
		);
	}

	if (!signature) {
		console.error("🚨 Missing Stripe Signature");
		return NextResponse.json(
			{ error: "Missing stripe-signature header" },
			{ status: 400 },
		);
	}

	if (!process.env.STRIPE_WEBHOOK_SECRET) {
		console.error("🚨 Missing STRIPE_WEBHOOK_SECRET environment variable");
		return NextResponse.json(
			{ error: "Webhook secret not configured" },
			{ status: 500 },
		);
	}

	let event: Stripe.Event;

	try {
		// Stripe署名を検証してイベントを構築
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET,
		);

		console.log("✅ Webhook signature verified successfully");
		console.log("📋 Event Type:", event.type);
		console.log("🆔 Event ID:", event.id);
	} catch (err: any) {
		console.error("🚨 Webhook signature verification failed:", err.message);
		console.error("🔍 Signature:", signature);
		console.error("🔍 Body length:", body.length);
		console.error("🔍 Webhook secret configured:", !!process.env.STRIPE_WEBHOOK_SECRET);

		return NextResponse.json(
			{
				error: `Webhook signature verification failed: ${err.message}`,
				details: {
					signaturePresent: !!signature,
					bodyLength: body.length,
					secretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET
				}
			},
			{ status: 400 }
		);
	}

	try {
		if (event.type === "checkout.session.completed") {
			{ status: 400 }
		);
		}

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
				}
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

				messageRoom = await (prisma.messageRoom).create({
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

			// 予約情報を取得
			const reservationRes = await requestDB("reservation", "readReservationById", {
				id: parsedReservationId,
			});
			const reservation = reservationRes.data;

			// コーチへの購入通知メールを送信
			try {
				const { sendEmail, getPurchaseEmailTemplate } = await import("@/lib/email/emailService");
				const emailTemplate = getPurchaseEmailTemplate({
					coachName: course.coach.name || "コーチ",
					customerName: user.name || "お客様",
					courseTitle: course.title,
					courseTime: reservation.courseTime || "",
					welcomeMessage: course.welcomeMessage,
				});

				await sendEmail({
					to: course.coach.email,
					subject: emailTemplate.subject,
					html: emailTemplate.html,
					text: emailTemplate.text,
				});

				console.log("📧 Purchase notification email sent to coach");
			} catch (emailError) {
				console.error("❌ Failed to send purchase notification email:", emailError);
			}

			// 顧客への購入確認メールを送信
			try {
				const { sendEmail, getPurchaseConfirmationEmailTemplate } = await import("@/lib/email/emailService");
				const emailTemplate = getPurchaseConfirmationEmailTemplate({
					customerName: user.name || "お客様",
					courseTitle: course.title,
					courseTime: reservation.courseTime || "",
					coachName: course.coach.name || "コーチ",
					welcomeMessage: course.welcomeMessage,
				});

				await sendEmail({
					to: user.email,
					subject: emailTemplate.subject,
					html: emailTemplate.html,
					text: emailTemplate.text,
				});

				console.log("📧 Purchase confirmation email sent to customer");
			} catch (emailError) {
				console.error("❌ Failed to send purchase confirmation email:", emailError);
			}

			// コーチへのWeb通知を作成
			try {
				await requestDB("notification", "createNotification", {
					userId: course.coachId,
					type: "purchase",
					title: "講座が購入されました",
					message: `${user.name || "お客様"}様が「${course.title}」を購入しました`,
					relatedId: parsedReservationId,
				});

				console.log("🔔 Purchase notification created for coach");
			} catch (notifError) {
				console.error("❌ Failed to create purchase notification:", notifError);
			}

			// 講座30分前のリマインダーをスケジュール
			try {
				const { scheduleReminder } = await import("@/lib/queue/reminderQueue");
				await scheduleReminder(parsedReservationId);
				console.log("⏰ Reminder scheduled for reservation");
			} catch (reminderError) {
				console.error("❌ Failed to schedule reminder:", reminderError);
			}

			// welcomeMessageがある場合、メッセージルームに自動送信
			if (course.welcomeMessage) {
				try {
					await prisma.message.create({
						data: {
							roomId: messageRoom.id,
							senderId: course.coachId,
							content: course.welcomeMessage,
						},
					});

					// メッセージルームの未読フラグを更新
					await prisma.messageRoom.update({
						where: { id: messageRoom.id },
						data: { hasUnreadForCustomer: true },
					});

					console.log("💬 Welcome message sent to customer");
				} catch (msgError) {
					console.error("❌ Failed to send welcome message:", msgError);
				}
			}

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