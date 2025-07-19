import React, {useEffect, useState, useRef} from 'react'

interface TypeWriter {
  text: string;
  speed?: number;
}

const TypeWriter: React.FC<TypeWriter> = ({ text, speed = 20 }) => {
    const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current || !text) return;

    const element = elementRef.current;
    let i = 0;
    element.textContent = "";

    const interval: NodeJS.Timeout = setInterval(() => {
      element.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    // Cleanup function
    return () => clearInterval(interval);
  }, [text, speed]);

  return <div ref={elementRef} className="whitespace-pre-wrap text-sm"></div>;
};

export default TypeWriter
