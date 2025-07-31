import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { type NextRequest, NextResponse } from "next/server";

// 一時的に動的インポートを使用
let getSignedUrl: any;

export async function POST(req: NextRequest) {
	try {
		// getSignedUrlを動的にインポート
		if (!getSignedUrl) {
			try {
				const presignerModule = await import("@aws-sdk/s3-request-presigner");
				getSignedUrl = presignerModule.getSignedUrl;
			} catch (error) {
				console.error("s3-request-presigner not installed, falling back to base64 upload only");
				return NextResponse.json(
					{ error: "Presigned URL generation not available" },
					{ status: 501 },
				);
			}
		}

		const { fileName, fileType, keyPrefix } = await req.json();

		// Validate required parameters
		if (!fileName || !fileType || !keyPrefix) {
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

		// Define S3 object key
		const s3Key = `${keyPrefix}/${fileName}`;

		// Create the S3 upload command
		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: s3Key,
			ContentType: fileType,
		});

		// Generate presigned URL (有効期限: 5分)
		const presignedUrl = await getSignedUrl(s3Client, command, {
			expiresIn: 300,
		});

		// Construct the final file URL
		const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

		return NextResponse.json({
			success: true,
			presignedUrl,
			fileUrl,
		});
	} catch (error) {
		console.error("Presigned URL generation error:", error);
		return NextResponse.json(
			{ error: "Failed to generate presigned URL" },
			{ status: 500 },
		);
	}
}
