import { s3Client } from "@/lib/s3";
import { PutObjectCommand, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, UploadPartCommand } from "@aws-sdk/client-s3";
import { type NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// APIルートの設定
export const runtime = 'nodejs';
export const maxDuration = 60;

// チャンクを一時的に保存するディレクトリ
const TEMP_DIR = "/tmp/upload-chunks";

export async function POST(req: NextRequest) {
	try {
		const { fileName, fileType, chunkBase64, keyPrefix, chunkIndex, totalChunks, isLastChunk } = await req.json();

		// Validate required parameters
		if (!fileName || !fileType || !chunkBase64 || keyPrefix === undefined || chunkIndex === undefined || totalChunks === undefined) {
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
		const buffer = Buffer.from(chunkBase64, "base64");

		// 一時ディレクトリを作成
		await fs.mkdir(TEMP_DIR, { recursive: true });

		// チャンクを一時ファイルに保存
		const tempFilePath = path.join(TEMP_DIR, `${fileName.replace(/\//g, "-")}.part${chunkIndex}`);
		await fs.writeFile(tempFilePath, buffer);

		// 最後のチャンクの場合、すべてのチャンクを結合してS3にアップロード
		if (isLastChunk) {
			// すべてのチャンクを読み込んで結合
			const chunks: Buffer[] = [];
			for (let i = 0; i < totalChunks; i++) {
				const chunkPath = path.join(TEMP_DIR, `${fileName.replace(/\//g, "-")}.part${i}`);
				try {
					const chunkData = await fs.readFile(chunkPath);
					chunks.push(chunkData);
				} catch (error) {
					console.error(`Failed to read chunk ${i}:`, error);
					return NextResponse.json(
						{ error: `Missing chunk ${i}` },
						{ status: 400 },
					);
				}
			}

			// チャンクを結合
			const completeFile = Buffer.concat(chunks);

			// S3にアップロード
			const s3Key = `${keyPrefix}/${fileName}`;
			const command = new PutObjectCommand({
				Bucket: bucketName,
				Key: s3Key,
				Body: completeFile,
				ContentType: fileType,
			});

			await s3Client.send(command);

			// 一時ファイルを削除
			for (let i = 0; i < totalChunks; i++) {
				const chunkPath = path.join(TEMP_DIR, `${fileName.replace(/\//g, "-")}.part${i}`);
				try {
					await fs.unlink(chunkPath);
				} catch (error) {
					console.error(`Failed to delete chunk ${i}:`, error);
				}
			}

			// Construct the file URL
			const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

			return NextResponse.json({ success: true, url: fileUrl });
		} else {
			// チャンクを保存しただけで成功を返す
			return NextResponse.json({ success: true });
		}
	} catch (error) {
		console.error("S3 Upload Chunk Error:", error);
		return NextResponse.json(
			{ error: "Failed to upload chunk to S3" },
			{ status: 500 },
		);
	}
}