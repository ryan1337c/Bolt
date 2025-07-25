import { useState, useEffect, useRef, useCallback } from 'react';

const useAutoScroll = (containerRef: React.RefObject<HTMLDivElement>) => {
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingProgrammatically = useRef(false);

  const isAtBottom = useCallback((): boolean => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight <= 50;
  }, [containerRef]);

  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (!containerRef.current) return;
    isScrollingProgrammatically.current = true;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant'
    });
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 100);
  }, [containerRef]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isScrollingProgrammatically.current) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsAutoScrollEnabled(isAtBottom());
    }, 100);
  }, [isAtBottom]);

  const triggerAutoScroll = useCallback(() => {
    if (isAutoScrollEnabled) {
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
    }
  }, [isAutoScrollEnabled, scrollToBottom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  return {
    isAutoScrollEnabled,
    triggerAutoScroll
  };
};

export default useAutoScroll;
