#!/usr/bin/env node

/**
 * AWS認証テストスクリプト
 * ローカル環境とEC2環境での認証方法をテスト
 */

require("dotenv").config();
const { getAWSConfig, getAuthMethod } = require("../src/lib/aws/config");

async function testAWSAuth() {
  console.log("🔍 AWS認証設定テスト");
  console.log("=".repeat(50));

  // 環境情報の表示
  console.log("📋 環境情報:");
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || "未設定"}`);
  console.log(`  NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || "未設定"}`);
  console.log(
    `  NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || "未設定"}`
  );
  console.log("");

  // 認証方法の確認
  const authMethod = getAuthMethod();
  console.log(`🔐 認証方法: ${authMethod}`);

  // AWS設定の取得
  const awsConfig = getAWSConfig();
  console.log("⚙️  AWS設定:");
  console.log(`  Region: ${awsConfig.region}`);
  console.log(
    `  Credentials: ${
      awsConfig.credentials
        ? "設定済み (アクセスキー)"
        : "未設定 (IAMロール使用)"
    }`
  );
  console.log("");

  // S3テスト
  console.log("📦 S3接続テスト...");
  try {
    const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
    const s3Client = new S3Client(awsConfig);

    const result = await s3Client.send(new ListBucketsCommand({}));
    console.log("✅ S3接続成功");
    console.log(`  バケット数: ${result.Buckets?.length || 0}`);

    // 対象バケットの確認
    const targetBuckets = ["user-icon-bucket", "evoliss-s3"];
    const availableBuckets = result.Buckets?.map((b) => b.Name) || [];

    targetBuckets.forEach((bucket) => {
      if (availableBuckets.includes(bucket)) {
        console.log(`  ✅ ${bucket}: 利用可能`);
      } else {
        console.log(`  ❌ ${bucket}: 見つかりません`);
      }
    });
  } catch (error) {
    console.log("❌ S3接続失敗:");
    console.log(`  エラー: ${error.message}`);
    if (error.name === "CredentialsProviderError") {
      console.log("  💡 IAMロールまたはアクセスキーの設定を確認してください");
    }
  }

  console.log("");

  // SESテスト
  console.log("📧 SES接続テスト...");
  try {
    const { SESClient, GetSendQuotaCommand } = require("@aws-sdk/client-ses");
    const sesClient = new SESClient(awsConfig);

    const result = await sesClient.send(new GetSendQuotaCommand({}));
    console.log("✅ SES接続成功");
    console.log(`  送信制限: ${result.Max24HourSend}/日`);
    console.log(`  送信レート: ${result.MaxSendRate}/秒`);
    console.log(`  送信済み: ${result.SentLast24Hours}/24時間`);
  } catch (error) {
    console.log("❌ SES接続失敗:");
    console.log(`  エラー: ${error.message}`);
    if (error.name === "CredentialsProviderError") {
      console.log("  💡 IAMロールまたはアクセスキーの設定を確認してください");
    }
  }

  console.log("");

  // Cognitoテスト
  console.log("👤 Cognito接続テスト...");
  try {
    const {
      CognitoIdentityProvider,
      ListUserPoolsCommand,
    } = require("@aws-sdk/client-cognito-identity-provider");
    const cognitoClient = new CognitoIdentityProvider(awsConfig);

    const result = await cognitoClient.send(
      new ListUserPoolsCommand({ MaxResults: 10 })
    );
    console.log("✅ Cognito接続成功");
    console.log(`  ユーザープール数: ${result.UserPools?.length || 0}`);
  } catch (error) {
    console.log("❌ Cognito接続失敗:");
    console.log(`  エラー: ${error.message}`);
    if (error.name === "CredentialsProviderError") {
      console.log("  💡 IAMロールまたはアクセスキーの設定を確認してください");
    }
  }

  console.log("");
  console.log("🎯 推奨事項:");

  if (authMethod === "access-keys") {
    console.log("  - ローカル開発環境でアクセスキーを使用中");
    console.log("  - 本番環境ではIAMロールに切り替えることを推奨");
  } else {
    console.log("  - IAMロールを使用中（推奨設定）");
    console.log("  - EC2インスタンスでは自動的に認証情報が取得されます");
  }

  console.log("=".repeat(50));
}

// スクリプト実行
if (require.main === module) {
  testAWSAuth().catch(console.error);
}

module.exports = { testAWSAuth };
