import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { type NextRequest, NextResponse } from "next/server";

// APIルートの設定
export const runtime = 'nodejs';
export const maxDuration = 60; // 60秒のタイムアウト

export async function POST(req: NextRequest) {
	try {
		const { fileName, fileType, fileBase64, keyPrefix } = await req.json();

		// Validate required parameters
		if (!fileName || !fileType || !fileBase64 || !keyPrefix) {
			return NextResponse.json(
				{ error: "Missing required parameters" },
				{ status: 400 },
			);
		}

		// Get S3 bucket name from environment variables
		const bucketName = process.env.S3_BUCKET_NAME;
		if (!bucketName) {
			throw new Error("S3_BUCKET_NAME environment variable is not set");
		}

		// Convert Base64 string to Buffer
		const buffer = Buffer.from(fileBase64, "base64");

		// Define S3 object key
		const s3Key = `${keyPrefix}/${fileName}`;

		// Create the S3 upload command
		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: s3Key,
			Body: buffer,
			ContentType: fileType,
		});

		// Execute the upload command
		await s3Client.send(command);

		// Construct the file URL
		const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

		return NextResponse.json({ success: true, url: fileUrl });
	} catch (error) {
		console.error("S3 Upload Error:", error);
		return NextResponse.json(
			{ error: "Failed to upload to S3" },
			{ status: 500 },
		);
	}
}
