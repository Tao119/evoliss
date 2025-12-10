import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/emailService";

export async function POST(req: Request) {
    try {
        const { to, subject, message } = await req.json();

        if (!to || !subject || !message) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: to, subject, message" },
                { status: 400 }
            );
        }

        // メール送信
        const result = await sendEmail({
            to,
            subject,
            html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">テストメール</h2>
					<div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
						<p style="white-space: pre-wrap; color: #666;">${message}</p>
					</div>
					<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
					<p style="color: #999; font-size: 12px;">
						このメールはEvolissシステムからのテストメールです。
					</p>
				</div>
			`,
            text: `テストメール\n\n${message}\n\n---\nこのメールはEvolissシステムからのテストメールです。`,
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Email sent successfully",
                messageId: result.messageId,
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("❌ Test email API error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Unknown error" },
            { status: 500 }
        );
    }
}

// GETリクエストでシンプルなテストフォームを表示
export async function GET() {
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>メール送信テスト - Evoliss</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.container {
			background: white;
			border-radius: 12px;
			box-shadow: 0 20px 60px rgba(0,0,0,0.3);
			max-width: 500px;
			width: 100%;
			padding: 40px;
		}
		h1 {
			color: #333;
			margin-bottom: 10px;
			font-size: 24px;
		}
		.subtitle {
			color: #666;
			margin-bottom: 30px;
			font-size: 14px;
		}
		.form-group {
			margin-bottom: 20px;
		}
		label {
			display: block;
			margin-bottom: 8px;
			color: #555;
			font-weight: 500;
			font-size: 14px;
		}
		input, textarea {
			width: 100%;
			padding: 12px;
			border: 2px solid #e0e0e0;
			border-radius: 6px;
			font-size: 14px;
			transition: border-color 0.3s;
		}
		input:focus, textarea:focus {
			outline: none;
			border-color: #667eea;
		}
		textarea {
			resize: vertical;
			min-height: 120px;
			font-family: inherit;
		}
		button {
			width: 100%;
			padding: 14px;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			border: none;
			border-radius: 6px;
			font-size: 16px;
			font-weight: 600;
			cursor: pointer;
			transition: transform 0.2s, box-shadow 0.2s;
		}
		button:hover {
			transform: translateY(-2px);
			box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
		}
		button:active {
			transform: translateY(0);
		}
		button:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			transform: none;
		}
		.result {
			margin-top: 20px;
			padding: 15px;
			border-radius: 6px;
			font-size: 14px;
			display: none;
		}
		.result.success {
			background: #d4edda;
			color: #155724;
			border: 1px solid #c3e6cb;
		}
		.result.error {
			background: #f8d7da;
			color: #721c24;
			border: 1px solid #f5c6cb;
		}
		.env-info {
			background: #f8f9fa;
			padding: 15px;
			border-radius: 6px;
			margin-bottom: 20px;
			font-size: 12px;
			color: #666;
		}
		.env-info strong {
			color: #333;
		}
	</style>
</head>
<body>
	<div class="container">
		<h1>📧 メール送信テスト</h1>
		<p class="subtitle">AWS SES経由でテストメールを送信します</p>
		
		<div class="env-info">
			<strong>送信元:</strong> ${process.env.EMAIL_FROM || "未設定"}<br>
			<strong>リージョン:</strong> ${process.env.AWS_REGION || "ap-northeast-1"}
		</div>

		<form id="emailForm">
			<div class="form-group">
				<label for="to">送信先メールアドレス *</label>
				<input type="email" id="to" name="to" required placeholder="example@example.com">
			</div>
			
			<div class="form-group">
				<label for="subject">件名 *</label>
				<input type="text" id="subject" name="subject" required placeholder="テストメール" value="【Evoliss】メール送信テスト">
			</div>
			
			<div class="form-group">
				<label for="message">メッセージ *</label>
				<textarea id="message" name="message" required placeholder="メッセージ内容を入力してください">これはAWS SESからのテストメールです。

正常に受信できていれば、メール送信機能が正しく動作しています。</textarea>
			</div>
			
			<button type="submit" id="submitBtn">送信する</button>
		</form>

		<div id="result" class="result"></div>
	</div>

	<script>
		document.getElementById('emailForm').addEventListener('submit', async (e) => {
			e.preventDefault();
			
			const submitBtn = document.getElementById('submitBtn');
			const resultDiv = document.getElementById('result');
			
			submitBtn.disabled = true;
			submitBtn.textContent = '送信中...';
			resultDiv.style.display = 'none';
			
			const formData = {
				to: document.getElementById('to').value,
				subject: document.getElementById('subject').value,
				message: document.getElementById('message').value,
			};
			
			try {
				const response = await fetch('/api/test-email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(formData),
				});
				
				const data = await response.json();
				
				resultDiv.style.display = 'block';
				
				if (data.success) {
					resultDiv.className = 'result success';
					resultDiv.innerHTML = '✅ メール送信成功！<br>Message ID: ' + (data.messageId || 'N/A');
				} else {
					resultDiv.className = 'result error';
					resultDiv.innerHTML = '❌ メール送信失敗<br>エラー: ' + (data.error || '不明なエラー');
				}
			} catch (error) {
				resultDiv.style.display = 'block';
				resultDiv.className = 'result error';
				resultDiv.innerHTML = '❌ リクエストエラー<br>' + error.message;
			} finally {
				submitBtn.disabled = false;
				submitBtn.textContent = '送信する';
			}
		});
	</script>
</body>
</html>
	`;

    return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}
