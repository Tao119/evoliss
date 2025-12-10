import { Axios } from "@/services/axios";

/**
 * メッセージ用画像をアップロードする
 * @param file アップロードするファイル
 * @param userId ユーザーID
 * @returns アップロード結果
 */
export async function uploadMessageImage(
    file: File,
    userId: number
): Promise<{
    success: boolean;
    url?: string;
    size?: number;
    type?: string;
    error?: string;
}> {
    try {
        // ファイルサイズチェック（5MB）
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return {
                success: false,
                error: "画像サイズが大きすぎます。5MB以下の画像をアップロードしてください。"
            };
        }

        // ファイルタイプチェック
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return {
                success: false,
                error: "サポートされていない画像形式です。JPEG、PNG、GIF、WebPのみ対応しています。"
            };
        }

        // ファイルをBase64に変換
        const fileBase64 = await fileToBase64(file);

        // APIにアップロード
        const response = await Axios.post("/api/message/upload-image", {
            fileName: file.name,
            fileType: file.type,
            fileBase64,
            userId
        });

        if (response.data.success) {
            return {
                success: true,
                url: response.data.url,
                size: response.data.size,
                type: response.data.type
            };
        } else {
            return {
                success: false,
                error: response.data.error || "アップロードに失敗しました"
            };
        }

    } catch (error) {
        console.error("Message image upload error:", error);
        return {
            success: false,
            error: "アップロードに失敗しました"
        };
    }
}

/**
 * ファイルをBase64文字列に変換
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // "data:image/jpeg;base64," の部分を除去
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 画像ファイルかどうかを判定
 */
export function isImageFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(file.type);
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}