import { createHmac } from "crypto";

export function getSecretHash(email: string, clientId: string, clientSecret: string) {
    const secretHash =
        createHmac('sha256', clientSecret ?? "")
            .update(email + (clientId ?? ""))
            .digest('base64');
    return secretHash;
}