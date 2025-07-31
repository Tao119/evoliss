/**
 * 画像をリサイズして圧縮する関数
 * @param file - リサイズする画像ファイル
 * @param maxWidth - 最大幅（デフォルト: 1920px）
 * @param maxHeight - 最大高さ（デフォルト: 1920px）
 * @param quality - JPEG品質（0-1、デフォルト: 0.8）
 * @returns リサイズされた画像のBlob
 */
export const resizeImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // アスペクト比を保持しながらサイズを計算
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // canvasのサイズを設定
        canvas.width = width;
        canvas.height = height;
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, width, height);
        
        // Blobに変換
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * 画像ファイルのサイズをチェックしてリサイズが必要か判定
 * @param file - チェックする画像ファイル
 * @param maxSizeInMB - 最大ファイルサイズ（MB単位、デフォルト: 1MB）
 * @returns リサイズが必要な場合はtrue
 */
export const needsResize = (file: File, maxSizeInMB: number = 1): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size > maxSizeInBytes;
};

/**
 * 画像を自動的にリサイズして最適なサイズに調整
 * @param file - 処理する画像ファイル
 * @param targetSizeInMB - 目標ファイルサイズ（MB単位、デフォルト: 1MB）
 * @returns 処理された画像ファイル
 */
export const optimizeImage = async (
  file: File,
  targetSizeInMB: number = 1
): Promise<File> => {
  // 画像がすでに小さい場合はそのまま返す
  if (!needsResize(file, targetSizeInMB)) {
    return file;
  }
  
  let quality = 0.9;
  let maxDimension = 1920;
  let blob: Blob = file;
  let attempts = 0;
  const maxAttempts = 5;
  const targetSizeInBytes = targetSizeInMB * 1024 * 1024;
  
  // 品質と寸法を調整しながら目標サイズに近づける
  while (blob.size > targetSizeInBytes && attempts < maxAttempts) {
    try {
      blob = await resizeImage(file, maxDimension, maxDimension, quality);
      
      if (blob.size > targetSizeInBytes) {
        // まだ大きい場合は品質を下げる
        quality -= 0.1;
        // 品質が低くなりすぎたら寸法も小さくする
        if (quality < 0.5) {
          maxDimension = Math.floor(maxDimension * 0.8);
          quality = 0.7; // 品質をリセット
        }
      }
      
      attempts++;
    } catch (error) {
      console.error('Error resizing image:', error);
      throw error;
    }
  }
  
  // BlobをFileに変換
  return new File([blob], file.name, {
    type: blob.type,
    lastModified: Date.now(),
  });
};