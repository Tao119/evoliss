import { S3Client } from "@aws-sdk/client-s3";
import { getAWSConfig } from "./aws/config";

// Create an S3 client using environment-appropriate authentication
export const s3Client = new S3Client(getAWSConfig());
