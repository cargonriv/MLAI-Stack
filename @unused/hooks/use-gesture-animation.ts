import { useEffect, useRef, useState } from 'react';

interface GestureState {
  isPressed: boolean;
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
}

interface GestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  preventScroll?: boolean;
}

export const useGestureAnimation = (options: GestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onLongPress,
    swipeThreshold = 50,
    longPressDelay = 500,
    preventScroll = false
  } = options;

  const [gestureState, setGestureState] = useState<GestureState>({
    isPressed: false,
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    velocity: 0
  });

  const elementRef = useRef<HTMLElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const lastMoveTime = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let startTime = 0;

    const handleStart = (clientX: number, clientY: number) => {
      startTime = Date.now();
      lastMoveTime.current = startTime;
      
      setGestureState(prev => ({
        ...prev,
        isPressed: true,
        isDragging: false,
        startX: clientX,
        startY: clientY,
        currentX: clientX,
        currentY: clientY,
        deltaX: 0,
        deltaY: 0,
        velocity: 0
      }));

      // Start long press timer
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          onLongPress();
        }, longPressDelay);
      }
    };

    const handleMove = (clientX: number, clientY: number) => {
      const currentTime = Date.now();
      const timeDelta = currentTime - lastMoveTime.current;
      lastMoveTime.current = currentTime;

      setGestureState(prev => {
        const deltaX = clientX - prev.startX;
        const deltaY = clientY - prev.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocity = timeDelta > 0 ? distance / timeDelta : 0;

        // Clear long press timer if we start dragging
        if (!prev.isDragging && distance > 10 && longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }

        return {
          ...prev,
          isDragging: distance > 10,
          currentX: clientX,
          currentY: clientY,
          deltaX,
          deltaY,
          velocity
        };
      });
    };

    const handleEnd = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }

      setGestureState(prev => {
        const { deltaX, deltaY, isDragging, velocity } = prev;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Handle swipe gestures
        if (isDragging && velocity > 0.1) {
          if (absX > absY && absX > swipeThreshold) {
            if (deltaX > 0 && onSwipeRight) {
              onSwipeRight();
            } else if (deltaX < 0 && onSwipeLeft) {
              onSwipeLeft();
            }
          } else if (absY > swipeThreshold) {
            if (deltaY > 0 && onSwipeDown) {
              onSwipeDown();
            } else if (deltaY < 0 && onSwipeUp) {
              onSwipeUp();
            }
          }
        } else if (!isDragging && onTap) {
          // Handle tap gesture
          const tapDuration = Date.now() - startTime;
          if (tapDuration < 200) {
            onTap();
          }
        }

        return {
          ...prev,
          isPressed: false,
          isDragging: false,
          deltaX: 0,
          deltaY: 0,
          velocity: 0
        };
      });
    };

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => {
      if (preventScroll) e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gestureState.isPressed) {
        if (preventScroll) e.preventDefault();
        handleMove(e.clientX, e.clientY);
      }
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    // Touch events
    const handleTouchStart = (e: TouchEvent) => {
      if (preventScroll) e.preventDefault();
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventScroll) e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (preventScroll) e.preventDefault();
      handleEnd();
    };

    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventScroll });

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [gestureState.isPressed, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onLongPress, swipeThreshold, longPressDelay, preventScroll]);

  return { elementRef, gestureState };
};