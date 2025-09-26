import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { X, ZoomIn, ZoomOut, Download, ExternalLink, FileText, RotateCw, Home } from 'lucide-react';

interface MobileQuestionViewerProps {
  exam: any;
  isOpen: boolean;
  onClose: () => void;
}

interface TouchState {
  initialDistance?: number;
  initialZoom?: number;
  initialPanX?: number;
  initialPanY?: number;
  initialCenterX?: number;
  initialCenterY?: number;
  lastTouchX?: number;
  lastTouchY?: number;
}

export function MobileQuestionViewer({ exam, isOpen, onClose }: MobileQuestionViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGesturing, setIsGesturing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const touchStateRef = useRef<TouchState>({});

  // Reset view when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setRotation(0);
      touchStateRef.current = {};
    }
  }, [isOpen]);

  // Detect if content is PDF or image
  const isPDF = exam.questionContent?.startsWith('data:application/pdf');
  const isImage = exam.questionContent?.startsWith('data:image') || exam.questionSource === 'file_upload';
  const isDriveLink = exam.questionSource === 'drive_link';

  // Enhanced touch gestures for pinch-to-zoom and pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // Single touch - start dragging
      const touch = e.touches[0];
      setIsDragging(true);
      touchStateRef.current.lastTouchX = touch.clientX;
      touchStateRef.current.lastTouchY = touch.clientY;
      touchStateRef.current.initialPanX = panX;
      touchStateRef.current.initialPanY = panY;
    } else if (e.touches.length === 2) {
      // Two touches - start pinch zoom
      setIsGesturing(true);
      setIsDragging(false);
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      touchStateRef.current = {
        initialDistance: distance,
        initialZoom: zoom,
        initialPanX: panX,
        initialPanY: panY,
        initialCenterX: centerX,
        initialCenterY: centerY
      };
    }
  }, [zoom, panX, panY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
      // Single touch drag
      const touch = e.touches[0];
      const deltaX = touch.clientX - (touchStateRef.current.lastTouchX || 0);
      const deltaY = touch.clientY - (touchStateRef.current.lastTouchY || 0);
      
      // Apply zoom factor to pan sensitivity
      const panSensitivity = Math.max(0.5, Math.min(2, 1 / zoom));
      setPanX(prev => prev + deltaX * panSensitivity);
      setPanY(prev => prev + deltaY * panSensitivity);
      
      touchStateRef.current.lastTouchX = touch.clientX;
      touchStateRef.current.lastTouchY = touch.clientY;
    } else if (e.touches.length === 2 && isGesturing) {
      // Two touch pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const { initialDistance, initialZoom } = touchStateRef.current;
      
      if (initialDistance && initialZoom) {
        const zoomFactor = currentDistance / initialDistance;
        const newZoom = Math.min(Math.max(initialZoom * zoomFactor, 0.25), 5);
        setZoom(newZoom);
      }
    }
  }, [isDragging, isGesturing, zoom]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsGesturing(false);
      setIsDragging(false);
      touchStateRef.current = {};
    } else if (e.touches.length === 1 && isGesturing) {
      // Switch from pinch to drag
      setIsGesturing(false);
      const touch = e.touches[0];
      setIsDragging(true);
      touchStateRef.current.lastTouchX = touch.clientX;
      touchStateRef.current.lastTouchY = touch.clientY;
      touchStateRef.current.initialPanX = panX;
      touchStateRef.current.initialPanY = panY;
    }
  }, [isGesturing, panX, panY]);

  // Enhanced mouse support for desktop
  const [isMouseDown, setIsMouseDown] = useState(false);
  const mouseStateRef = useRef({ lastX: 0, lastY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsMouseDown(true);
      mouseStateRef.current.lastX = e.clientX;
      mouseStateRef.current.lastY = e.clientY;
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMouseDown) {
      const deltaX = e.clientX - mouseStateRef.current.lastX;
      const deltaY = e.clientY - mouseStateRef.current.lastY;
      
      const panSensitivity = Math.max(0.5, Math.min(2, 1 / zoom));
      setPanX(prev => prev + deltaX * panSensitivity);
      setPanY(prev => prev + deltaY * panSensitivity);
      
      mouseStateRef.current.lastX = e.clientX;
      mouseStateRef.current.lastY = e.clientY;
      e.preventDefault();
    }
  }, [isMouseDown, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
  }, []);

  // Mouse wheel zoom for desktop (improved)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.25), 5));
  }, []);

  // Button controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
  };

  // Enhanced download function
  const handleDownload = () => {
    if (exam.questionContent && (isPDF || isImage)) {
      try {
        const link = document.createElement('a');
        link.href = exam.questionContent;
        const extension = isPDF ? 'pdf' : (exam.questionContent.includes('jpeg') ? 'jpg' : 'png');
        const fileName = `${exam.title.replace(/[^a-zA-Z0-9]/g, '_')}_question.${extension}`;
        link.download = fileName;
        
        // Add to document temporarily for iOS Safari compatibility
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        console.log(`Downloaded: ${fileName}`);
      } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Please try right-clicking the image and selecting "Save Image As" or try opening in new tab.');
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (isDriveLink) {
      window.open(exam.questionContent, '_blank');
    } else if (exam.questionContent && (isPDF || isImage)) {
      const newWindow = window.open();
      if (newWindow) {
        if (isPDF) {
          newWindow.document.write(`
            <html>
              <head><title>${exam.title} - Question Paper</title></head>
              <body style="margin:0; height:100vh;">
                <embed src="${exam.questionContent}" type="application/pdf" width="100%" height="100%" />
              </body>
            </html>
          `);
        } else {
          newWindow.document.write(`
            <html>
              <head><title>${exam.title} - Question</title></head>
              <body style="margin:0; background:#000; display:flex; justify-content:center; align-items:center; min-height:100vh;">
                <img src="${exam.questionContent}" style="max-width:100%; max-height:100vh; object-fit:contain;" />
              </body>
            </html>
          `);
        }
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 overflow-hidden">
        <DialogHeader className="p-2 md:p-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xs md:text-lg font-semibold truncate flex items-center gap-2">
              <span className="text-lg">📄</span>
              <span className="hidden md:inline">{exam.title}</span>
              <span className="md:hidden">{exam.title.length > 20 ? `${exam.title.slice(0, 20)}...` : exam.title}</span>
            </DialogTitle>
            <div className="flex items-center gap-1 md:gap-2">
              {/* Enhanced mobile-optimized controls */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
                data-testid="button-zoom-out"
                className="p-1 h-7 w-7 md:h-9 md:w-auto md:px-3 text-xs"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
              <span className="text-[10px] md:text-sm font-mono bg-white px-1 md:px-2 py-1 rounded border min-w-[2.5rem] md:min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 5}
                data-testid="button-zoom-in"
                className="p-1 h-7 w-7 md:h-9 md:w-auto md:px-3 text-xs"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
              {(isImage || isPDF) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  data-testid="button-rotate"
                  className="p-1 h-7 w-7 md:h-9 md:w-auto md:px-3 text-xs"
                  title="Rotate"
                >
                  <RotateCw className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                data-testid="button-reset-view"
                className="p-1 h-7 w-7 md:h-9 md:w-auto md:px-3 text-xs"
                title="Reset View"
              >
                <Home className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
              {(isPDF || isImage) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  data-testid="button-download"
                  className="p-1 h-7 w-7 md:h-9 md:w-auto md:px-3 text-xs bg-green-50 hover:bg-green-100"
                  title="Download"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                data-testid="button-open-new-tab"
                className="p-1 h-7 w-7 md:h-9 md:w-auto md:px-3 text-xs"
                title="Open in New Tab"
              >
                <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
              <DialogClose asChild>
                <Button variant="outline" size="sm" className="p-1 h-7 w-7 md:h-9 md:w-auto md:px-3 text-xs">
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative select-none"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {isDriveLink ? (
            <div className="p-4 md:p-8 text-center h-full flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-sm mx-auto border">
                <div className="text-4xl md:text-6xl mb-4">📎</div>
                <h3 className="text-base md:text-lg font-semibold mb-2 text-gray-800">Google Drive Document</h3>
                <p className="text-sm md:text-base text-gray-600 mb-4">Click below to open the question paper</p>
                <Button 
                  onClick={() => {
                    if (exam.questionContent && exam.questionContent.trim()) {
                      window.open(exam.questionContent, '_blank');
                    } else {
                      console.error('No question content available to open');
                      // Note: This component would need useToast hook imported and used
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base shadow-md"
                >
                  <ExternalLink className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  Open in Drive
                </Button>
              </div>
            </div>
          ) : isPDF ? (
            <div className="h-full flex items-center justify-center p-2">
              <div 
                ref={contentRef}
                className="transition-transform duration-150 ease-out max-w-full max-h-full shadow-2xl"
                style={{
                  transform: `scale(${zoom}) translate(${panX}px, ${panY}px) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
              >
                <div className="bg-white rounded-lg overflow-hidden border-2 border-gray-200">
                  <embed
                    src={exam.questionContent}
                    type="application/pdf"
                    width="100%"
                    height="600"
                    className="min-w-[300px] md:min-w-[500px] pointer-events-none"
                    data-testid="question-pdf"
                  />
                </div>
              </div>
            </div>
          ) : isImage || exam.questionContent?.startsWith('data:image') ? (
            <div className="h-full flex items-center justify-center p-2">
              <div 
                ref={contentRef}
                className="transition-transform duration-150 ease-out shadow-2xl rounded-lg overflow-hidden"
                style={{
                  transform: `scale(${zoom}) translate(${panX}px, ${panY}px) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  cursor: isDragging || isGesturing ? 'grabbing' : 'grab'
                }}
              >
                <img
                  src={exam.questionContent}
                  alt={`${exam.title} - Question Paper`}
                  className="block border-4 border-white rounded-lg bg-white shadow-lg select-none"
                  style={{ 
                    width: 'auto',
                    height: 'auto',
                    maxHeight: zoom <= 1 ? '85vh' : 'none',
                    maxWidth: zoom <= 1 ? '95vw' : 'none',
                    minWidth: '200px',
                    pointerEvents: 'none'
                  }}
                  data-testid="question-image"
                  onLoad={() => console.log('Question image loaded')}
                  onError={(e) => console.error('Failed to load question image:', e)}
                  draggable={false}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-8 text-center h-full flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-sm mx-auto border">
                <div className="text-4xl md:text-6xl mb-4">❌</div>
                <h3 className="text-base md:text-lg font-semibold mb-2 text-gray-800">No Question Content</h3>
                <p className="text-sm md:text-base text-gray-600">No question paper has been uploaded for this exam.</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced mobile-optimized footer */}
        <div className="p-2 md:p-4 border-t bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs md:text-sm text-gray-700">
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <span className="font-medium">📚 <strong>{exam.subject === 'chemistry' ? 'Chemistry' : 'ICT'}</strong></span>
              <span className="font-medium">⏱️ <strong>{exam.duration}min</strong></span>
              <span className="font-medium">📊 <strong>{exam.totalMarks}pts</strong></span>
              <span className="font-medium">{exam.examMode === 'online' ? '📱 Online' : '📝 Offline'}</span>
            </div>
            <div className="text-xs md:text-sm font-medium">
              <span>📅 <strong>{new Date(exam.examDate).toLocaleDateString()}</strong></span>
            </div>
          </div>
          <div className="mt-2 text-[10px] md:text-xs text-gray-500 text-center md:text-left bg-yellow-50 rounded p-1 border">
            💡 <strong>Touch:</strong> Pinch to zoom, drag to pan • <strong>Mouse:</strong> Scroll to zoom, drag to pan
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
