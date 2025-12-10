import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { type NextRequest, NextResponse } from "next/server";

// APIルートの設定
export const runtime = 'nodejs';
export const maxDuration = 60;

// 画像の最大サイズ（5MB）
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// 許可される画像タイプ
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
];

export async function POST(req: NextRequest) {
    try {
        const { fileName, fileType, fileBase64, userId } = await req.json();

        // バリデーション
        if (!fileName || !fileType || !fileBase64 || !userId) {
            return NextResponse.json(
                { error: "必要なパラメータが不足しています" },
                { status: 400 }
            );
        }

        // ファイルタイプの確認
        if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
            return NextResponse.json(
                { error: "サポートされていない画像形式です。JPEG、PNG、GIF、WebPのみ対応しています。" },
                { status: 400 }
            );
        }

        // Base64からBufferに変換
        const buffer = Buffer.from(fileBase64, "base64");

        // ファイルサイズの確認
        if (buffer.length > MAX_IMAGE_SIZE) {
            return NextResponse.json(
                { error: "画像サイズが大きすぎます。5MB以下の画像をアップロードしてください。" },
                { status: 400 }
            );
        }

        // S3バケット名の取得
        const bucketName = process.env.S3_BUCKET_NAME;
        if (!bucketName) {
            throw new Error("S3_BUCKET_NAME environment variable is not set");
        }

        // ユニークなファイル名を生成
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = fileName.split('.').pop();
        const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`;

        // S3オブジェクトキー
        const s3Key = `message-images/${userId}/${uniqueFileName}`;

        // S3アップロードコマンド
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: buffer,
            ContentType: fileType,
            // 画像を公開読み取り可能に設定
            ACL: 'public-read'
        });

        // S3にアップロード
        await s3Client.send(command);

        // ファイルURLを構築
        const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

        return NextResponse.json({
            success: true,
            url: fileUrl,
            size: buffer.length,
            type: fileType
        });

    } catch (error) {
        console.error("Message Image Upload Error:", error);
        return NextResponse.json(
            { error: "画像のアップロードに失敗しました" },
            { status: 500 }
        );
    }
}