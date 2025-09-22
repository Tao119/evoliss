import { Axios } from "@/services/axios";
import { uploadFileInChunks } from "./chunkUpload";

/**
 * プリサインドURLを使用して大きなファイルをS3に直接アップロードする
 * @param file - アップロードするファイル
 * @param keyPrefix - S3のキープレフィックス（例: "icon", "course"）
 * @param userId - ユーザーID
 * @returns アップロードされたファイルのURL
 */
export async function uploadLargeFile(
  file: File,
  keyPrefix: string,
  userId: number
): Promise<string | null> {
  try {
    const fileName = `${userId}/${keyPrefix}/${Date.now()}-${file.name}`;

    // 1. プリサインドURLを取得を試みる
    try {
      const presignedResponse = await Axios.post("/api/s3/presigned-url", {
        fileName,
        fileType: file.type,
        keyPrefix,
      });

      if (presignedResponse.data.success) {
        const { presignedUrl, fileUrl } = presignedResponse.data;

        // 2. S3に直接アップロード
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (uploadResponse.ok) {
          return fileUrl;
        }
      }
    } catch {
      console.log("Presigned URL not available, falling back to chunk upload");
    }

    // プリサインドURLが使えない場合はチャンクアップロードを使用
    console.log("Using chunk upload for large file");
    return await uploadFileInChunks(file, keyPrefix, userId);
  } catch (error) {
    console.error("Error uploading large file:", error);
    return null;
  }
}

/**
 * 既存の画像アップロード関数（小さいファイル用）
 * 1MB以下のファイルに推奨
 */
export async function uploadSmallImage(
  file: File,
  type: "header" | "icon" | "course",
  userId: number
): Promise<string | null> {
  try {
    const fileName = `${userId}/${type}/${Date.now()}.${file.type.split("/")[1]}`;
    const fileBase64 = await fileToBase64(file);
    const keyPrefix = type;

    const response = await Axios.post("/api/s3/upload", {
      fileName,
      fileType: file.type,
      fileBase64,
      keyPrefix,
    });

    if (response.data.success) {
      return response.data.url;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

/**
 * ファイルサイズに応じて適切なアップロード方法を選択
 * @param file - アップロードするファイル
 * @param type - アップロードタイプ
 * @param userId - ユーザーID
 * @returns アップロードされたファイルのURL
 */
export async function uploadImage(
  file: File,
  type: "header" | "icon" | "course",
  userId: number
): Promise<string | null> {
  // 1MB以上の場合はプリサインドURLを使用
  if (file.size > 1024 * 1024) {
    console.log("Using presigned URL for large file:", file.size);
    return uploadLargeFile(file, type, userId);
  } else {
    console.log("Using base64 upload for small file:", file.size);
    return uploadSmallImage(file, type, userId);
  }
}

/**
 * ファイルをBase64に変換
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result!.toString().split(",")[1]);
    reader.onerror = (error) => reject(error);
  });
}
