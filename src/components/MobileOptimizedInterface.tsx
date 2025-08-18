/**
 * Mobile-Optimized Interface Components
 * Touch-friendly interfaces for mobile rating and interaction
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, ThumbsUp, ThumbsDown, MoreHorizontal, X, Check } from 'lucide-react';
import { deviceDetection } from '../utils/deviceDetection';

interface TouchRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showValue?: boolean;
  allowHalf?: boolean;
}

export const TouchRating: React.FC<TouchRatingProps> = ({
  value,
  onChange,
  max = 5,
  size = 'md',
  disabled = false,
  showValue = true,
  allowHalf = false
}) => {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkDevice = async () => {
      const caps = await deviceDetection.getDeviceCapabilities();
      setIsMobile(caps.isMobile);
    };
    checkDevice();
  }, []);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const handleTouch = useCallback((event: React.TouchEvent) => {
    if (disabled || !containerRef.current) return;

    event.preventDefault();
    const touch = event.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const starWidth = rect.width / max;
    let newValue = Math.ceil(x / starWidth);

    if (allowHalf) {
      const halfPoint = (x % starWidth) / starWidth;
      if (halfPoint < 0.5) {
        newValue -= 0.5;
      }
    }

    newValue = Math.max(0.5, Math.min(max, newValue));
    onChange(newValue);
  }, [disabled, max, allowHalf, onChange]);

  const handleClick = useCallback((starIndex: number) => {
    if (disabled) return;
    onChange(starIndex + 1);
  }, [disabled, onChange]);

  const displayValue = hoveredValue !== null ? hoveredValue : value;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        ref={containerRef}
        className={`flex space-x-1 ${isMobile ? 'touch-manipulation' : ''}`}
        onTouchStart={isMobile ? handleTouch : undefined}
        onTouchMove={isMobile ? handleTouch : undefined}
      >
        {Array.from({ length: max }, (_, index) => {
          const starValue = index + 1;
          const isFilled = displayValue >= starValue;
          const isHalfFilled = allowHalf && displayValue >= starValue - 0.5 && displayValue < starValue;

          return (
            <button
              key={index}
              type="button"
              className={`
                ${sizeClasses[size]} 
                transition-all duration-150 
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'}
                ${isMobile ? 'active:scale-95' : ''}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded
              `}
              onClick={() => handleClick(index)}
              onMouseEnter={() => !isMobile && setHoveredValue(starValue)}
              onMouseLeave={() => !isMobile && setHoveredValue(null)}
              disabled={disabled}
              aria-label={`Rate ${starValue} out of ${max} stars`}
            >
              <Star
                className={`
                  w-full h-full transition-colors duration-150
                  ${isFilled ? 'fill-yellow-400 text-yellow-400' : 
                    isHalfFilled ? 'fill-yellow-200 text-yellow-400' : 
                    'fill-gray-200 text-gray-300 hover:text-yellow-400'}
                `}
              />
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {displayValue.toFixed(allowHalf ? 1 : 0)} / {max}
        </div>
      )}
    </div>
  );
};

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  swipeThreshold?: number;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  swipeThreshold = 100,
  className = ''
}) => {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
    setCurrentPos({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!startPos || !isDragging) return;
    
    const touch = event.touches[0];
    setCurrentPos({ x: touch.clientX, y: touch.clientY });
  }, [startPos, isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!startPos || !currentPos || !isDragging) {
      setIsDragging(false);
      return;
    }

    const deltaX = currentPos.x - startPos.x;
    const deltaY = currentPos.y - startPos.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine swipe direction
    if (absDeltaX > absDeltaY && absDeltaX > swipeThreshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else if (absDeltaY > absDeltaX && absDeltaY > swipeThreshold) {
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }

    setStartPos(null);
    setCurrentPos(null);
    setIsDragging(false);
  }, [startPos, currentPos, isDragging, swipeThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const transform = isDragging && startPos && currentPos
    ? `translate(${(currentPos.x - startPos.x) * 0.3}px, ${(currentPos.y - startPos.y) * 0.3}px)`
    : 'translate(0px, 0px)';

  return (
    <div
      ref={cardRef}
      className={`
        touch-manipulation select-none transition-transform duration-200
        ${isDragging ? 'scale-105' : 'scale-100'}
        ${className}
      `}
      style={{ transform }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

interface TouchFeedbackProps {
  type: 'like' | 'dislike' | 'neutral';
  onFeedback: (type: 'like' | 'dislike' | 'neutral') => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  type,
  onFeedback,
  disabled = false,
  size = 'md'
}) => {
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const buttonClasses = `
    ${sizeClasses[size]} 
    rounded-full flex items-center justify-center
    transition-all duration-200 touch-manipulation
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-95'}
  `;

  const handleTouchStart = (buttonType: string) => {
    if (!disabled) {
      setActiveButton(buttonType);
    }
  };

  const handleTouchEnd = () => {
    setActiveButton(null);
  };

  return (
    <div className="flex space-x-4 justify-center">
      <button
        className={`
          ${buttonClasses}
          ${type === 'like' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-green-100'}
          ${activeButton === 'like' ? 'scale-95 bg-green-600' : ''}
          focus:ring-green-500
        `}
        onClick={() => onFeedback('like')}
        onTouchStart={() => handleTouchStart('like')}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
        aria-label="Like"
      >
        <ThumbsUp className="w-5 h-5" />
      </button>

      <button
        className={`
          ${buttonClasses}
          ${type === 'neutral' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-blue-100'}
          ${activeButton === 'neutral' ? 'scale-95 bg-blue-600' : ''}
          focus:ring-blue-500
        `}
        onClick={() => onFeedback('neutral')}
        onTouchStart={() => handleTouchStart('neutral')}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
        aria-label="Neutral"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      <button
        className={`
          ${buttonClasses}
          ${type === 'dislike' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-red-100'}
          ${activeButton === 'dislike' ? 'scale-95 bg-red-600' : ''}
          focus:ring-red-500
        `}
        onClick={() => onFeedback('dislike')}
        onTouchStart={() => handleTouchStart('dislike')}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
        aria-label="Dislike"
      >
        <ThumbsDown className="w-5 h-5" />
      </button>
    </div>
  );
};

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className={`
          absolute inset-0 bg-black transition-opacity duration-200
          ${isAnimating ? 'opacity-50' : 'opacity-0'}
        `}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 
          rounded-t-2xl shadow-2xl transform transition-transform duration-200
          ${isAnimating ? 'translate-y-0' : 'translate-y-full'}
          max-h-[90vh] overflow-hidden
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};

interface TouchSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  label?: string;
}

export const TouchSlider: React.FC<TouchSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = true,
  label
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleTouch = useCallback((event: React.TouchEvent) => {
    if (disabled || !sliderRef.current) return;

    event.preventDefault();
    const touch = event.touches[0];
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    const newValue = min + (max - min) * percentage;
    const steppedValue = Math.round(newValue / step) * step;
    
    onChange(Math.max(min, Math.min(max, steppedValue)));
  }, [disabled, min, max, step, onChange]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          {showValue && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {value}
            </span>
          )}
        </div>
      )}
      
      <div
        ref={sliderRef}
        className={`
          relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer
          touch-manipulation select-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDragging ? 'scale-105' : 'scale-100'}
          transition-transform duration-150
        `}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleTouch(e);
        }}
        onTouchMove={handleTouch}
        onTouchEnd={() => setIsDragging(false)}
      >
        {/* Track */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Thumb */}
        <div
          className={`
            absolute top-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full
            transform -translate-y-1/2 shadow-md transition-all duration-150
            ${isDragging ? 'scale-125' : 'scale-100'}
          `}
          style={{ left: `calc(${percentage}% - 12px)` }}
        />
      </div>
    </div>
  );
};