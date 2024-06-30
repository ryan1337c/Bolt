import React, {useEffect, useState} from 'react'

const TypeWriter: React.FC<{ text: string }> = ({text}) => {
    const [displayText, setDisplayText] = useState<string>('');

    useEffect(() => {
        let currentIndex = 0;

        const typingInterval = setInterval(() => {
            setDisplayText((prevText) => prevText + text[currentIndex]);
            currentIndex++;
            if (currentIndex === text.length - 1) clearInterval(typingInterval);
        }, 50);
        // clean up on unmount or re-render
        return () => clearInterval(typingInterval);
       
    }, [text]);

  return (
    <span>{displayText}</span>
  )
}

export default TypeWriter
