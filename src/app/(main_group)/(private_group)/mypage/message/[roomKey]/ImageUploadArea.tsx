"use client";

import React, { useState, useRef, forwardRef } from "react";
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

export const ImageUploadArea = forwardRef<HTMLInputElement, ImageUploadAreaProps>(
    ({ onImageUpload, userId, disabled }, ref) => {
        const [selectedImage, setSelectedImage] = useState<File | null>(null);
        const [previewUrl, setPreviewUrl] = useState<string | null>(null);
        const [isUploading, setIsUploading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);

        // ref を fileInputRef に接続
        React.useImperativeHandle(ref, () => fileInputRef.current as HTMLInputElement);

        const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

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

        return (
            <div className="p-message__image-upload">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={disabled}
                />

                {!selectedImage ? (
                    <div className="p-message__image-placeholder">
                        画像を選択してください
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
                                className="p-message__image-send-button"
                                onClick={handleUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? "送信中..." : "送信"}
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
    }
);

ImageUploadArea.displayName = 'ImageUploadArea';