import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Maximize2, 
  Minimize2,
  Move,
  X
} from 'lucide-react';

interface QuestionPaperViewerProps {
  imageUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  examTitle: string;
}

export default function QuestionPaperViewer({ imageUrl, isOpen, onClose, examTitle }: QuestionPaperViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleDownload = useCallback(() => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${examTitle}_question_paper.png`;
      link.click();
    }
  }, [imageUrl, examTitle]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.25, Math.min(5, prev + delta)));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen, handleReset]);

  if (!imageUrl) {
    return null;
  }

  const transformStyle = {
    transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
  };

  const content = (
    <div 
      ref={containerRef}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}
    >
      {/* Toolbar */}
      <div className={`flex items-center justify-between p-4 bg-white border-b ${isFullscreen ? 'fixed top-0 left-0 right-0 z-10' : ''}`}>
        <h3 className="font-semibold text-gray-800 truncate flex-1 mr-4">
          {examTitle} - Question Paper
        </h3>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <span className="text-sm font-mono min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 5}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            Reset
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          
          {isFullscreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Image Container */}
      <div 
        className={`overflow-hidden ${isFullscreen ? 'h-[calc(100vh-80px)] mt-20' : 'h-[600px]'} bg-gray-100 flex items-center justify-center`}
        onWheel={handleWheel}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={`${examTitle} - Question Paper`}
          style={transformStyle}
          className="max-w-none select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          draggable={false}
        />
      </div>

      {/* Help Text */}
      {zoom > 1 && !isFullscreen && (
        <div className="p-2 bg-blue-50 text-blue-700 text-xs text-center flex items-center justify-center gap-2">
          <Move className="w-3 h-3" />
          Click and drag to move the image • Use mouse wheel to zoom
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return content;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Question Paper Viewer</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
