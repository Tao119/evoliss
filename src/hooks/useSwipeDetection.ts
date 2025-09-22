import { useCallback, useRef, useState } from 'react';

interface SwipeState {
    startX: number;
    startY: number;
    currentX: number;
    isDragging: boolean;
    startTime: number;
}

interface SwipeConfig {
    threshold: number; // スワイプと判定する最小距離
    velocityThreshold: number; // 高速スワイプの閾値
    maxTime: number; // スワイプの最大時間
    minDistance: number; // 最小移動距離
}

interface SwipeHandlers {
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
}

const defaultConfig: SwipeConfig = {
    threshold: 50,
    velocityThreshold: 0.5,
    maxTime: 300,
    minDistance: 30
};

export const useSwipeDetection = (
    handlers: SwipeHandlers,
    config: Partial<SwipeConfig> = {}
) => {
    const finalConfig = { ...defaultConfig, ...config };
    const [swipeState, setSwipeState] = useState<SwipeState>({
        startX: 0,
        startY: 0,
        currentX: 0,
        isDragging: false,
        startTime: 0
    });

    const containerRef = useRef<HTMLDivElement>(null);

    const handleStart = useCallback((clientX: number, clientY: number) => {
        try {
            setSwipeState({
                startX: clientX,
                startY: clientY,
                currentX: clientX,
                isDragging: true,
                startTime: Date.now()
            });

            // スワイプ状態をDOMに記録
            if (containerRef.current) {
                containerRef.current.dataset.swiping = 'true';
            }
        } catch (error) {
            console.error('Error in handleStart:', error);
        }
    }, []);

    const handleMove = useCallback((clientX: number, clientY: number) => {
        if (!swipeState.isDragging) return;

        const deltaX = clientX - swipeState.startX;
        const deltaY = Math.abs(clientY - swipeState.startY);

        // 縦スクロールを優先（deltaY > deltaX）
        if (deltaY > Math.abs(deltaX) && deltaY > 10) {
            setSwipeState(prev => ({ ...prev, isDragging: false }));
            return;
        }

        setSwipeState(prev => ({ ...prev, currentX: clientX }));
    }, [swipeState.isDragging, swipeState.startX, swipeState.startY]);

    const handleEnd = useCallback(() => {
        if (!swipeState.isDragging) return;

        try {
            const deltaX = swipeState.currentX - swipeState.startX;
            const deltaTime = Date.now() - swipeState.startTime;
            const velocity = deltaTime > 0 ? Math.abs(deltaX) / deltaTime : 0;

            const isValidSwipe =
                Math.abs(deltaX) >= finalConfig.minDistance &&
                (Math.abs(deltaX) >= finalConfig.threshold || velocity >= finalConfig.velocityThreshold) &&
                deltaTime <= finalConfig.maxTime;

            if (isValidSwipe) {
                if (deltaX > 0) {
                    handlers.onSwipeRight?.();
                } else {
                    handlers.onSwipeLeft?.();
                }
            }
        } catch (error) {
            console.error('Error in handleEnd:', error);
        } finally {
            setSwipeState(prev => ({ ...prev, isDragging: false }));

            // スワイプ状態をクリア
            if (containerRef.current) {
                setTimeout(() => {
                    if (containerRef.current) {
                        containerRef.current.dataset.swiping = 'false';
                    }
                }, 100); // 少し遅延させてクリックイベントとの競合を防ぐ
            }
        }
    }, [swipeState, finalConfig, handlers]);

    // タッチイベントハンドラー
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
    }, [handleStart]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!swipeState.isDragging) return;

        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);

        // 横スワイプの場合はデフォルトの動作を防ぐ
        const deltaX = Math.abs(touch.clientX - swipeState.startX);
        const deltaY = Math.abs(touch.clientY - swipeState.startY);
        if (deltaX > deltaY) {
            e.preventDefault();
        }
    }, [handleMove, swipeState.isDragging, swipeState.startX, swipeState.startY]);

    const handleTouchEnd = useCallback(() => {
        handleEnd();
    }, [handleEnd]);

    // マウスイベントハンドラー
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // 右クリックは無視
        if (e.button !== 0) return;

        handleStart(e.clientX, e.clientY);
        let hasMoved = false;

        // グローバルマウスイベントを追加
        const handleGlobalMouseMove = (e: MouseEvent) => {
            hasMoved = true;
            handleMove(e.clientX, e.clientY);
        };

        const handleGlobalMouseUp = () => {
            // 移動していない場合はスワイプ状態をすぐにクリア
            if (!hasMoved) {
                if (containerRef.current) {
                    containerRef.current.dataset.swiping = 'false';
                }
                setSwipeState(prev => ({ ...prev, isDragging: false }));
            } else {
                handleEnd();
            }
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };

        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
    }, [handleStart, handleMove, handleEnd]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        // この関数は使用しない（グローバルイベントを使用）
    }, []);

    const handleMouseUp = useCallback(() => {
        // この関数は使用しない（グローバルイベントを使用）
    }, []);

    return {
        containerRef,
        swipeState,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp
        }
    };
};