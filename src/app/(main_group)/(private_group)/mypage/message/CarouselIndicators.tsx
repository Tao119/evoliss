import React from 'react';

interface CarouselIndicatorsProps {
    total: number;
    current: number;
    onDotClick: (index: number) => void;
    show: boolean;
}

export const CarouselIndicators: React.FC<CarouselIndicatorsProps> = ({
    total,
    current,
    onDotClick,
    show
}) => {
    if (!show || total <= 1) {
        return null;
    }

    return (
        <div className="p-message__carousel-indicators">
            {Array.from({ length: total }, (_, index) => (
                <button
                    key={index}
                    className={`p-message__carousel-dot ${index === current ? '-active' : ''
                        }`}
                    onClick={() => onDotClick(index)}
                    aria-label={`講座 ${index + 1} を表示`}
                    type="button"
                />
            ))}
        </div>
    );
};