import { getSecretHash } from "@/services/hash";
import {
	CognitoIdentityProvider,
	ConfirmForgotPasswordCommand,
	ForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
// app/api/reset-password/route.ts
import { type NextRequest, NextResponse } from "next/server";

const cognitoClient = new CognitoIdentityProvider({
	region: process.env.AWS_REGION,
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action, email, code, newPassword } = body;

		const clientId = process.env.COGNITO_CLIENT_ID!;
		const clientSecret = process.env.COGNITO_CLIENT_SECRET!;

		if (action === "send") {
			// パスワードリセットコードを送信
			try {
				const command = new ForgotPasswordCommand({
					ClientId: clientId,
					Username: email,
					SecretHash: getSecretHash(email, clientId, clientSecret),
				});

				await cognitoClient.send(command);

				return NextResponse.json({
					success: true,
					message: "パスワードリセット用のコードをメールで送信しました。",
				});
			} catch (error: any) {
				console.error("Error sending reset code:", error);

				let errorMessage = "パスワードリセットコードの送信に失敗しました。";

				if (error.name === "UserNotFoundException") {
					errorMessage = "登録されていないメールアドレスです。";
				} else if (error.name === "LimitExceededException") {
					errorMessage =
						"リクエストが多すぎます。しばらく時間をおいてから再度お試しください。";
				} else if (error.name === "InvalidParameterException") {
					errorMessage = "無効なメールアドレスです。";
				}

				return NextResponse.json(
					{
						success: false,
						error: errorMessage,
					},
					{ status: 400 },
				);
			}
		} else if (action === "confirm") {
			// パスワードリセットを確認・実行
			if (!code || !newPassword) {
				return NextResponse.json(
					{
						success: false,
						error: "確認コードと新しいパスワードが必要です。",
					},
					{ status: 400 },
				);
			}

			try {
				const command = new ConfirmForgotPasswordCommand({
					ClientId: clientId,
					Username: email,
					ConfirmationCode: code,
					Password: newPassword,
					SecretHash: getSecretHash(email, clientId, clientSecret),
				});

				await cognitoClient.send(command);

				return NextResponse.json({
					success: true,
					message: "パスワードが正常にリセットされました。",
				});
			} catch (error: any) {
				console.error("Error confirming password reset:", error);

				let errorMessage = "パスワードのリセットに失敗しました。";

				if (error.name === "CodeMismatchException") {
					errorMessage = "確認コードが正しくありません。";
				} else if (error.name === "ExpiredCodeException") {
					errorMessage = "確認コードの有効期限が切れています。";
				} else if (error.name === "InvalidPasswordException") {
					errorMessage =
						"パスワードの形式が正しくありません。8文字以上で、大文字・小文字・数字・記号を含める必要があります。";
				} else if (error.name === "UserNotFoundException") {
					errorMessage = "登録されていないメールアドレスです。";
				}

				return NextResponse.json(
					{
						success: false,
						error: errorMessage,
					},
					{ status: 400 },
				);
			}
		} else {
			return NextResponse.json(
				{
					success: false,
					error: "無効なアクションです。",
				},
				{ status: 400 },
			);
		}
	} catch (error) {
		console.error("Reset password API error:", error);
		return NextResponse.json(
			{
				success: false,
				error: "サーバーエラーが発生しました。",
			},
			{ status: 500 },
		);
	}
}
