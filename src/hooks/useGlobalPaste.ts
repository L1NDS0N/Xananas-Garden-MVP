import { useEffect } from 'react';

/**
 * While `active`, listens for Ctrl+V/Cmd+V anywhere in the document and forwards
 * any pasted image files to `onImages` — so pasting works no matter what inside
 * an open modal happens to have focus, not just a specific dropzone.
 * Pasting text (no image data) is left alone so text inputs keep working normally.
 */
export function useGlobalPaste(active: boolean, onImages: (files: File[]) => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      Array.from(items).forEach(item => {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      });
      if (files.length > 0) {
        e.preventDefault();
        onImages(files);
      }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [active, onImages]);
}
