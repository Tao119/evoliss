import { NextRequest, NextResponse } from "next/server";
// import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { contactFuncs } from "@/model/contact";

//　ここ実装します

// SESクライアントの初期化
// const sesClient = new SESClient({
//   region: process.env.AWS_REGION || "ap-northeast-1",
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// });

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    // 入力値の検証
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "必須項目が入力されていません" },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "正しいメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    // DBに保存
    const contact = await contactFuncs.createContact({ name, email, message });
    if (!contact) {
      throw new Error("お問い合わせの保存に失敗しました");
    }

    // 管理者へのメール
    const adminEmailParams = {
      Source: "info@evoliss.jp",
      Destination: {
        ToAddresses: ["NVOLTCoach@gmail.com"],
      },
      Message: {
        Subject: {
          Data: `【お問い合わせ】${name}様より`,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: `
              <html>
                <body style="font-family: sans-serif; line-height: 1.6;">
                  <h2>お問い合わせを受信しました</h2>
                  <p><strong>お問い合わせID:</strong> #${contact.id}</p>
                  <p><strong>お名前:</strong> ${name}</p>
                  <p><strong>メールアドレス:</strong> ${email}</p>
                  <p><strong>お問い合わせ内容:</strong></p>
                  <p style="white-space: pre-wrap; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>
                  <hr>
                  <p style="color: #666; font-size: 0.9em;">※このメールは自動送信されています。</p>
                </body>
              </html>
            `,
            Charset: "UTF-8",
          },
        },
      },
    };

    // ユーザーへの確認メール
    const userEmailParams = {
      Source: "info@evoliss.jp",
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: "【Evoliss】お問い合わせを受け付けました",
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: `
              <html>
                <body style="font-family: sans-serif; line-height: 1.6;">
                  <h2>${name}様</h2>
                  <p>この度はEvolissへお問い合わせいただき、誠にありがとうございます。</p>
                  <p>以下の内容でお問い合わせを受け付けました。</p>
                  
                  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>お問い合わせ番号:</strong> #${contact.id}</p>
                    <p><strong>お名前:</strong> ${name}</p>
                    <p><strong>メールアドレス:</strong> ${email}</p>
                    <p><strong>お問い合わせ内容:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                  </div>
                  
                  <p>お問い合わせ内容を確認次第、担当者よりご連絡させていただきます。</p>
                  <p>今しばらくお待ちください。</p>
                  
                  <hr>
                  <p style="color: #666; font-size: 0.9em;">
                    ※このメールは自動送信されています。<br>
                    ※心当たりがない場合は、このメールを破棄してください。
                  </p>
                  
                  <p>Evoliss運営チーム</p>
                </body>
              </html>
            `,
            Charset: "UTF-8",
          },
        },
      },
    };

    // メール送信
    try {
      // await sesClient.send(new SendEmailCommand(adminEmailParams));
      // await sesClient.send(new SendEmailCommand(userEmailParams));
    } catch (emailError) {
      console.error("SESメール送信エラー:", emailError);
      // メール送信に失敗してもDBには保存されているので、エラーは記録するが処理は続行
    }

    return NextResponse.json({ success: true, contactId: contact.id });
  } catch (error) {
    console.error("お問い合わせ処理エラー:", error);
    return NextResponse.json(
      { error: "お問い合わせ処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}