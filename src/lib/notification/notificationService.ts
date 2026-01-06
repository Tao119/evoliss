// 統合通知サービス
// リアルタイム通知（Socket.IO）とメール通知（SES）を統合管理

import { prisma } from "@/lib/prisma";
import { sendEmail, getMessageNotificationEmailTemplate, getPurchaseEmailTemplate, getPurchaseConfirmationEmailTemplate } from "@/lib/email/emailService";
import { Server as SocketIOServer } from "socket.io";

export interface NotificationData {
    userId: number;
    type: 'message' | 'purchase' | 'reschedule' | 'cancel' | 'reminder';
    title: string;
    message: string;
    relatedId?: number;
    emailData?: {
        recipientEmail: string;
        recipientName: string;
        [key: string]: any;
    };
}

// Socket.IOサーバーインスタンスを保持
let ioInstance: SocketIOServer | null = null;

export function setSocketIOInstance(io: SocketIOServer) {
    ioInstance = io;
}

export function getSocketIOInstance(): SocketIOServer | null {
    return ioInstance;
}

// 統合通知送信関数
export async function sendNotification(data: NotificationData) {
    try {
        console.log(`🔔 Sending notification to user ${data.userId}:`, data.type);

        // 1. データベースに通知を保存
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                relatedId: data.relatedId || null,
            },
        });

        // 2. リアルタイム通知（Socket.IO）
        await sendRealtimeNotification(data.userId, {
            id: notification.id,
            type: data.type,
            title: data.title,
            message: data.message,
            relatedId: data.relatedId,
            createdAt: notification.createdAt.toISOString(),
        });

        // 3. メール通知
        if (data.emailData) {
            await sendEmailNotification(data.type, data.emailData);
        }

        console.log(`✅ Notification sent successfully to user ${data.userId}`);
        return { success: true, notificationId: notification.id };

    } catch (error) {
        console.error(`❌ Failed to send notification:`, error);
        return { success: false, error };
    }
}

// リアルタイム通知送信
async function sendRealtimeNotification(userId: number, notificationData: any) {
    const io = getSocketIOInstance();
    if (!io) {
        console.warn("⚠️ Socket.IO instance not available for realtime notification");
        return;
    }

    console.log(`📡 Attempting to send realtime notification to user ${userId}:`, notificationData);
    let notificationSent = false;

    // 特定のユーザーに通知を送信
    io.sockets.sockets.forEach((socket) => {
        if (socket.data.userId === userId) {
            socket.emit("newNotification", notificationData);
            console.log(`📡 Realtime notification sent to user ${userId} via socket ${socket.id}`);
            notificationSent = true;
        }
    });

    if (!notificationSent) {
        console.warn(`⚠️ No active socket found for user ${userId}`);
    }
}

// メール通知送信
async function sendEmailNotification(type: string, emailData: any) {
    try {
        let emailTemplate;

        switch (type) {
            case 'message':
                emailTemplate = getMessageNotificationEmailTemplate({
                    recipientName: emailData.recipientName,
                    senderName: emailData.senderName,
                    messagePreview: emailData.messagePreview,
                    roomKey: emailData.roomKey,
                });
                break;

            case 'purchase':
                if (emailData.isCoach) {
                    emailTemplate = getPurchaseEmailTemplate({
                        coachName: emailData.recipientName,
                        customerName: emailData.customerName,
                        courseTitle: emailData.courseTitle,
                        courseTime: emailData.courseTime,
                        welcomeMessage: emailData.welcomeMessage,
                    });
                } else {
                    emailTemplate = getPurchaseConfirmationEmailTemplate({
                        customerName: emailData.recipientName,
                        courseTitle: emailData.courseTitle,
                        courseTime: emailData.courseTime,
                        coachName: emailData.coachName,
                        welcomeMessage: emailData.welcomeMessage,
                    });
                }
                break;

            case 'reschedule':
                emailTemplate = getRescheduleNotificationEmailTemplate(emailData);
                break;

            case 'cancel':
                emailTemplate = getCancelNotificationEmailTemplate(emailData);
                break;

            case 'reminder':
                emailTemplate = getReminderNotificationEmailTemplate(emailData);
                break;

            default:
                console.warn(`⚠️ Unknown email notification type: ${type}`);
                return;
        }

        if (emailTemplate) {
            await sendEmail({
                to: emailData.recipientEmail,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text,
            });
            console.log(`📧 Email notification sent for type: ${type}`);
        }

    } catch (error) {
        console.error(`❌ Failed to send email notification:`, error);
    }
}

// メッセージ受信通知
export async function sendMessageNotification({
    recipientId,
    recipientEmail,
    recipientName,
    senderName,
    messageContent,
    roomKey,
}: {
    recipientId: number;
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    messageContent: string;
    roomKey: string;
}) {
    return sendNotification({
        userId: recipientId,
        type: 'message',
        title: `${senderName}様からメッセージが届きました`,
        message: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : ''),
        emailData: {
            recipientEmail,
            recipientName,
            senderName,
            messagePreview: messageContent,
            roomKey,
        },
    });
}

