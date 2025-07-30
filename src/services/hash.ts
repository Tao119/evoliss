import crypto from "crypto";

export function getSecretHash(
	email: string,
	clientId: string,
	clientSecret: string,
) {
	try {
		const secretHash = crypto
			.createHmac("sha256", clientSecret)
			.update(email + clientId)
			.digest("base64");
		return secretHash;
	} catch (error) {
		console.error("Error generating secret hash:", error);
		throw error;
	}
}
