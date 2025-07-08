import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// トランザクションでラップする高階関数
export async function withTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return fn(tx as PrismaClient);
  });
}

// エラーハンドリング付きトランザクション
export async function safeTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>,
  onError?: (error: any) => void
): Promise<T | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      return fn(tx as PrismaClient);
    });
  } catch (error) {
    console.error("Transaction failed:", error);
    if (onError) {
      onError(error);
    }
    return null;
  }
}
