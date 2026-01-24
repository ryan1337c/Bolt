import React, { useState, useEffect, useRef, useCallback } from 'react'
import { InlineMath, BlockMath } from 'react-katex';

interface TypeWriter {
  content: string;
  baseSpeed?: number;
  onComplete?: () => void;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  isAutoScrollRef?: React.MutableRefObject<boolean>;
  formatMarkdown: (text: string) => string; // Add this prop
}

// Helper function to parse content into segments
const parseContentSegments = (content: string) => {
  const segments: Array<{type: 'text' | 'math' | 'code', content: string, isBlock?: boolean, language?: string}> = [];
  
  // Combined regex for math and code blocks
  const combinedRegex = /(```[\w]*\n[\s\S]*?```|\\\[[\s\S]*?\\\]|\\\(.*?\\\)|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
  
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      });
    }
    
    const matchedContent = match[0];
    
    // Check if it's a code block
    if (matchedContent.startsWith('```')) {
      const codeMatch = matchedContent.match(/```(\w+)?\n([\s\S]*?)```/);
      segments.push({
        type: 'code',
        content: matchedContent,
        language: codeMatch?.[1] || 'text'
      });
    }
    // Check if it's block math
    else if (matchedContent.startsWith('\\[') || matchedContent.startsWith('$')) {
      segments.push({
        type: 'math',
        content: matchedContent,
        isBlock: true
      });
    }
    // Otherwise it's inline math
    else {
      segments.push({
        type: 'math',
        content: matchedContent,
        isBlock: false
      });
    }
    
    lastIndex = match.index + matchedContent.length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex)
    });
  }

  return segments.length > 0 ? segments : [{type: 'text' as const, content}];
};

