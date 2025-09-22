import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { CourseCardMessage } from './courseCardMessage';
import { CarouselIndicators } from './CarouselIndicators';
import { useSwipeDetection } from '@/hooks/useSwipeDetection';
import type { Reservation } from '@/type/models';

interface CourseCarouselProps {
    reservations: Reservation[];
    currentIndex: number;
    onIndexChange: (index: number) => void;
    isCoach: boolean;
}

export const CourseCarousel: React.FC<CourseCarouselProps> = ({
    reservations,
    currentIndex,
    onIndexChange,
    isCoach
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    // デバッグ用（開発環境のみ）
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('CourseCarousel:', {
                reservationsCount: reservations.length,
                currentIndex,
                isAnimating
            });
        }
    }, [reservations.length, currentIndex, isAnimating]);

    const handlePrevious = useCallback(() => {
        if (isAnimating || reservations.length <= 1) return;

        try {
            setIsAnimating(true);
            const newIndex = currentIndex > 0 ? currentIndex - 1 : reservations.length - 1;

            // 境界チェック
            if (newIndex < 0 || newIndex >= reservations.length) {
                console.warn('Invalid index calculated:', newIndex);
                setIsAnimating(false);
                return;
            }

            onIndexChange(newIndex);

            setTimeout(() => {
                setIsAnimating(false);
            }, 300);
        } catch (error) {
            console.error('Error in handlePrevious:', error);
            setIsAnimating(false);
        }
    }, [currentIndex, reservations.length, isAnimating, onIndexChange]);

    const handleNext = useCallback(() => {
        if (isAnimating || reservations.length <= 1) return;

        try {
            setIsAnimating(true);
            const newIndex = currentIndex < reservations.length - 1 ? currentIndex + 1 : 0;

            // 境界チェック
            if (newIndex < 0 || newIndex >= reservations.length) {
                console.warn('Invalid index calculated:', newIndex);
                setIsAnimating(false);
                return;
            }

            onIndexChange(newIndex);

            setTimeout(() => {
                setIsAnimating(false);
            }, 300);
        } catch (error) {
            console.error('Error in handleNext:', error);
            setIsAnimating(false);
        }
    }, [currentIndex, reservations.length, isAnimating, onIndexChange]);

    const handleDotClick = useCallback((index: number) => {
        if (isAnimating || index === currentIndex) return;

        try {
            // 境界チェック
            if (index < 0 || index >= reservations.length) {
                console.warn('Invalid dot index:', index);
                return;
            }

            setIsAnimating(true);
            onIndexChange(index);

            setTimeout(() => {
                setIsAnimating(false);
            }, 300);
        } catch (error) {
            console.error('Error in handleDotClick:', error);
            setIsAnimating(false);
        }
    }, [currentIndex, isAnimating, onIndexChange, reservations.length]);

    // スワイプハンドラー（メモ化）
    const swipeHandlers = useMemo(() => ({
        onSwipeLeft: handleNext,
        onSwipeRight: handlePrevious
    }), [handleNext, handlePrevious]);

    const { containerRef, handlers } = useSwipeDetection(swipeHandlers);

    // カードの左右クリック・タップハンドラー
    const handleCardClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Card click detected:', { isAnimating, reservationsLength: reservations.length });
        }

        if (isAnimating || reservations.length <= 1) return;

        // スワイプ中の場合はクリックを無効にする
        const swipeState = containerRef.current?.dataset.swiping;
        if (process.env.NODE_ENV === 'development') {
            console.log('Swipe state:', swipeState);
        }
        if (swipeState === 'true') return;

        const rect = e.currentTarget.getBoundingClientRect();
        let clientX: number;

        if ('touches' in e) {
            // タッチイベントの場合
            if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
            } else {
                return;
            }
        } else {
            // マウスイベントの場合
            clientX = e.clientX;
        }

        const clickX = clientX - rect.left;
        const cardWidth = rect.width;
        const leftZone = cardWidth * 0.3; // 左30%
        const rightZone = cardWidth * 0.7; // 右30%

        if (process.env.NODE_ENV === 'development') {
            console.log('Click position:', { clickX, cardWidth, leftZone, rightZone });
        }

        if (clickX < leftZone) {
            if (process.env.NODE_ENV === 'development') {
                console.log('Triggering previous');
            }
            handlePrevious();
        } else if (clickX > rightZone) {
            if (process.env.NODE_ENV === 'development') {
                console.log('Triggering next');
            }
            handleNext();
        } else {
            if (process.env.NODE_ENV === 'development') {
                console.log('Click in center zone, no action');
            }
        }
    }, [isAnimating, reservations.length, handlePrevious, handleNext]);

    // キーボードナビゲーション
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // カルーセルコンテナにフォーカスがある場合のみ処理
            if (isAnimating || document.activeElement !== containerRef.current) return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    handlePrevious();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    handleNext();
                    break;
                case 'Home':
                    e.preventDefault();
                    handleDotClick(0);
                    break;
                case 'End':
                    e.preventDefault();
                    handleDotClick(reservations.length - 1);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePrevious, handleNext, handleDotClick, isAnimating, reservations.length]);

    if (!reservations || reservations.length === 0) {
        return null;
    }

    // 現在のインデックスが範囲外の場合の修正
    const safeCurrentIndex = Math.max(0, Math.min(currentIndex, reservations.length - 1));

    return (
        <>
            <div className="p-message__course-title">
                {isCoach ? '開講予定の講座' : '受講予定の講座'}
            </div>
            <div className="p-message__course">
                <div
                    ref={containerRef}
                    className="p-message__course-container"
                    role="region"
                    aria-label={`講座カルーセル、${reservations.length}件中${safeCurrentIndex + 1}件目を表示`}
                    aria-live="polite"
                    tabIndex={0}
                >
                    {reservations.map((reservation, index) => (
                        <div
                            key={reservation.id}
                            className={`p-message__course-slide ${index === safeCurrentIndex ? '-active' : ''
                                } ${isAnimating ? '-animating' : ''}`}
                            role="tabpanel"
                            aria-hidden={index !== safeCurrentIndex}
                            aria-label={`講座 ${index + 1}: ${reservation.course?.title || '講座名未設定'}`}
                            onClick={handleCardClick}
                            onTouchEnd={handleCardClick}
                            style={{ pointerEvents: index === safeCurrentIndex ? 'auto' : 'none' }}
                            {...(index === safeCurrentIndex ? handlers : {})}
                        >
                            <CourseCardMessage
                                course={reservation.course}
                                reservation={reservation}
                            />
                        </div>
                    ))}
                </div>

                <CarouselIndicators
                    total={reservations.length}
                    current={safeCurrentIndex}
                    onDotClick={handleDotClick}
                    show={reservations.length > 1}
                />
            </div>
        </>
    );
};