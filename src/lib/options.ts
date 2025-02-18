import CognitoProvider from "next-auth/providers/cognito";

export const authOptions = {
    providers: [
        CognitoProvider({
            clientId: process.env.COGNITO_CLIENT_ID ?? "",
            clientSecret: process.env.COGNITO_CLIENT_SECRET ?? "",
            region: process.env.COGNITO_REGION,
            issuer: process.env.COGNITO_ISSUER ?? "",
            checks: 'nonce',
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET ?? "",

};