const TypeWriter: React.FC<TypeWriter> = ({ 
  content, 
  baseSpeed = 25,
  onComplete,
  className = "",
  containerRef,
  isAutoScrollRef,
  formatMarkdown
}) => {
  const [displayedSegments, setDisplayedSegments] = useState<Array<{type: 'text' | 'math' | 'code', content: string, isBlock?: boolean, language?: string}>>([]);
  const [currentText, setCurrentText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const animationRef = useRef<number | null>(null);
  const segmentIndexRef = useRef<number>(0);
  const charIndexRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const accumulator = useRef<number>(0);
  const segmentsRef = useRef<Array<{type: 'text' | 'math' | 'code', content: string, isBlock?: boolean, language?: string}>>([]);

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

    const currentSegmentIndex = segmentIndexRef.current;
    const currentCharIndex = charIndexRef.current;

    // Check if we're done
    if (currentSegmentIndex >= segmentsRef.current.length) {
      setIsTyping(false);
      onComplete?.();
      return;
    }

    const currentSegment = segmentsRef.current[currentSegmentIndex];

    // Handle math and code segments - show instantly
    if (currentSegment.type === 'math' || currentSegment.type === 'code') {
      // Add completed segment to displayed list
      setDisplayedSegments(prev => [...prev, currentSegment]);
      setCurrentText('');
      
      // Move to next segment
      segmentIndexRef.current = currentSegmentIndex + 1;
      charIndexRef.current = 0;
      
      // Scroll
      requestAnimationFrame(() => {
        if (isAutoScrollRef?.current && containerRef?.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      });
      
      lastFrameTime.current = currentTime;
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    // Handle text segments - type character by character
    if (currentCharIndex >= currentSegment.content.length) {
      // Complete this text segment
      setDisplayedSegments(prev => [...prev, currentSegment]);
      setCurrentText('');
      
      // Move to next segment
      segmentIndexRef.current = currentSegmentIndex + 1;
      charIndexRef.current = 0;
      lastFrameTime.current = currentTime;
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const char = currentSegment.content[currentCharIndex];
    const nextChar = currentSegment.content[currentCharIndex + 1];
    const prevChar = currentSegment.content[currentCharIndex - 1];
    const charSpeed = getCharSpeed(char, nextChar, prevChar);

    if (accumulator.current >= charSpeed) {
      // Add multiple characters if we're behind (catch-up mechanism)
      let charsToAdd = Math.floor(accumulator.current / charSpeed);
      charsToAdd = Math.min(charsToAdd, 3); // Max 3 chars at once for smoothness
      
      const newCharIndex = Math.min(currentCharIndex + charsToAdd, currentSegment.content.length);
      charIndexRef.current = newCharIndex;

      setCurrentText(currentSegment.content.slice(0, newCharIndex));
      accumulator.current = accumulator.current % charSpeed;

      // Scroll only if allowed and containerRef is valid
      requestAnimationFrame(() => {
        if (isAutoScrollRef?.current && containerRef?.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      });
    }

    lastFrameTime.current = currentTime;
    animationRef.current = requestAnimationFrame(animate);
  }, [getCharSpeed, onComplete, containerRef, isAutoScrollRef]);

  // Skip animation handler
  const skipAnimation = useCallback((): void => {
    if (isTyping) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setDisplayedSegments(segmentsRef.current);
      setCurrentText('');
      setIsTyping(false);
      segmentIndexRef.current = segmentsRef.current.length;
      charIndexRef.current = 0;
      onComplete?.();
    }
  }, [isTyping, onComplete]);

  // Start animation
  useEffect(() => {
    if (!content) return;
    
    // Parse content into segments
    segmentsRef.current = parseContentSegments(content);
    
    // Reset state
    setDisplayedSegments([]);
    setCurrentText('');
    setIsTyping(true);
    segmentIndexRef.current = 0;
    charIndexRef.current = 0;
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

  // Render the segments
  const renderSegment = (segment: {type: 'text' | 'math' | 'code', content: string, isBlock?: boolean, language?: string}, index: number) => {
    if (segment.type === 'code') {
      const codeMatch = segment.content.match(/```(\w+)?\n([\s\S]*?)```/);
      const language = codeMatch?.[1] || 'text';
      const code = codeMatch?.[2]?.trim() || '';
      const blockId = `code-${index}-${Date.now()}`;
      
      return (
        <div key={`code-${index}`} className="code-block border border-gray-200 dark:border-none rounded-lg overflow-hidden bg-gray-50 dark:bg-codeBgDark my-2">
          <div className="flex justify-between items-center px-3 py-0.5 border-b border-gray-200 dark:border-slate-600">
            <span className="text-xs text-gray-600 dark:text-textDark font-medium">{language}</span>
            <button className="copy-btn dark:bg-codeBgDark dark:text-textDark hover:bg-[#e5e7eb] dark:hover:bg-white/10" data-block-id={blockId}>
              Copy
            </button>
          </div>
          <div className="overflow-x-auto">
            <pre className="p-4">
              <code id={blockId} className="text-sm font-mono text-gray-800 dark:text-textDark">
                {code}
              </code>
            </pre>
          </div>
        </div>
      );
    }
    
    if (segment.type === 'math') {
      const mathContent = segment.content.replace(/^\\\[|\\\]$|^\\\(|\\\)$|^\$\$|\$\$|^\$|\$/g, '').trim();
      
      if (segment.isBlock) {
        return (
          <div key={`math-block-${index}`} className="my-4">
            <BlockMath math={mathContent} />
          </div>
        );
      } else {
        return (
          <span key={`math-inline-${index}`}>
            <InlineMath math={mathContent} />
          </span>
        );
      }
    } else {
      return (
        <span 
          key={`text-${index}`}
          dangerouslySetInnerHTML={{ __html: formatMarkdown(segment.content) }}
        />
      );
    }
  };

  return (
    <div 
      className={`relative ${className} text-sm`}
      onClick={skipAnimation}
      style={{ cursor: isTyping ? 'pointer' : 'default' }}
      title={isTyping ? "Click to skip animation" : ""}
    >
      <div className="max-w-none prose-sm">
        <div className="whitespace-pre-wrap">
          {/* Render completed segments */}
          {displayedSegments.map((segment, index) => renderSegment(segment, index))}
          
          {/* Render currently typing text */}
          {currentText && (
            <span dangerouslySetInnerHTML={{ __html: formatMarkdown(currentText) }} />
          )}
          
          {/* Animated cursor */}
          {isTyping && (
            <span className="inline-block w-0.5 h-5 bg-blue-500 animate-pulse ml-1 align-text-bottom" />
          )}
        </div>
      </div>
    </div>
  );
};

export default TypeWriter