// 講座購入通知（コーチ向けのみ）
export async function sendPurchaseNotificationToCoach({
    coachId,
    coachEmail,
    coachName,
    customerName,
    courseTitle,
    courseTime,
    reservationId,
    welcomeMessage,
}: {
    coachId: number;
    coachEmail: string;
    coachName: string;
    customerName: string;
    courseTitle: string;
    courseTime: string;
    reservationId: number;
    welcomeMessage?: string;
}) {
    return sendNotification({
        userId: coachId,
        type: 'purchase',
        title: '講座が購入されました',
        message: `${customerName}様が「${courseTitle}」を購入しました`,
        relatedId: reservationId,
        emailData: {
            recipientEmail: coachEmail,
            recipientName: coachName,
            customerName,
            courseTitle,
            courseTime,
            welcomeMessage,
            isCoach: true,
        },
    });
}

// 講座日時変更通知
export async function sendRescheduleNotification({
    recipientId,
    recipientEmail,
    recipientName,
    courseTitle,
    oldTime,
    newTime,
    changedBy,
    reservationId,
}: {
    recipientId: number;
    recipientEmail: string;
    recipientName: string;
    courseTitle: string;
    oldTime: string;
    newTime: string;
    changedBy: string;
    reservationId: number;
}) {
    return sendNotification({
        userId: recipientId,
        type: 'reschedule',
        title: '講座の日時が変更されました',
        message: `「${courseTitle}」の日時が${changedBy}様によって変更されました`,
        relatedId: reservationId,
        emailData: {
            recipientEmail,
            recipientName,
            courseTitle,
            oldTime,
            newTime,
            changedBy,
        },
    });
}

// 講座キャンセル通知
export async function sendCancelNotification({
    recipientId,
    recipientEmail,
    recipientName,
    courseTitle,
    courseTime,
    cancelledBy,
    reservationId,
}: {
    recipientId: number;
    recipientEmail: string;
    recipientName: string;
    courseTitle: string;
    courseTime: string;
    cancelledBy: string;
    reservationId: number;
}) {
    return sendNotification({
        userId: recipientId,
        type: 'cancel',
        title: '講座がキャンセルされました',
        message: `「${courseTitle}」が${cancelledBy}様によってキャンセルされました`,
        relatedId: reservationId,
        emailData: {
            recipientEmail,
            recipientName,
            courseTitle,
            courseTime,
            cancelledBy,
        },
    });
}

// 日時変更通知メールテンプレート
function getRescheduleNotificationEmailTemplate({
    recipientName,
    courseTitle,
    oldTime,
    newTime,
    changedBy,
}: {
    recipientName: string;
    courseTitle: string;
    oldTime: string;
    newTime: string;
    changedBy: string;
}) {
    return {
        subject: `【Evoliss】講座の日時が変更されました - ${courseTitle}`,
        html: `
            <h2>講座の日時が変更されました</h2>
            <p>${recipientName}様</p>
            <p>「${courseTitle}」の日時が${changedBy}様によって変更されました。</p>
            <ul>
                <li><strong>変更前:</strong> ${oldTime}</li>
                <li><strong>変更後:</strong> ${newTime}</li>
            </ul>
            <p>マイページから詳細を確認してください。</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/mypage/courses/upcoming">マイページを開く</a>
        `,
        text: `講座の日時が変更されました\n\n${recipientName}様\n\n「${courseTitle}」の日時が${changedBy}様によって変更されました。\n\n変更前: ${oldTime}\n変更後: ${newTime}\n\nマイページから詳細を確認してください。`,
    };
}

// キャンセル通知メールテンプレート
function getCancelNotificationEmailTemplate({
    recipientName,
    courseTitle,
    courseTime,
    cancelledBy,
}: {
    recipientName: string;
    courseTitle: string;
    courseTime: string;
    cancelledBy: string;
}) {
    return {
        subject: `【Evoliss】講座がキャンセルされました - ${courseTitle}`,
        html: `
            <h2>講座がキャンセルされました</h2>
            <p>${recipientName}様</p>
            <p>「${courseTitle}」が${cancelledBy}様によってキャンセルされました。</p>
            <ul>
                <li><strong>講座日時:</strong> ${courseTime}</li>
            </ul>
            <p>ご不明な点がございましたら、お問い合わせください。</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact">お問い合わせ</a>
        `,
        text: `講座がキャンセルされました\n\n${recipientName}様\n\n「${courseTitle}」が${cancelledBy}様によってキャンセルされました。\n\n講座日時: ${courseTime}\n\nご不明な点がございましたら、お問い合わせください。`,
    };
}

// リマインダー通知メールテンプレート
function getReminderNotificationEmailTemplate({
    recipientName,
    courseTitle,
    courseTime,
    isCoach,
}: {
    recipientName: string;
    courseTitle: string;
    courseTime: string;
    isCoach: boolean;
}) {
    return {
        subject: `【Evoliss】まもなく講座が始まります - ${courseTitle}`,
        html: `
            <h2>講座開始のリマインダー</h2>
            <p>${recipientName}様</p>
            <p>まもなく講座「${courseTitle}」が始まります。</p>
            <ul>
                <li><strong>開始時刻:</strong> ${courseTime}</li>
            </ul>
            <p>準備をお願いいたします。</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/mypage/${isCoach ? 'coach' : 'courses'}/upcoming">マイページを開く</a>
        `,
        text: `講座開始のリマインダー\n\n${recipientName}様\n\nまもなく講座「${courseTitle}」が始まります。\n開始時刻: ${courseTime}\n\n準備をお願いいたします。`,
    };
}