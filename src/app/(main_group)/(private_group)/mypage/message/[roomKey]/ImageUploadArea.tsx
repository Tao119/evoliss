"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/button";
import { ImageBox } from "@/components/imageBox";
import { uploadMessageImage, isImageFile, formatFileSize } from "@/utils/messageImageUpload";

interface ImageUploadAreaProps {
    onImageUpload: (imageData: {
        url: string;
        size: number;
        type: string;
    }) => void;
    userId: number;
    disabled?: boolean;
}

export const ImageUploadArea = ({ onImageUpload, userId, disabled }: ImageUploadAreaProps) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);

        // ファイルタイプチェック
        if (!isImageFile(file)) {
            setError("サポートされていない画像形式です。JPEG、PNG、GIF、WebPのみ対応しています。");
            return;
        }

        // ファイルサイズチェック（5MB）
        if (file.size > 5 * 1024 * 1024) {
            setError("画像サイズが大きすぎます。5MB以下の画像をアップロードしてください。");
            return;
        }

        setSelectedImage(file);

        // プレビュー用のURLを作成
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleUpload = async () => {
        if (!selectedImage) return;

        setIsUploading(true);
        setError(null);

        try {
            const result = await uploadMessageImage(selectedImage, userId);

            if (result.success && result.url && result.size && result.type) {
                onImageUpload({
                    url: result.url,
                    size: result.size,
                    type: result.type
                });

                // リセット
                setSelectedImage(null);
                setPreviewUrl(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                setError(result.error || "アップロードに失敗しました");
            }
        } catch (error) {
            setError("アップロードに失敗しました");
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];

            // ファイル選択と同じ処理
            setError(null);

            if (!isImageFile(file)) {
                setError("サポートされていない画像形式です。JPEG、PNG、GIF、WebPのみ対応しています。");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setError("画像サイズが大きすぎます。5MB以下の画像をアップロードしてください。");
                return;
            }

            setSelectedImage(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    return (
        <div className="p-message__image-upload">
            {!selectedImage ? (
                <div
                    className="p-message__image-drop-area"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="p-message__image-drop-content">
                        <div className="p-message__image-drop-icon">📷</div>
                        <div className="p-message__image-drop-text">
                            画像をドラッグ&ドロップまたはクリックして選択
                        </div>
                        <div className="p-message__image-drop-subtext">
                            JPEG、PNG、GIF、WebP（最大5MB）
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        disabled={disabled}
                    />
                </div>
            ) : (
                <div className="p-message__image-preview">
                    <div className="p-message__image-preview-container">
                        <ImageBox
                            src={previewUrl!}
                            className="p-message__image-preview-image"
                            objectFit="contain"
                        />
                        <div className="p-message__image-preview-info">
                            <div className="p-message__image-preview-name">
                                {selectedImage.name}
                            </div>
                            <div className="p-message__image-preview-size">
                                {formatFileSize(selectedImage.size)}
                            </div>
                        </div>
                    </div>

                    <div className="p-message__image-preview-actions">
                        <Button
                            className="p-message__image-cancel-button"
                            onClick={handleCancel}
                            disabled={isUploading}
                        >
                            キャンセル
                        </Button>
                        <Button
                            className="p-message__image-upload-button"
                            onClick={handleUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? "アップロード中..." : "画像を送信"}
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-message__image-error">
                    {error}
                </div>
            )}
        </div>
    );
};