import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Check, TextT, Trash, MagnifyingGlassPlus, MagnifyingGlassMinus, ArrowsHorizontal, ArrowsVertical } from 'phosphor-react';

export interface ImageEditorTextOverlay {
  id: string;
  text: string;
  /** 0-100, relative to the crop frame */
  xPct: number;
  yPct: number;
  color: string;
  fontSize: number; // relative to a 600px-wide frame
}

type Orientation = 'landscape' | 'portrait';

interface ImageEditorModalProps {
  src: string;
  /** width / height, e.g. 1 for square, 21/9 for a wide hero banner. Defines the default orientation. */
  aspectRatio: number;
  /** Pixel size of the longer side of the exported image (the shorter side is derived from the ratio) */
  exportWidth?: number;
  title?: string;
  onCancel: () => void;
  onSave: (blob: Blob) => void;
}

const FRAME_MAX_W = 560;
const FRAME_MAX_H = 420;
// Outer modal padding (p-4) + inner content padding (p-5), both sides — the frame must
// never be wider than the viewport minus this, or the whole modal overflows horizontally
// on small screens and its Aplicar/Cancelar buttons end up off-screen (the modal looks
// like it "won't open" on mobile, when it's actually just wider than the phone).
const VIEWPORT_MARGIN = 64;
const TEXT_COLORS = ['#ffffff', '#000000', '#de818d', '#f59e0b', '#22c55e', '#3b82f6'];

