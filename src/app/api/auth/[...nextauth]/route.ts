import NextAuth, { NextAuthOptions } from 'next-auth'
import { Issuer } from 'openid-client'
import { jwtDecode } from 'jwt-decode'
import * as crypto from 'crypto'
import CognitoProvider from 'next-auth/providers/cognito'
import { getSecretHash } from '@/services/hash'
import {
    CognitoIdentityProvider,
    InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import CredentialsProvider from 'next-auth/providers/credentials'

const cognitoProvider = CognitoProvider({
    clientId: process.env.COGNITO_CLIENT_ID || '',
    clientSecret: process.env.COGNITO_CLIENT_SECRET || '',
    issuer: process.env.COGNITO_ISSUER,
})

const refreshAccessToken = async (refreshToken?: string) => {
    if (!refreshToken) {
        return null
    }

    const client_id = process.env.COGNITO_CLIENT_ID ?? ''
    const client_secret = process.env.COGNITO_CLIENT_SECRET ?? ''
    const issuer = await Issuer.discover(cognitoProvider.wellKnown ?? '')
    const token_endpoint = issuer.metadata.token_endpoint ?? ''
    const basicAuthParams = `${client_id}:${client_secret}`
    const basicAuth = Buffer.from(basicAuthParams).toString('base64')
    const params = new URLSearchParams({
        client_id,
        client_secret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    })

    try {
        const response = await fetch(token_endpoint, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${basicAuth}`,
            },
            method: 'POST',
            body: params.toString(),
        })

        const newTokens = await response.json()

        return {
            idToken: newTokens.id_token,
            accessToken: newTokens.access_token,
        }
    } catch (error) {
        console.error('Error refreshing access token')
        throw error
    }
}

const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Cognito',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const cognitoClient = new CognitoIdentityProvider({
                    region: process.env.AWS_REGION,
                })

                const email = credentials?.email ?? ''
                const password = credentials?.password ?? ''

                try {
                    const response = await cognitoClient.send(
                        new InitiateAuthCommand({
                            AuthFlow: 'USER_PASSWORD_AUTH',
                            ClientId: process.env.COGNITO_CLIENT_ID,
                            AuthParameters: {
                                USERNAME: email,
                                PASSWORD: password,
                                SECRET_HASH: getSecretHash(email, process.env.COGNITO_CLIENT_ID!, process.env.COGNITO_CLIENT_SECRET!),
                            },
                        }),
                    )

                    if (response.AuthenticationResult) {
                        if (!response.AuthenticationResult.IdToken) {
                            throw new Error('No Id Token')
                        }

                        const { IdToken, AccessToken, ExpiresIn, RefreshToken } =
                            response.AuthenticationResult

                        return {
                            email,
                            idToken: IdToken,
                            accessToken: AccessToken,
                            expiresIn: ExpiresIn,
                            refreshToken: RefreshToken,
                        }
                    } else {
                        throw new Error('有効なレスポンスがありませんでした')
                    }
                } catch (error: any) {
                    throw new Error(error.name)
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.idToken = user.idToken
                token.accessToken = user.accessToken
                token.expiresIn = user.expiresIn
                token.refreshToken = user.refreshToken
                token.email = user.email
            }

            const decodedToken = jwtDecode(token.idToken!)
            const currentTime = Math.floor(Date.now() / 1000)

            if (decodedToken.exp && decodedToken.exp < currentTime) {
                try {
                    const refreshedTokens = await refreshAccessToken(token.refreshToken)

                    if (refreshedTokens?.idToken && refreshedTokens?.accessToken) {
                        token.idToken = refreshedTokens.idToken
                        token.accessToken = refreshedTokens.accessToken
                    } else {
                        throw new Error()
                    }
                } catch (error) {
                    token.error = 'RefreshTokenError'
                }
            }

            return token
        },
        async session({ session, token }) {
            session.idToken = token.idToken
            session.accessToken = token.accessToken
            session.error = token.error
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };