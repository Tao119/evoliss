/**
 * クライアントサイド用AWS設定
 * フロントエンドでは環境変数の制約があるため、NEXT_PUBLIC_*を使用
 */

export interface ClientAWSConfig {
    region: string;
    // クライアントサイドでは認証情報は含めない（セキュリティ上の理由）
}

/**
 * クライアントサイド用AWS設定を取得
 */
export function getClientAWSConfig(): ClientAWSConfig {
    return {
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1',
    };
}