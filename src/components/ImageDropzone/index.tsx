import React, { useState, useCallback, useRef } from 'react';

interface ImageDropzoneProps {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}

/**
 * Wraps a click-to-select dropzone with drag&drop and clipboard-paste support.
 * Paste only triggers while the zone (or something inside it) has focus/hover,
 * so pasting elsewhere on the page (e.g. a text field) is unaffected.
 */
const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onFiles, multiple = true, className = '', activeClassName = '', children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const extractImageFiles = (list: FileList | DataTransferItemList | null): File[] => {
    if (!list) return [];
    const files: File[] = [];
    Array.from(list as any).forEach((item: any) => {
      const file = item instanceof File ? item : (typeof item.getAsFile === 'function' ? item.getAsFile() : null);
      if (file && file.type.startsWith('image/')) files.push(file);
    });
    return multiple ? files : files.slice(0, 1);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = extractImageFiles(e.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  }, [onFiles, multiple]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current += 1;
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const files = extractImageFiles(e.clipboardData?.items || null);
    if (files.length > 0) { e.preventDefault(); onFiles(files); }
  }, [onFiles, multiple]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onPaste={handlePaste}
      tabIndex={0}
      className={`${className} ${isDragging ? activeClassName : ''} outline-none`}
    >
      {children}
    </div>
  );
};

export default ImageDropzone;
