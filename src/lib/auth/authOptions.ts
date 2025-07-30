import { getSecretHash } from "@/services/hash";
import {
	CognitoIdentityProvider,
	InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { type NextAuthOptions } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";
import CredentialsProvider from "next-auth/providers/credentials";
import { Issuer } from "openid-client";

const cognitoProvider = CognitoProvider({
	clientId: process.env.COGNITO_CLIENT_ID || "",
	clientSecret: process.env.COGNITO_CLIENT_SECRET || "",
	issuer: process.env.COGNITO_ISSUER,
});

const refreshAccessToken = async (refreshToken?: string) => {
	if (!refreshToken) {
		return null;
	}

	const client_id = process.env.COGNITO_CLIENT_ID ?? "";
	const client_secret = process.env.COGNITO_CLIENT_SECRET ?? "";
	const issuer = await Issuer.discover(cognitoProvider.wellKnown ?? "");
	const token_endpoint = issuer.metadata.token_endpoint ?? "";

	const params = new URLSearchParams({
		client_id,
		client_secret,
		grant_type: "refresh_token",
		refresh_token: refreshToken,
	});

	try {
		const response = await fetch(token_endpoint, {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			method: "POST",
			body: params.toString(),
		});

		const newTokens = await response.json();

		if (!response.ok) {
			throw new Error("Failed to refresh access token");
		}

		return {
			idToken: newTokens.id_token,
			accessToken: newTokens.access_token,
			expiresAt: Math.floor(Date.now() / 1000) + (newTokens.expires_in ?? 3600),
		};
	} catch (error) {
		console.error("Error refreshing access token", error);
		return null;
	}
};

export const authOptions: NextAuthOptions = {
	session: {
		strategy: "jwt",
		maxAge: 60 * 60 * 24,
	},
	providers: [
		CredentialsProvider({
			name: "Cognito",
			credentials: {
				email: { label: "Email", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					console.error("Missing email or password");
					return null;
				}

				const cognitoClient = new CognitoIdentityProvider({
					region: process.env.AWS_REGION,
				});

				const email = credentials.email;
				const password = credentials.password;

				// 環境変数の確認
				if (!process.env.COGNITO_CLIENT_ID || !process.env.COGNITO_CLIENT_SECRET) {
					console.error("Missing Cognito configuration");
					return null;
				}

				try {
					const response = await cognitoClient.send(
						new InitiateAuthCommand({
							AuthFlow: "USER_PASSWORD_AUTH",
							ClientId: process.env.COGNITO_CLIENT_ID,
							AuthParameters: {
								USERNAME: email,
								PASSWORD: password,
								SECRET_HASH: getSecretHash(
									email,
									process.env.COGNITO_CLIENT_ID,
									process.env.COGNITO_CLIENT_SECRET,
								),
							},
						}),
					);

					if (response.AuthenticationResult) {
						return {
							email,
							idToken: response.AuthenticationResult.IdToken,
							refreshToken: response.AuthenticationResult.RefreshToken,
							expiresAt: Math.floor(Date.now() / 1000) + 3600,
						};
					} else {
						console.error("No authentication result");
						return null;
					}
				} catch (error: any) {
					console.error("Cognito authentication error:", error);
					
					// ユーザーが未確認の場合のエラーハンドリング
					if (error.name === "UserNotConfirmedException") {
						console.error("User not confirmed");
						return null;
					}
					
					// その他のCognitoエラー
					if (error.name === "NotAuthorizedException") {
						console.error("Invalid credentials");
						return null;
					}
					
					// エラーを再スロー
					return null;
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.email = user.email;
				token.refreshToken = user.refreshToken;
				token.expiresIn = user.expiresIn;
			}

			const now = Math.floor(Date.now() / 1000);

			if (token.expiresIn && token.expiresIn < now) {
				console.log("Refreshing access token...");
				const newToken = await refreshAccessToken(token.refreshToken);
				if (newToken) {
					token.idToken = newToken.idToken;
					token.expiresIn = newToken.expiresAt;
				}
			}

			return token;
		},
		async session({ session, token }) {
			session.user = { email: token.email };
			session.idToken = token.idToken;
			return session;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
	cookies: {
		sessionToken: {
			name: `next-auth.session-token`,
			options: {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				secure: process.env.NODE_ENV === "production",
			},
		},
	},
};
