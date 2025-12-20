import { S3Client } from "@aws-sdk/client-s3";

// Create an S3 client using environment variables
export const s3Client = new S3Client({
	region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION, // AWS region
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_S3_ACCESS_KEY!, // Access key ID
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!, // Secret access key
	},
});
