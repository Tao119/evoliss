import { Axios } from "@/services/axios";

const CHUNK_SIZE = 500 * 1024; // 500KB per chunk

/**
 * ファイルをチャンクに分割してアップロード
 * @param file - アップロードするファイル
 * @param keyPrefix - S3のキープレフィックス
 * @param userId - ユーザーID
 * @returns アップロードされたファイルのURL
 */
export async function uploadFileInChunks(
  file: File,
  keyPrefix: string,
  userId: number
): Promise<string | null> {
  try {
    const fileName = `${userId}/${keyPrefix}/${Date.now()}-${file.name}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    console.log(`Uploading file in ${totalChunks} chunks`);

    // 各チャンクをアップロード
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      // チャンクをBase64に変換
      const chunkBase64 = await fileToBase64(chunk);
      
      const response = await Axios.post("/api/s3/upload-chunk", {
        fileName,
        fileType: file.type,
        chunkBase64,
        keyPrefix,
        chunkIndex: i,
        totalChunks,
        isLastChunk: i === totalChunks - 1,
      });

      if (!response.data.success) {
        console.error(`Failed to upload chunk ${i + 1}/${totalChunks}`);
        return null;
      }

      // 最後のチャンクの場合、ファイルURLを返す
      if (i === totalChunks - 1) {
        return response.data.url;
      }
    }

    return null;
  } catch (error) {
    console.error("Error uploading file in chunks:", error);
    return null;
  }
}

/**
 * ファイルをBase64に変換
 */
function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result!.toString().split(",")[1]);
    reader.onerror = (error) => reject(error);
  });
}