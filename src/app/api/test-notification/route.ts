import { NextRequest, NextResponse } from "next/server";
import { sendMessageNotification } from "@/lib/notification/notificationService";

export async function POST(request: NextRequest) {
    try {
        const { userId, recipientEmail, recipientName, senderName, messageContent, roomKey } = await request.json();

        if (!userId || !recipientEmail || !recipientName || !senderName || !messageContent || !roomKey) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        console.log("🧪 Testing notification system:", {
            userId,
            recipientEmail,
            recipientName,
            senderName,
            messageContent,
            roomKey
        });

        // 通知を送信
        const result = await sendMessageNotification({
            recipientId: userId,
            recipientEmail,
            recipientName,
            senderName,
            messageContent,
            roomKey,
        });

        console.log("🧪 Notification test result:", result);

        return NextResponse.json({
            success: true,
            message: "Notification sent successfully",
            result,
        });

    } catch (error) {
        console.error("❌ Test notification error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

// GETリクエストでテストフォームを表示
export async function GET() {
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>通知システムテスト - Evoliss</title>
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
            max-width: 600px;
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
            min-height: 80px;
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
    </style>
</head>
<body>
    <div class="container">
        <h1>🔔 通知システムテスト</h1>
        <p class="subtitle">リアルタイム通知とメール通知をテストします</p>

        <form id="notificationForm">
            <div class="form-group">
                <label for="userId">ユーザーID *</label>
                <input type="number" id="userId" name="userId" required placeholder="1" value="1">
            </div>
            
            <div class="form-group">
                <label for="recipientEmail">受信者メールアドレス *</label>
                <input type="email" id="recipientEmail" name="recipientEmail" required placeholder="test@example.com">
            </div>
            
            <div class="form-group">
                <label for="recipientName">受信者名 *</label>
                <input type="text" id="recipientName" name="recipientName" required placeholder="テストユーザー" value="テストユーザー">
            </div>
            
            <div class="form-group">
                <label for="senderName">送信者名 *</label>
                <input type="text" id="senderName" name="senderName" required placeholder="送信者" value="送信者">
            </div>
            
            <div class="form-group">
                <label for="messageContent">メッセージ内容 *</label>
                <textarea id="messageContent" name="messageContent" required placeholder="テストメッセージです">これは通知システムのテストメッセージです。</textarea>
            </div>
            
            <div class="form-group">
                <label for="roomKey">ルームキー *</label>
                <input type="text" id="roomKey" name="roomKey" required placeholder="test-room" value="test-room">
            </div>
            
            <button type="submit" id="submitBtn">通知を送信</button>
        </form>

        <div id="result" class="result"></div>
    </div>

    <script>
        document.getElementById('notificationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const resultDiv = document.getElementById('result');
            
            submitBtn.disabled = true;
            submitBtn.textContent = '送信中...';
            resultDiv.style.display = 'none';
            
            const formData = {
                userId: parseInt(document.getElementById('userId').value),
                recipientEmail: document.getElementById('recipientEmail').value,
                recipientName: document.getElementById('recipientName').value,
                senderName: document.getElementById('senderName').value,
                messageContent: document.getElementById('messageContent').value,
                roomKey: document.getElementById('roomKey').value,
            };
            
            try {
                const response = await fetch('/api/test-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
                
                const data = await response.json();
                
                resultDiv.style.display = 'block';
                
                if (data.success) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = '✅ 通知送信成功！<br>リアルタイム通知とメール通知が送信されました。';
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = '❌ 通知送信失敗<br>エラー: ' + (data.error || '不明なエラー');
                }
            } catch (error) {
                resultDiv.style.display = 'block';
                resultDiv.className = 'result error';
                resultDiv.innerHTML = '❌ リクエストエラー<br>' + error.message;
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '通知を送信';
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