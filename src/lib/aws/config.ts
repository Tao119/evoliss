/**
 * AWS設定ユーティリティ
 * ローカル環境ではアクセスキー、本番環境ではIAMロールを使用
 */

export interface AWSCredentials {
    accessKeyId: string;
    secretAccessKey: string;
}

export interface AWSConfig {
    region: string;
    credentials?: AWSCredentials;
}

/**
 * 環境に応じたAWS設定を取得
 * ローカル環境: アクセスキーを使用
 * 本番環境: IAMロール（EC2インスタンスプロファイル）を使用
 */
export function getAWSConfig(): AWSConfig {
    const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1';

    // ローカル環境の判定
    const isLocal = process.env.NODE_ENV === 'development' ||
        process.env.NEXTAUTH_URL?.includes('localhost') ||
        process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');

    // ローカル環境でアクセスキーが設定されている場合のみ使用
    if (isLocal && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        console.log('🔑 Using AWS access keys for local development');
        return {
            region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        };
    }

    // 本番環境またはアクセスキーが未設定の場合はIAMロールを使用
    console.log('🔐 Using IAM role for AWS authentication');
    return {
        region,
        // credentialsを指定しない場合、AWS SDKが自動的にIAMロールを使用
    };
}

/**
 * 現在の認証方法を確認
 */
export function getAuthMethod(): 'access-keys' | 'iam-role' {
    const isLocal = process.env.NODE_ENV === 'development' ||
        process.env.NEXTAUTH_URL?.includes('localhost') ||
        process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');

    if (isLocal && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        return 'access-keys';
    }

    return 'iam-role';
}