import React, { useEffect, useRef } from 'react';

// Declare MathJax on window object
declare global {
  interface Window {
    MathJax?: {
      typesetPromise: (elements?: Element[]) => Promise<void>;
    };
    renderMathJax?: () => void;
  }
}

interface MathRendererProps {
  children: string;
  className?: string;
}

export function MathRenderer({ children, className = '' }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Render MathJax if available
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
          console.log('MathJax rendering error:', err.message);
        });
      }
    }
  }, [children]);

  // Enhanced Bengali text processing
  const processBengaliMath = (text: string) => {
    // Convert English numbers to Bengali where appropriate
    const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    
    // Process mathematical expressions while preserving Bengali text
    let processedText = text
      // Preserve fractions in math context
      .replace(/(\d+)\/(\d+)/g, '<span class="math-fraction">$1/$2</span>')
      // Preserve exponents
      .replace(/(\w+)\^(\d+)/g, '$1<sup>$2</sup>')
      // Mathematical symbols
      .replace(/>==/g, '≥')
      .replace(/<=/g, '≤')
      .replace(/!=/g, '≠')
      .replace(/\*\*/g, '×')
      .replace(/\+-/g, '±');
      
    return processedText;
  };

  const processedContent = processBengaliMath(children);

  return (
    <div 
      ref={containerRef}
      className={`question-content ${className}`}
      style={{
        fontFamily: '"Noto Sans Bengali", "SolaimanLipi", "Kalpurush", "Nikosh", Arial, sans-serif',
        lineHeight: '1.7',
        fontSize: '1rem'
      }}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}

// Helper component for inline math rendering
export function InlineMath({ children, className = '' }: MathRendererProps) {
  return <MathRenderer children={children} className={`inline ${className}`} />;
}

// Helper component for display math rendering
export function DisplayMath({ children, className = '' }: MathRendererProps) {
  return <MathRenderer children={children} className={`block text-center ${className}`} />;
}
