export const isStrongPassword = (password: string) => {
	const hasMinLength = password.length >= 8;
	const hasUppercase = /[A-Z]/.test(password);
	const hasLowercase = /[a-z]/.test(password);
	const hasNumber = /[0-9]/.test(password);
	if (!hasMinLength) {
		return "パスワードは8文字以上にしてください";
	}
	if (!hasUppercase) {
		return "パスワードには1文字以上の大文字を入れてください";
	}
	if (!hasLowercase) {
		return "パスワードには1文字以上の小文字を入れてください";
	}
	if (!hasNumber) {
		return "パスワードには1文字以上の数字を入れてください";
	}
	return "";
};
