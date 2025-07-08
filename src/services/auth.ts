import { signIn, signOut } from "next-auth/react";

export type LoginParams = {
	email: string;
	password: string;
	callbackUrl?: string;
};

export const signin = async (params: LoginParams) => {
	const { email, password, callbackUrl } = params;

	const result = await signIn("credentials", {
		email,
		password,
		redirect: false,
		callbackUrl,
	});

	return result;
};

export const signout = async () => {
	await signOut({ redirect: false });
};