let uid = 0;
const nextId = () => `t${Date.now()}_${uid++}`;

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ src, aspectRatio, exportWidth = 1600, title, onCancel, onSave }) => {
  // baseRatio is always expressed as the landscape (>=1) version of the requested ratio
  const baseRatio = Math.max(aspectRatio, 1 / aspectRatio);
  const canToggleOrientation = baseRatio > 1.03;
  const [orientation, setOrientation] = useState<Orientation>(aspectRatio >= 1 ? 'landscape' : 'portrait');
  const effectiveRatio = orientation === 'landscape' ? baseRatio : 1 / baseRatio;

  const [viewportW, setViewportW] = useState<number>(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { frameWidth, frameHeight } = useMemo(() => {
    const maxW = Math.max(200, Math.min(FRAME_MAX_W, viewportW - VIEWPORT_MARGIN));
    const maxH = FRAME_MAX_H;
    if (effectiveRatio >= maxW / maxH) {
      return { frameWidth: maxW, frameHeight: Math.round(maxW / effectiveRatio) };
    }
    return { frameWidth: Math.round(maxH * effectiveRatio), frameHeight: maxH };
  }, [effectiveRatio, viewportW]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const [texts, setTexts] = useState<ImageEditorTextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const textDrag = useRef<{ id: string; startX: number; startY: number; xPct: number; yPct: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; setImgLoaded(true); };
    img.src = src;
  }, [src]);

  // Reset the crop framing whenever the frame's own aspect ratio changes (orientation toggle)
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [frameWidth, frameHeight]);

  const baseScale = useCallback(() => {
    const img = imgRef.current;
    if (!img) return 1;
    return Math.max(frameWidth / img.width, frameHeight / img.height);
  }, [frameWidth, frameHeight]);

  const clampPan = useCallback((panX: number, panY: number, z: number) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };
    const scale = baseScale() * z;
    const dw = img.width * scale;
    const dh = img.height * scale;
    const maxX = Math.max(0, (dw - frameWidth) / 2);
    const maxY = Math.max(0, (dh - frameHeight) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, panX)), y: Math.min(maxY, Math.max(-maxY, panY)) };
  }, [baseScale, frameWidth, frameHeight]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    ctx.clearRect(0, 0, frameWidth, frameHeight);
    const scale = baseScale() * zoom;
    const dw = img.width * scale;
    const dh = img.height * scale;
    const x = frameWidth / 2 - dw / 2 + pan.x;
    const y = frameHeight / 2 - dh / 2 + pan.y;
    ctx.drawImage(img, x, y, dw, dh);
  }, [baseScale, frameWidth, frameHeight, pan, zoom]);

  useEffect(() => { if (imgLoaded) draw(); }, [imgLoaded, draw]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPan(clampPan(dragState.current.panX + dx, dragState.current.panY + dy, zoom));
  };
  const onPointerUp = () => { dragState.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => {
      const nz = Math.min(4, Math.max(1, z - e.deltaY * 0.0015));
      setPan(p => clampPan(p.x, p.y, nz));
      return nz;
    });
  };

  const handleZoomChange = (v: number) => {
    setZoom(v);
    setPan(p => clampPan(p.x, p.y, v));
  };

  const addText = () => {
    const t: ImageEditorTextOverlay = { id: nextId(), text: 'Novo texto', xPct: 50, yPct: 50, color: '#ffffff', fontSize: 32 };
    setTexts(prev => [...prev, t]);
    setSelectedTextId(t.id);
  };

  const updateText = (id: string, patch: Partial<ImageEditorTextOverlay>) => {
    setTexts(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  };

  const removeText = (id: string) => {
    setTexts(prev => prev.filter(t => t.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
  };

  const onTextPointerDown = (e: React.PointerEvent, t: ImageEditorTextOverlay) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setSelectedTextId(t.id);
    textDrag.current = { id: t.id, startX: e.clientX, startY: e.clientY, xPct: t.xPct, yPct: t.yPct };
  };
  const onTextPointerMove = (e: React.PointerEvent) => {
    if (!textDrag.current) return;
    const dx = ((e.clientX - textDrag.current.startX) / frameWidth) * 100;
    const dy = ((e.clientY - textDrag.current.startY) / frameHeight) * 100;
    updateText(textDrag.current.id, {
      xPct: Math.min(100, Math.max(0, textDrag.current.xPct + dx)),
      yPct: Math.min(100, Math.max(0, textDrag.current.yPct + dy)),
    });
  };
  const onTextPointerUp = () => { textDrag.current = null; };

  const selectedText = texts.find(t => t.id === selectedTextId) || null;

  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;
    setSaving(true);
    const longSide = exportWidth;
    const shortSide = Math.round(longSide / baseRatio);
    const outW = orientation === 'landscape' ? longSide : shortSide;
    const outH = orientation === 'landscape' ? shortSide : longSide;
    const out = document.createElement('canvas');
    out.width = outW;
    out.height = outH;
    const ctx = out.getContext('2d');
    if (!ctx) { setSaving(false); return; }
    const ratio = outW / frameWidth;
    const scale = baseScale() * zoom * ratio;
    const dw = img.width * scale;
    const dh = img.height * scale;
    const x = outW / 2 - dw / 2 + pan.x * ratio;
    const y = outH / 2 - dh / 2 + pan.y * ratio;
    ctx.drawImage(img, x, y, dw, dh);

    texts.forEach(t => {
      const px = (t.xPct / 100) * outW;
      const py = (t.yPct / 100) * outH;
      const fontSize = t.fontSize * ratio;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = fontSize * 0.12;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.strokeText(t.text, px, py);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, px, py);
    });

    out.toBlob(blob => {
      setSaving(false);
      if (blob) onSave(blob);
    }, 'image/webp', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-800">{title || 'Editar imagem'}</h3>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="p-5 overflow-y-auto">
          {canToggleOrientation && (
            <div className="flex items-center justify-center gap-1.5 mb-3 bg-gray-100 rounded-lg p-1 w-fit mx-auto">
              <button type="button" onClick={() => setOrientation('landscape')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${orientation === 'landscape' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <ArrowsHorizontal size={14} /> Paisagem
              </button>
              <button type="button" onClick={() => setOrientation('portrait')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${orientation === 'portrait' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <ArrowsVertical size={14} /> Retrato
              </button>
            </div>
          )}

          <div
            className="relative mx-auto rounded-xl overflow-hidden bg-gray-900 select-none touch-none"
            style={{ width: frameWidth, height: frameHeight, cursor: 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
          >
            <canvas ref={canvasRef} width={frameWidth} height={frameHeight} className="absolute inset-0 pointer-events-none" />
            {texts.map(t => (
              <div
                key={t.id}
                onPointerDown={(e) => onTextPointerDown(e, t)}
                onPointerMove={onTextPointerMove}
                onPointerUp={onTextPointerUp}
                onPointerLeave={onTextPointerUp}
                className={`absolute -translate-x-1/2 -translate-y-1/2 px-1 font-bold whitespace-nowrap cursor-move ${selectedTextId === t.id ? 'ring-2 ring-white/80 ring-dashed' : ''}`}
                style={{ left: `${t.xPct}%`, top: `${t.yPct}%`, color: t.color, fontSize: t.fontSize * (frameWidth / exportWidth) || t.fontSize, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
              >
                {t.text}
              </div>
            ))}
          </div>

          {/* Zoom control */}
          <div className="flex items-center gap-2 mt-3 mx-auto" style={{ maxWidth: frameWidth }}>
            <MagnifyingGlassMinus size={16} className="text-gray-400 flex-shrink-0" />
            <input type="range" min={1} max={4} step={0.01} value={zoom}
              onChange={e => handleZoomChange(parseFloat(e.target.value))}
              className="w-full accent-[#de818d]" />
            <MagnifyingGlassPlus size={16} className="text-gray-400 flex-shrink-0" />
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-1">Arraste a imagem para reposicionar. Use o zoom para enquadrar.</p>

          {/* Text tool */}
          <div className="mt-4 mx-auto" style={{ maxWidth: frameWidth }}>
            <button type="button" onClick={addText}
              className="flex items-center gap-1.5 text-sm font-medium text-[#de818d] hover:text-[#c96a76] mb-2">
              <TextT size={16} /> Adicionar texto
            </button>

            {selectedText && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
                <input type="text" value={selectedText.text}
                  onChange={e => updateText(selectedText.id, { text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Texto" />
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {TEXT_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => updateText(selectedText.id, { color: c })}
                        className={`w-6 h-6 rounded-full border-2 ${selectedText.color === c ? 'border-[#de818d]' : 'border-gray-200'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <input type="range" min={14} max={80} value={selectedText.fontSize}
                    onChange={e => updateText(selectedText.id, { fontSize: parseInt(e.target.value) })}
                    className="flex-1 accent-[#de818d]" />
                  <button type="button" onClick={() => removeText(selectedText.id)} className="text-red-400 hover:text-red-600 p-1"><Trash size={16} /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3.5 border-t border-gray-100 flex-shrink-0">
          <button onClick={handleSave} disabled={!imgLoaded || saving}
            className="flex-1 flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
            <Check size={16} /> {saving ? 'Salvando...' : 'Aplicar'}
          </button>
          <button onClick={onCancel} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
