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
    // メモリ効率的な処理のため、createObjectURLを使用
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          URL.revokeObjectURL(url);
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
        
        // メモリを解放
        URL.revokeObjectURL(url);
        
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
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
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
 * 大きな画像に対して段階的にサイズを削減
 * @param file - 処理する画像ファイル  
 * @param targetSizeInMB - 目標サイズ（MB単位）
 * @returns 処理された画像ファイル
 */
const progressiveResize = async (
  file: File,
  targetSizeInMB: number
): Promise<File> => {
  const fileSizeInMB = file.size / (1024 * 1024);
  
  // 初期パラメータの設定（ファイルサイズに応じて調整）
  let maxDimension: number;
  let quality: number;
  
  if (fileSizeInMB > 100) {
    // 100MB以上の場合は大幅に縮小
    maxDimension = 800;
    quality = 0.6;
  } else if (fileSizeInMB > 50) {
    // 50-100MBの場合
    maxDimension = 1200;
    quality = 0.7;
  } else if (fileSizeInMB > 10) {
    // 10-50MBの場合
    maxDimension = 1600;
    quality = 0.75;
  } else {
    // 10MB以下の場合
    maxDimension = 1920;
    quality = 0.8;
  }
  
  try {
    const blob = await resizeImage(file, maxDimension, maxDimension, quality);
    
    // BlobをFileに変換
    const resizedFile = new File([blob], file.name, {
      type: blob.type,
      lastModified: Date.now(),
    });
    
    // まだ目標サイズより大きい場合は再帰的に処理
    if (resizedFile.size > targetSizeInMB * 1024 * 1024 && quality > 0.3) {
      return progressiveResize(resizedFile, targetSizeInMB);
    }
    
    return resizedFile;
  } catch (error) {
    console.error('Progressive resize failed:', error);
    throw error;
  }
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
  
  const fileSizeInMB = file.size / (1024 * 1024);
  console.log(`Original file size: ${fileSizeInMB.toFixed(2)}MB`);
  
  // ファイルサイズが非常に大きい場合の警告
  if (fileSizeInMB > 500) {
    console.warn(`Very large image detected (${fileSizeInMB.toFixed(2)}MB). Processing may take time...`);
  }
  
  try {
    // 段階的なリサイズを実行
    const optimizedFile = await progressiveResize(file, targetSizeInMB);
    
    const optimizedSizeInMB = optimizedFile.size / (1024 * 1024);
    console.log(`Optimized file size: ${optimizedSizeInMB.toFixed(2)}MB`);
    
    return optimizedFile;
  } catch (error) {
    console.error('Error optimizing image:', error);
    
    // エラーが発生した場合、より保守的な設定で再試行
    try {
      console.log('Retrying with conservative settings...');
      const blob = await resizeImage(file, 640, 640, 0.5);
      return new File([blob], file.name, {
        type: blob.type,
        lastModified: Date.now(),
      });
    } catch (retryError) {
      console.error('Retry also failed:', retryError);
      throw new Error('画像の処理に失敗しました。画像のサイズが大きすぎる可能性があります。');
    }
  }
};