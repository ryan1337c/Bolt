import React, { useState, useEffect, useRef, useCallback } from 'react'

interface TypeWriter {
  content: string;
  baseSpeed?: number;
  onComplete?: () => void;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  isAutoScrollRef?: React.MutableRefObject<boolean>;
}

const TypeWriter: React.FC<TypeWriter> = ({ content, 
  baseSpeed = 25,
  onComplete,
  className = "",
  containerRef,
  isAutoScrollRef}) => {
   const [displayedContent, setDisplayedContent] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const animationRef = useRef<number | null>(null);
  const indexRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const accumulator = useRef<number>(0);

  // Memoized speed calculation
  const getCharSpeed = useCallback((char: string, nextChar?: string, prevChar?: string): number => {
    // Fast through markdown syntax
    if (['*', '_', '#', '`', '[', ']', '(', ')', '{', '}'].includes(char)) {
      return baseSpeed * 0.2;
    }
    
    // Burst through code blocks
    if (prevChar === '`' && char !== '`') {
      return baseSpeed * 0.3;
    }
    
    // Slower after sentence endings
    if (['.', '!', '?'].includes(char)) {
      return baseSpeed * 2.5;
    }
    
    // Pause at newlines
    if (char === '\n') {
      return baseSpeed * 1.8;
    }
    
    // Slightly faster for spaces
    if (char === ' ') {
      return baseSpeed * 0.8;
    }
    
    // Random variation for natural feel (±20%)
    return baseSpeed * (0.8 + Math.random() * 0.4);
  }, [baseSpeed]);

  // Optimized animation loop using RAF
  const animate = useCallback((currentTime: number): void => {
    if (lastFrameTime.current === 0) {
      lastFrameTime.current = currentTime;
    }

    const deltaTime = currentTime - lastFrameTime.current;
    accumulator.current += deltaTime;

    const currentIndex = indexRef.current;
    
    if (currentIndex >= content.length) {
      setIsTyping(false);
      onComplete?.();
      return;
    }

    const char = content[currentIndex];
    const nextChar = content[currentIndex + 1];
    const prevChar = content[currentIndex - 1];
    const charSpeed = getCharSpeed(char, nextChar, prevChar);

    if (accumulator.current >= charSpeed) {
      // Add multiple characters if we're behind (catch-up mechanism)
      let charsToAdd = Math.floor(accumulator.current / charSpeed);
      charsToAdd = Math.min(charsToAdd, 3); // Max 3 chars at once for smoothness
      
      const newIndex = Math.min(currentIndex + charsToAdd, content.length);
      indexRef.current = newIndex;

      const partial = content.slice(0, newIndex);
      setDisplayedContent(partial.replace(/\n/g, '<br/>'));
      accumulator.current = accumulator.current % charSpeed;

      // Scroll only if allowed and containerRef is valid
      requestAnimationFrame(() => {
        if (isAutoScrollRef?.current && containerRef?.current) {
          containerRef.current.offsetHeight; // trigger reflow
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
          console.log("Auto Scrolling Enabled");
        } else {
          console.log("Auto Scrolling Disabled");
        }
      });

    }

    lastFrameTime.current = currentTime;
    animationRef.current = requestAnimationFrame(animate);
  }, [content, getCharSpeed, onComplete]);

  // Skip animation handler
  const skipAnimation = useCallback((): void => {
    if (isTyping) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setDisplayedContent(content);
      setIsTyping(false);
      indexRef.current = content.length;
      onComplete?.();
    }
  }, [isTyping, content, onComplete]);

  // Start animation
  useEffect(() => {
    if (!content) return;
    
    // Reset state
    setDisplayedContent('');
    setIsTyping(true);
    indexRef.current = 0;
    lastFrameTime.current = 0;
    accumulator.current = 0;

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [content, animate]);

  return (
    <div 
      className={`relative ${className} text-sm`}
      onClick={skipAnimation}
      style={{ cursor: isTyping ? 'pointer' : 'default' }}
      title={isTyping ? "Click to skip animation" : ""}
    >
      <div className="max-w-none prose-sm">
        <div 
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: displayedContent
          }}
        />
      </div>
      
      {/* Animated cursor */}
      {isTyping && (
        <span className="inline-block w-0.5 h-5 bg-blue-500 animate-pulse ml-1 align-text-bottom" />
      )}
    </div>
  );
};

export default TypeWriter
