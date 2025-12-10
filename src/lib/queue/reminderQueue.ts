// 講座30分前リマインダーのキューシステム
import { Queue, Worker } from "bullmq";
import { prisma } from "@/lib/prisma";
import { sendEmail, getReminderEmailTemplate } from "@/lib/email/emailService";
import { requestDB } from "@/services/axios";

const connection = {
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT || "6379"),
};

// リマインダーキュー
export const reminderQueue = new Queue("course-reminder", { connection });

// リマインダーをスケジュール（講座30分前）
export async function scheduleReminder(reservationId: number) {
    try {
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                timeSlots: {
                    orderBy: { dateTime: "asc" },
                    take: 1,
                },
                course: {
                    include: {
                        coach: true,
                    },
                },
                customer: true,
            },
        });

        if (!reservation || !reservation.timeSlots[0]) {
            console.error(`⚠️ Reservation ${reservationId} not found or has no time slots`);
            return;
        }

        const firstSlot = reservation.timeSlots[0];
        const courseStartTime = new Date(firstSlot.dateTime);
        const reminderTime = new Date(courseStartTime.getTime() - 30 * 60 * 1000); // 30分前

        // 現在時刻より前の場合はスケジュールしない
        if (reminderTime <= new Date()) {
            console.log(`⚠️ Reminder time for reservation ${reservationId} is in the past, skipping`);
            return;
        }

        const delay = reminderTime.getTime() - Date.now();

        await reminderQueue.add(
            "send-reminder",
            {
                reservationId,
                coachId: reservation.course.coachId,
                customerId: reservation.customerId,
                courseTitle: reservation.course.title,
                courseTime: reservation.courseTime,
                coachName: reservation.course.coach.name,
                coachEmail: reservation.course.coach.email,
                customerName: reservation.customer.name,
                customerEmail: reservation.customer.email,
            },
            {
                delay,
                jobId: `reminder-${reservationId}`,
                removeOnComplete: true,
                removeOnFail: false,
            }
        );

        console.log(`✅ Reminder scheduled for reservation ${reservationId} at ${reminderTime.toISOString()}`);
    } catch (error) {
        console.error(`❌ Failed to schedule reminder for reservation ${reservationId}:`, error);
    }
}

// リマインダーをキャンセル
export async function cancelReminder(reservationId: number) {
    try {
        const job = await reminderQueue.getJob(`reminder-${reservationId}`);
        if (job) {
            await job.remove();
            console.log(`✅ Reminder cancelled for reservation ${reservationId}`);
        }
    } catch (error) {
        console.error(`❌ Failed to cancel reminder for reservation ${reservationId}:`, error);
    }
}

// Workerの初期化（サーバー起動時に一度だけ実行）
let reminderWorker: Worker | null = null;

export function initReminderWorker() {
    if (reminderWorker) {
        console.log("⚠️ Reminder worker already initialized");
        return reminderWorker;
    }

    reminderWorker = new Worker(
        "course-reminder",
        async (job) => {
            const {
                reservationId,
                coachId,
                customerId,
                courseTitle,
                courseTime,
                coachName,
                coachEmail,
                customerName,
                customerEmail,
            } = job.data;

            console.log(`📢 Processing reminder for reservation ${reservationId}`);

            try {
                // コーチへの通知
                const coachEmailTemplate = getReminderEmailTemplate({
                    recipientName: coachName || "コーチ",
                    courseTitle,
                    courseTime: courseTime || "",
                    isCoach: true,
                });

                await sendEmail({
                    to: coachEmail,
                    subject: coachEmailTemplate.subject,
                    html: coachEmailTemplate.html,
                    text: coachEmailTemplate.text,
                });

                // Web通知を作成（コーチ）
                await requestDB("notification", "createNotification", {
                    userId: coachId,
                    type: "reminder",
                    title: "講座開始のリマインダー",
                    message: `まもなく講座「${courseTitle}」が始まります（${courseTime}）`,
                    relatedId: reservationId,
                });

                // 顧客への通知
                const customerEmailTemplate = getReminderEmailTemplate({
                    recipientName: customerName || "お客様",
                    courseTitle,
                    courseTime: courseTime || "",
                    isCoach: false,
                });

                await sendEmail({
                    to: customerEmail,
                    subject: customerEmailTemplate.subject,
                    html: customerEmailTemplate.html,
                    text: customerEmailTemplate.text,
                });

                // Web通知を作成（顧客）
                await requestDB("notification", "createNotification", {
                    userId: customerId,
                    type: "reminder",
                    title: "講座開始のリマインダー",
                    message: `まもなく講座「${courseTitle}」が始まります（${courseTime}）`,
                    relatedId: reservationId,
                });

                console.log(`✅ Reminder sent for reservation ${reservationId}`);
            } catch (error) {
                console.error(`❌ Failed to send reminder for reservation ${reservationId}:`, error);
                throw error;
            }
        },
        { connection }
    );

    reminderWorker.on("completed", (job) => {
        console.log(`✅ Reminder job ${job.id} completed`);
    });

    reminderWorker.on("failed", (job, err) => {
        console.error(`❌ Reminder job ${job?.id} failed:`, err);
    });

    console.log("✅ Reminder worker initialized");
    return reminderWorker;
}

// Workerのクリーンアップ
export async function closeReminderWorker() {
    if (reminderWorker) {
        await reminderWorker.close();
        reminderWorker = null;
        console.log("✅ Reminder worker closed");
    }
}
