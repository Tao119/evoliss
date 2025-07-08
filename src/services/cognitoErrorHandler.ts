export const getCognitoErrorMessage = (
	error: any,
	context = "general",
): string => {
	console.error(`Cognito ${context} error:`, error);

	switch (error.name) {
		case "UsernameExistsException":
			return "既に使用されているメールアドレスです";

		case "UserNotFoundException":
			return context === "signin"
				? "メールアドレスまたはパスワードが正しくありません"
				: "登録されていないメールアドレスです";

		case "UserNotConfirmedException":
			return "メールアドレスの確認が完了していません。確認メールをご確認ください";

		case "AliasExistsException":
			return "このメールアドレスは既に別のアカウントで使用されています";

		case "InvalidPasswordException":
			return "パスワードは8文字以上で、大文字・小文字・数字・記号を含める必要があります";

		case "PasswordResetRequiredException":
			return "パスワードのリセットが必要です";

		case "NotAuthorizedException":
			if (error.message?.includes("password")) {
				return "パスワードが正しくありません";
			}
			return "認証に失敗しました。入力内容を確認してください";

		case "CodeMismatchException":
			return "確認コードが正しくありません";

		case "ExpiredCodeException":
			return "確認コードの有効期限が切れています";

		case "CodeDeliveryFailureException":
			return "確認コードの送信に失敗しました。メールアドレスを確認してください";

		case "InvalidParameterException":
			if (error.message?.includes("email")) {
				return "メールアドレスの形式が正しくありません";
			} else if (error.message?.includes("password")) {
				return "パスワードの形式が正しくありません";
			}
			return "入力された情報に不正な値があります";

		case "TooManyRequestsException":
		case "LimitExceededException":
			return "リクエストが多すぎます。しばらく時間をおいてから再度お試しください";

		case "TooManyFailedAttemptsException":
			return "失敗回数が多すぎます。しばらく時間をおいてから再度お試しください";

		case "InternalErrorException":
			return "サーバー内部エラーが発生しました。しばらく時間をおいてから再度お試しください";

		case "ResourceNotFoundException":
			return "サービスが一時的に利用できません。しばらく時間をおいてから再度お試しください";

		case "ServiceQuotaExceededException":
			return "サービスの利用上限に達しています。管理者にお問い合わせください";

		case "UserLambdaValidationException":
			return "ユーザー情報の検証に失敗しました。入力内容を確認してください";

		case "PreSignUpTriggerException":
			return "ユーザー登録の前処理でエラーが発生しました";

		case "UnexpectedLambdaException":
			return "サーバー処理でエラーが発生しました。しばらく時間をおいてから再度お試しください";

		case "UserPoolAddOnNotEnabledException":
			return "この機能は現在利用できません";

		case "InvalidEmailRoleAccessPolicyException":
			return "メール送信の設定に問題があります。管理者にお問い合わせください";

		case "InvalidSmsRoleAccessPolicyException":
		case "InvalidSmsRoleTrustRelationshipException":
			return "SMS送信の設定に問題があります。管理者にお問い合わせください";

		case "NetworkingError":
		case "TimeoutError":
			return "ネットワークエラーが発生しました。インターネット接続を確認してください";

		default:
		// エラーの詳細はコンソールに記録済み
		switch (context) {
			case "signup":
				return "アカウントの作成に失敗しました。入力内容を確認してください";
			case "signin":
				return "ログインに失敗しました。入力内容を確認してください";
			case "reset":
				return "パスワードリセットに失敗しました。入力内容を確認してください";
			case "confirm":
				return "確認処理に失敗しました。入力内容を確認してください";
			default:
				return "処理に失敗しました。入力内容を確認してください";
		}
	}
};
