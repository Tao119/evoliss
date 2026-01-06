// メール送信サービス
// 実際の実装はプロジェクトのメール送信方法に応じて調整してください

export interface EmailParams {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

// SESクライアントの作成（シングルトン）
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

let sesClient: SESClient | null = null;

function getSESClient() {
    if (!sesClient) {
        sesClient = new SESClient({
            region: process.env.AWS_REGION || "ap-northeast-1",
            credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
                ? {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                }
                : undefined, // デフォルトの認証情報を使用
        });
    }
    return sesClient;
}

export async function sendEmail({ to, subject, html, text }: EmailParams) {
    try {
        console.log("📧 Sending email:", { to, subject });

        // 開発環境ではログのみ（実際に送信したくない場合）
        if (process.env.NODE_ENV === "development" && process.env.ENABLE_EMAIL_SENDING !== "true") {
            console.log("📝 Email content (dev mode - not sent):");
            console.log("  To:", to);
            console.log("  Subject:", subject);
            console.log("  HTML:", html.substring(0, 200) + "...");
            return { success: true, message: "Email logged (dev mode)" };
        }

        // メール送信元の確認
        if (!process.env.EMAIL_FROM) {
            throw new Error("EMAIL_FROM environment variable is not set");
        }

        // AWS SESでメール送信
        const client = getSESClient();

        const command = new SendEmailCommand({
            Source: process.env.EMAIL_FROM,
            Destination: {
                ToAddresses: [to],
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: html,
                        Charset: "UTF-8",
                    },
                    Text: {
                        Data: text || "",
                        Charset: "UTF-8",
                    },
                },
            },
        });

        const response = await client.send(command);
        console.log("✅ Email sent successfully:", response.MessageId);

        return {
            success: true,
            message: "Email sent successfully",
            messageId: response.MessageId,
        };
    } catch (error: any) {
        console.error("❌ Email sending failed:", error);

        // サンドボックスモードのエラーの場合、開発環境では警告のみ
        if (error.name === "MessageRejected" && error.message.includes("not verified") && process.env.NODE_ENV === "development") {
            console.warn("⚠️ Email not sent due to SES sandbox mode. Email would be sent in production.");
            return {
                success: true,
                message: "Email skipped (SES sandbox mode in development)",
                warning: "SES is in sandbox mode - email not actually sent"
            };
        }

        return { success: false, error: error.message || error };
    }
}

// 購入通知メール
export function getPurchaseEmailTemplate({
    coachName,
    customerName,
    courseTitle,
    courseTime,
    welcomeMessage,
}: {
    coachName: string;
    customerName: string;
    courseTitle: string;
    courseTime: string;
    welcomeMessage?: string;
}) {
    return {
        subject: `【Evoliss】講座が購入されました - ${courseTitle}`,
        html: `
			<h2>講座が購入されました</h2>
			<p>${coachName}様</p>
			<p>あなたの講座「${courseTitle}」が購入されました。</p>
			<ul>
				<li><strong>購入者:</strong> ${customerName}様</li>
				<li><strong>講座日時:</strong> ${courseTime}</li>
			</ul>
			<p>マイページから詳細を確認してください。</p>
			<a href="${process.env.NEXT_PUBLIC_BASE_URL}/mypage/coach/upcoming">マイページを開く</a>
		`,
        text: `講座が購入されました\n\n${coachName}様\n\nあなたの講座「${courseTitle}」が購入されました。\n購入者: ${customerName}様\n講座日時: ${courseTime}\n\nマイページから詳細を確認してください。`,
    };
}

// 購入確認メール（顧客向け）
export function getPurchaseConfirmationEmailTemplate({
    customerName,
    courseTitle,
    courseTime,
    coachName,
    welcomeMessage,
}: {
    customerName: string;
    courseTitle: string;
    courseTime: string;
    coachName: string;
    welcomeMessage?: string;
}) {
    return {
        subject: `【Evoliss】講座の購入が完了しました - ${courseTitle}`,
        html: `
			<h2>講座の購入が完了しました</h2>
			<p>${customerName}様</p>
			<p>「${courseTitle}」の購入が完了しました。</p>
			<ul>
				<li><strong>コーチ:</strong> ${coachName}様</li>
				<li><strong>講座日時:</strong> ${courseTime}</li>
			</ul>
			${welcomeMessage ? `<div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50;"><h3>コーチからのメッセージ</h3><p style="white-space: pre-wrap;">${welcomeMessage}</p></div>` : ''}
			<p>マイページから詳細を確認してください。</p>
			<a href="${process.env.NEXT_PUBLIC_BASE_URL}/mypage/courses/upcoming">マイページを開く</a>
		`,
        text: `講座の購入が完了しました\n\n${customerName}様\n\n「${courseTitle}」の購入が完了しました。\nコーチ: ${coachName}様\n講座日時: ${courseTime}\n\n${welcomeMessage ? `コーチからのメッセージ:\n${welcomeMessage}\n\n` : ''}マイページから詳細を確認してください。`,
    };
}

// メッセージ受信通知メール
export function getMessageNotificationEmailTemplate({
    recipientName,
    senderName,
    messagePreview,
    roomKey,
}: {
    recipientName: string;
    senderName: string;
    messagePreview: string;
    roomKey: string;
}) {
    return {
        subject: `【Evoliss】${senderName}様からメッセージが届きました`,
        html: `
			<h2>新しいメッセージが届きました</h2>
			<p>${recipientName}様</p>
			<p>${senderName}様からメッセージが届きました。</p>
			<div style="background: #f5f5f5; padding: 15px; margin: 20px 0;">
				<p>${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}</p>
			</div>
			<a href="${process.env.NEXT_PUBLIC_BASE_URL}/mypage/message/${roomKey}">メッセージを確認する</a>
		`,
        text: `新しいメッセージが届きました\n\n${recipientName}様\n\n${senderName}様からメッセージが届きました。\n\n${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}\n\nメッセージを確認してください。`,
    };
}

// 講座30分前リマインダーメール
export function getReminderEmailTemplate({
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

// リマインダー通知送信
export async function sendReminderNotification({
    userId,
    userEmail,
    userName,
    courseTitle,
    courseTime,
    isCoach,
    reservationId,
}: {
    userId: number;
    userEmail: string;
    userName: string;
    courseTitle: string;
    courseTime: string;
    isCoach: boolean;
    reservationId: number;
}) {
    const { sendNotification } = await import("@/lib/notification/notificationService");

    return sendNotification({
        userId,
        type: 'reminder',
        title: 'まもなく講座が始まります',
        message: `「${courseTitle}」が30分後に始まります`,
        relatedId: reservationId,
        emailData: {
            recipientEmail: userEmail,
            recipientName: userName,
            courseTitle,
            courseTime,
            isCoach,
        },
    });
}
