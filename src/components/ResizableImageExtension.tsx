'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ImageExtension from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { mergeAttributes } from '@tiptap/core';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  WrapText,
  Trash2,
  GripVertical,
  Minus,
  Plus,
  Type,
  Maximize2,
} from 'lucide-react';

export type ImageAlignment = 'left' | 'center' | 'right' | 'float-left' | 'float-right';

/**
 * Interactive React NodeView for Resizable and Movable Images
 */
export function ResizableImageComponent({
  node,
  updateAttributes,
  selected,
  deleteNode,
}: NodeViewProps) {
  const {
    src,
    alt = '',
    width = '100%',
    alignment = 'center',
    caption = '',
  } = node.attrs;

  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingWidth, setResizingWidth] = useState<string | null>(null);
  const [showCaptionInput, setShowCaptionInput] = useState(Boolean(caption));
  const [captionValue, setCaptionValue] = useState(caption || '');

  const containerRef = useRef<HTMLDivElement>(null);
  const activePercentRef = useRef<number>(100);

  // Sync caption state if external attribute changes
  useEffect(() => {
    setCaptionValue(caption || '');
  }, [caption]);

  // Parse width string to integer percent (e.g. "50%" -> 50)
  const parsePercent = useCallback((val: string | number): number => {
    if (typeof val === 'number') return Math.min(100, Math.max(15, val));
    const parsed = parseInt(String(val), 10);
    return isNaN(parsed) ? 100 : Math.min(100, Math.max(15, parsed));
  }, []);

  const currentPercent = parsePercent(resizingWidth || width);
  activePercentRef.current = currentPercent;

  // Handle freeform dragging to resize
  const handleResizeStart = (e: React.MouseEvent, handle: 'right' | 'left') => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    const startX = e.clientX;
    const parent = containerRef.current?.parentElement;
    const parentWidth = parent ? parent.clientWidth : 740;
    const startWidthPx = (currentPercent / 100) * parentWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - startX;
      
      let newWidthPx = handle === 'right' ? startWidthPx + dx : startWidthPx - dx;
      if (alignment === 'center') {
        // Expand symmetrically from center
        newWidthPx = startWidthPx + (handle === 'right' ? dx * 2 : -dx * 2);
      }

      const clampedPx = Math.max(120, Math.min(parentWidth, newWidthPx));
      const nextPercent = Math.min(100, Math.max(15, Math.round((clampedPx / parentWidth) * 100)));
      activePercentRef.current = nextPercent;
      setResizingWidth(`${nextPercent}%`);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      updateAttributes({ width: `${activePercentRef.current}%` });
      setResizingWidth(null);

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Preset size setter
  const setPresetSize = (pct: number) => {
    const clamped = Math.min(100, Math.max(15, pct));
    updateAttributes({ width: `${clamped}%` });
  };

  // Step size adjustment
  const stepSize = (delta: number) => {
    const cur = parsePercent(width);
    const next = Math.min(100, Math.max(15, cur + delta));
    updateAttributes({ width: `${next}%` });
  };

  // Set alignment
  const setAlignment = (newAlign: ImageAlignment) => {
    updateAttributes({ alignment: newAlign });
  };

  // Handle caption update
  const handleCaptionBlur = () => {
    updateAttributes({ caption: captionValue.trim() });
  };

  // Determine wrapper container styling based on alignment
  const getWrapperStyle = (): React.CSSProperties => {
    switch (alignment) {
      case 'left':
        return {
          display: 'flex',
          justifyContent: 'flex-start',
          width: '100%',
          margin: '1.5rem 0',
          clear: 'both',
        };
      case 'right':
        return {
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
          margin: '1.5rem 0',
          clear: 'both',
        };
      case 'float-left':
        return {
          float: 'left',
          margin: '0.5rem 1.5rem 1rem 0',
          maxWidth: '65%',
          clear: 'none',
        };
      case 'float-right':
        return {
          float: 'right',
          margin: '0.5rem 0 1rem 1.5rem',
          maxWidth: '65%',
          clear: 'none',
        };
      case 'center':
      default:
        return {
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          margin: '1.5rem auto',
          clear: 'both',
        };
    }
  };

  const showToolbar = isHovered || selected || isResizing;
  const displayWidth = resizingWidth || `${parsePercent(width)}%`;

  return (
    <NodeViewWrapper
      className="resizable-image-wrapper not-prose relative select-none"
      style={getWrapperStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={containerRef}
        className="relative group transition-all duration-150 inline-block max-w-full"
        style={{ width: displayWidth }}
      >
        {/* Floating Action Toolbar on Hover or Selection */}
        {showToolbar && (
          <div
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-2xl rounded-2xl p-1.5 flex items-center gap-1 text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 pointer-events-auto min-w-max backdrop-blur-md"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Move / Drag Handle */}
            <div
              data-drag-handle
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing transition-colors"
              title="Click & drag to move image up/down in the article"
            >
              <GripVertical className="w-4 h-4" />
            </div>

            <div className="w-[1px] h-4 bg-slate-200 dark:bg-navy-700 mx-0.5" />

            {/* Alignment Controls */}
            <button
              type="button"
              onClick={() => setAlignment('left')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                alignment === 'left'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Align Left (Block)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setAlignment('center')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                alignment === 'center'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Align Center (Block)"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setAlignment('right')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                alignment === 'right'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Align Right (Block)"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setAlignment('float-left')}
              className={`px-1.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                alignment === 'float-left'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Wrap Left (Text flows around image on right)"
            >
              <WrapText className="w-3.5 h-3.5" />
              <span>Wrap L</span>
            </button>

            <button
              type="button"
              onClick={() => setAlignment('float-right')}
              className={`px-1.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                alignment === 'float-right'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Wrap Right (Text flows around image on left)"
            >
              <WrapText className="w-3.5 h-3.5 scale-x-[-1]" />
              <span>Wrap R</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-200 dark:bg-navy-700 mx-0.5" />

            {/* Quick Size Presets */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setPresetSize(25)}
                className={`px-1.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  currentPercent <= 30
                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                    : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
                }`}
                title="Small (25%)"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setPresetSize(50)}
                className={`px-1.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  currentPercent > 30 && currentPercent <= 60
                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                    : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
                }`}
                title="Medium (50%)"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setPresetSize(75)}
                className={`px-1.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  currentPercent > 60 && currentPercent <= 85
                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                    : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
                }`}
                title="Large (75%)"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setPresetSize(100)}
                className={`px-1.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  currentPercent > 85
                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                    : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
                }`}
                title="Full Width (100%)"
              >
                100%
              </button>
            </div>

            {/* Fine Size Nudge */}
            <div className="flex items-center gap-0.5 ml-0.5">
              <button
                type="button"
                onClick={() => stepSize(-10)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                title="Shrink by 10%"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1 min-w-[28px] text-center">
                {currentPercent}%
              </span>
              <button
                type="button"
                onClick={() => stepSize(10)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                title="Enlarge by 10%"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="w-[1px] h-4 bg-slate-200 dark:bg-navy-700 mx-0.5" />

            {/* Toggle Caption */}
            <button
              type="button"
              onClick={() => setShowCaptionInput((prev) => !prev)}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                showCaptionInput || caption
                  ? 'bg-amberBrand/20 text-amberBrand'
                  : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Add / Edit Image Caption"
            >
              <Type className="w-3.5 h-3.5" />
            </button>

            {/* Delete Image */}
            <button
              type="button"
              onClick={() => deleteNode()}
              className="p-1.5 hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
              title="Delete Image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* The Image Itself */}
        <div
          className={`relative rounded-xl overflow-visible transition-shadow ${
            selected || isHovered
              ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 shadow-xl'
              : 'shadow-md'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="w-full h-auto block rounded-xl object-contain pointer-events-none select-none"
            draggable={false}
          />

          {/* Real-time Resizing HUD Overlay */}
          {isResizing && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] rounded-xl flex items-center justify-center pointer-events-none z-30">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white font-mono text-xs font-bold shadow-2xl flex items-center gap-1.5 border border-white/20">
                <Maximize2 className="w-3.5 h-3.5 text-amberBrand" />
                <span>Width: {resizingWidth}</span>
              </div>
            </div>
          )}

          {/* Interactive Mouse Drag Handles (Bottom-Right & Bottom-Left) */}
          {(showToolbar || selected) && (
            <>
              {/* Bottom Right Resize Handle */}
              <div
                onMouseDown={(e) => handleResizeStart(e, 'right')}
                className="absolute -bottom-2 -right-2 w-6 h-6 bg-indigo-600 hover:bg-indigo-500 border-2 border-white dark:border-navy-900 rounded-full shadow-lg cursor-nwse-resize flex items-center justify-center transition-transform hover:scale-125 z-30 pointer-events-auto"
                title="Drag to resize image"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full pointer-events-none" />
              </div>

              {/* Bottom Left Resize Handle */}
              <div
                onMouseDown={(e) => handleResizeStart(e, 'left')}
                className="absolute -bottom-2 -left-2 w-6 h-6 bg-indigo-600 hover:bg-indigo-500 border-2 border-white dark:border-navy-900 rounded-full shadow-lg cursor-nesw-resize flex items-center justify-center transition-transform hover:scale-125 z-30 pointer-events-auto"
                title="Drag to resize image"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full pointer-events-none" />
              </div>

              {/* Position indicator badge (top right of image) */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono font-medium backdrop-blur-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                {alignment} • {currentPercent}%
              </div>
            </>
          )}
        </div>

        {/* Caption Field */}
        {(showCaptionInput || caption) && (
          <div className="mt-2 text-center">
            <input
              type="text"
              value={captionValue}
              onChange={(e) => setCaptionValue(e.target.value)}
              onBlur={handleCaptionBlur}
              placeholder="Add an image caption (optional)..."
              className="w-full text-center text-xs text-slate-500 dark:text-slate-400 bg-transparent border-b border-dashed border-slate-300 dark:border-navy-700 hover:border-slate-400 focus:border-indigo-500 focus:outline-hidden py-1 italic transition-colors"
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

/**
 * Custom TipTap Resizable Image Extension with Move, Float, and Resize Controls
 */
export const ResizableImage = ImageExtension.extend({
  name: 'image',
  draggable: true,
  selectable: true,
  inline: false,
  group: 'block',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => {
          return (
            element.getAttribute('data-width') ||
            element.style.width ||
            element.getAttribute('width') ||
            '100%'
          );
        },
        renderHTML: (attributes) => ({
          'data-width': attributes.width,
        }),
      },
      alignment: {
        default: 'center',
        parseHTML: (element) => {
          const dataAlign = element.getAttribute('data-alignment');
          if (dataAlign) return dataAlign;

          const style = element.getAttribute('style') || '';
          const cls = element.getAttribute('class') || '';

          if (
            style.includes('float: left') ||
            style.includes('float:left') ||
            cls.includes('align-float-left') ||
            cls.includes('alignleft')
          ) {
            return 'float-left';
          }
          if (
            style.includes('float: right') ||
            style.includes('float:right') ||
            cls.includes('align-float-right') ||
            cls.includes('alignright')
          ) {
            return 'float-right';
          }
          if (
            (style.includes('margin-left: auto') && style.includes('margin-right: auto')) ||
            cls.includes('align-center') ||
            cls.includes('aligncenter')
          ) {
            return 'center';
          }
          if (style.includes('margin-right: auto') || cls.includes('align-left')) {
            return 'left';
          }
          if (style.includes('margin-left: auto') || cls.includes('align-right')) {
            return 'right';
          }
          return 'center';
        },
        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment,
        }),
      },
      caption: {
        default: '',
        parseHTML: (element) => {
          return (
            element.getAttribute('data-caption') ||
            element.querySelector('figcaption')?.textContent?.trim() ||
            ''
          );
        },
        renderHTML: (attributes) =>
          attributes.caption ? { 'data-caption': attributes.caption } : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure.blog-image-figure',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const img = (element as HTMLElement).querySelector('img');
          if (!img) return false;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            title: img.getAttribute('title') || '',
            width: (element as HTMLElement).getAttribute('data-width') || '100%',
            alignment: (element as HTMLElement).getAttribute('data-alignment') || 'center',
            caption: (element as HTMLElement).querySelector('figcaption')?.textContent?.trim() || '',
          };
        },
      },
      {
        tag: 'figure[data-type="image"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const img = (element as HTMLElement).querySelector('img');
          if (!img) return false;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            title: img.getAttribute('title') || '',
            width: (element as HTMLElement).getAttribute('data-width') || '100%',
            alignment: (element as HTMLElement).getAttribute('data-alignment') || 'center',
            caption: (element as HTMLElement).querySelector('figcaption')?.textContent?.trim() || '',
          };
        },
      },
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const alignment: ImageAlignment = HTMLAttributes.alignment || 'center';
    let width = HTMLAttributes.width || '100%';
    if (typeof width === 'number') width = `${width}%`;
    if (!width.endsWith('%') && !width.endsWith('px')) width = `${width}%`;

    const caption = HTMLAttributes.caption;

    let alignStyle = '';
    if (alignment === 'center') {
      alignStyle = 'display: block; margin-left: auto; margin-right: auto; clear: both;';
    } else if (alignment === 'left') {
      alignStyle = 'display: block; margin-right: auto; margin-left: 0; clear: both;';
    } else if (alignment === 'right') {
      alignStyle = 'display: block; margin-left: auto; margin-right: 0; clear: both;';
    } else if (alignment === 'float-left') {
      alignStyle = 'float: left; margin: 0.5rem 1.5rem 1rem 0; clear: none;';
    } else if (alignment === 'float-right') {
      alignStyle = 'float: right; margin: 0.5rem 0 1rem 1.5rem; clear: none;';
    }

    const inlineStyle = `width: ${width}; max-width: 100%; height: auto; ${alignStyle} ${HTMLAttributes.style || ''}`.trim();

    if (caption) {
      return [
        'figure',
        mergeAttributes({
          style: inlineStyle,
          class: `blog-image-figure align-${alignment} my-6`,
          'data-width': width,
          'data-alignment': alignment,
          'data-caption': caption,
        }),
        [
          'img',
          mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
            style: 'width: 100%; height: auto; display: block;',
            class: 'rounded-xl shadow-md',
          }),
        ],
        [
          'figcaption',
          { class: 'text-center text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium italic' },
          caption,
        ],
      ];
    }

    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: inlineStyle,
        class: `blog-image align-${alignment} rounded-xl shadow-md my-6`,
        'data-width': width,
        'data-alignment': alignment,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
