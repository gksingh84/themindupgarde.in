'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { Node, Extension, mergeAttributes } from '@tiptap/core';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Undo,
  Redo,
  Upload,
  Lightbulb,
  Sparkles,
  ChevronDown,
  Table as TableIcon,
  Plus,
  Trash2,
  ArrowUpDown,
  ArrowLeftRight,
  Grid3X3,
  Sliders,
} from 'lucide-react';

// Custom TipTap Callout Node for editorial Tip, Warning, and Key Insight cards
const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'tip',
        parseHTML: (element) => {
          if (element.classList.contains('callout-warning')) return 'warning';
          if (element.classList.contains('callout-key')) return 'key';
          return 'tip';
        },
        renderHTML: (attributes) => {
          return {
            class: `callout callout-${attributes.type || 'tip'}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.callout',
      },
      {
        tag: 'div[class*="callout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },
});

// Custom Indent Extension for paragraphs, headings, blockquotes, and lists
const IndentExtension = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'blockquote'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const dataIndent = element.getAttribute('data-indent');
              if (dataIndent) return parseInt(dataIndent, 10);
              const match = element.style.marginLeft.match(/([\d.]+)rem/);
              return match ? Math.min(Math.round(parseFloat(match[1]) / 1.5), 6) : 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent <= 0) {
                return {};
              }
              return {
                'data-indent': attributes.indent,
                style: `margin-left: ${attributes.indent * 1.5}rem;`,
              };
            },
          },
        },
      },
    ];
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        // 1. If in a list item and can sink to a sub-list (2nd+ item):
        if (this.editor.can().sinkListItem('listItem')) {
          return this.editor.chain().focus().sinkListItem('listItem').run();
        }
        // 2. If in a list on 1st item (can't sink directly, split and nest):
        if (this.editor.isActive('bulletList') || this.editor.isActive('orderedList')) {
          return this.editor.chain().focus().splitListItem('listItem').sinkListItem('listItem').run();
        }
        // 3. Otherwise indent block (paragraph, heading, blockquote):
        const currentIndent =
          this.editor.getAttributes('paragraph').indent ||
          this.editor.getAttributes('heading').indent ||
          this.editor.getAttributes('blockquote').indent ||
          0;
        if (currentIndent < 6) {
          return this.editor
            .chain()
            .focus()
            .updateAttributes('paragraph', { indent: currentIndent + 1 })
            .updateAttributes('heading', { indent: currentIndent + 1 })
            .updateAttributes('blockquote', { indent: currentIndent + 1 })
            .run();
        }
        return false;
      },
      'Shift-Tab': () => {
        // 1. If in a nested list item, lift to parent list:
        if (this.editor.can().liftListItem('listItem')) {
          return this.editor.chain().focus().liftListItem('listItem').run();
        }
        // 2. If in top-level list, lift out to normal paragraph:
        if (this.editor.isActive('orderedList')) {
          return this.editor.chain().focus().toggleOrderedList().run();
        }
        if (this.editor.isActive('bulletList')) {
          return this.editor.chain().focus().toggleBulletList().run();
        }
        // 3. Otherwise decrease block indent:
        const currentIndent =
          this.editor.getAttributes('paragraph').indent ||
          this.editor.getAttributes('heading').indent ||
          this.editor.getAttributes('blockquote').indent ||
          0;
        if (currentIndent > 0) {
          return this.editor
            .chain()
            .focus()
            .updateAttributes('paragraph', { indent: currentIndent - 1 })
            .updateAttributes('heading', { indent: currentIndent - 1 })
            .updateAttributes('blockquote', { indent: currentIndent - 1 })
            .run();
        }
        return false;
      },
    };
  },
});

// Custom TableRow, TableCell, and TableHeader allowing custom inline styles (height, padding, width)
const CustomTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    };
  },
});

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    };
  },
});

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCardsMenu, setShowCardsMenu] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Table Controls State
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHeader, setTableHeader] = useState(true);
  const [showRowHeightMenu, setShowRowHeightMenu] = useState(false);
  const [showColWidthMenu, setShowColWidthMenu] = useState(false);
  const [customRowHeightInput, setCustomRowHeightInput] = useState('44');
  const [customColWidthInput, setCustomColWidthInput] = useState('180');
  const [applyRowToAll, setApplyRowToAll] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Callout,
      IndentExtension,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'editorial-table',
        },
      }),
      CustomTableRow,
      CustomTableHeader,
      CustomTableCell,
      LinkExtension.configure({
        openOnClick: false,
      }),
      ImageExtension.configure({
        inline: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content || '<p>Start writing your high-impact blog article...</p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'min-h-[500px] p-4 sm:p-6 outline-none focus:outline-none ring-0 focus:ring-0 text-slate-900 dark:text-slate-200 border-0 focus:border-0 focus:shadow-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
        setShowImageModal(false);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageModal(false);
    }
  };

  const handleIndent = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editor) return;

    // 1. If inside a list and can sink to a sub-list (2nd+ item):
    if (editor.can().sinkListItem('listItem')) {
      editor.chain().focus().sinkListItem('listItem').run();
      return;
    }

    // 2. If inside a list on 1st item: split and sink to create child item:
    if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
      const splitAndSunk = editor.chain().focus().splitListItem('listItem').sinkListItem('listItem').run();
      if (splitAndSunk) return;
    }

    // 3. Paragraph / Heading / Blockquote Indentation:
    const currentIndent =
      editor.getAttributes('paragraph').indent ||
      editor.getAttributes('heading').indent ||
      editor.getAttributes('blockquote').indent ||
      0;

    if (currentIndent < 6) {
      editor
        .chain()
        .focus()
        .updateAttributes('paragraph', { indent: currentIndent + 1 })
        .updateAttributes('heading', { indent: currentIndent + 1 })
        .updateAttributes('blockquote', { indent: currentIndent + 1 })
        .run();
    }
  };

  const handleOutdent = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editor) return;

    // 1. If inside a nested sub-list (e.g. 'a.' -> '2.'):
    if (editor.can().liftListItem('listItem')) {
      editor.chain().focus().liftListItem('listItem').run();
      return;
    }

    // 2. If inside a top-level list item (e.g. '1.'): lift completely out to normal paragraph:
    if (editor.isActive('orderedList')) {
      editor.chain().focus().toggleOrderedList().run();
      return;
    }
    if (editor.isActive('bulletList')) {
      editor.chain().focus().toggleBulletList().run();
      return;
    }

    // 3. Decrease paragraph / heading / blockquote indent:
    const currentIndent =
      editor.getAttributes('paragraph').indent ||
      editor.getAttributes('heading').indent ||
      editor.getAttributes('blockquote').indent ||
      0;

    if (currentIndent > 0) {
      editor
        .chain()
        .focus()
        .updateAttributes('paragraph', { indent: currentIndent - 1 })
        .updateAttributes('heading', { indent: currentIndent - 1 })
        .updateAttributes('blockquote', { indent: currentIndent - 1 })
        .run();
    }
  };

  const insertTable = (r?: number, c?: number, withHeader = true) => {
    const rows = r ?? Math.max(1, Math.min(tableRows, 50));
    const cols = c ?? Math.max(1, Math.min(tableCols, 20));
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: withHeader })
      .run();
    setShowTableModal(false);
  };

  const applyRowHeight = (heightPx: number, applyToAll = false) => {
    if (!editor) return;
    const h = Math.max(24, Math.min(300, Math.round(heightPx)));
    const paddingY = Math.max(3, Math.min(24, Math.round((h - 20) / 4)));
    const heightStyle = `height: ${h}px; min-height: ${h}px; padding-top: ${paddingY}px; padding-bottom: ${paddingY}px;`;

    const { state, dispatch } = editor.view;
    const { selection } = state;
    let tr = state.tr;

    if (applyToAll) {
      let tablePos = -1;
      let tableNode: any = null;
      for (let d = selection.$from.depth; d > 0; d--) {
        if (selection.$from.node(d).type.name === 'table') {
          tablePos = selection.$from.before(d);
          tableNode = selection.$from.node(d);
          break;
        }
      }
      if (tableNode && tablePos >= 0) {
        let curRowPos = tablePos + 1;
        tableNode.forEach((rowNode: any) => {
          tr = tr.setNodeMarkup(curRowPos, undefined, {
            ...rowNode.attrs,
            style: `height: ${h}px;`,
          });
          let curCellPos = curRowPos + 1;
          rowNode.forEach((cellNode: any) => {
            const curStyle = cellNode.attrs.style || '';
            const cleaned = curStyle
              .replace(/(min-)?height\s*:\s*[^;]+;?/gi, '')
              .replace(/padding-(top|bottom)\s*:\s*[^;]+;?/gi, '')
              .trim();
            const newStyle = cleaned ? `${cleaned} ${heightStyle}` : heightStyle;
            tr = tr.setNodeMarkup(curCellPos, undefined, {
              ...cellNode.attrs,
              style: newStyle,
            });
            curCellPos += cellNode.nodeSize;
          });
          curRowPos += rowNode.nodeSize;
        });
        dispatch(tr);
      }
    } else {
      let rowPos = -1;
      let rowNode: any = null;
      for (let d = selection.$from.depth; d > 0; d--) {
        if (selection.$from.node(d).type.name === 'tableRow') {
          rowPos = selection.$from.before(d);
          rowNode = selection.$from.node(d);
          break;
        }
      }
      if (rowNode && rowPos >= 0) {
        tr = tr.setNodeMarkup(rowPos, undefined, {
          ...rowNode.attrs,
          style: `height: ${h}px;`,
        });
        let curCellPos = rowPos + 1;
        rowNode.forEach((cellNode: any) => {
          const curStyle = cellNode.attrs.style || '';
          const cleaned = curStyle
            .replace(/(min-)?height\s*:\s*[^;]+;?/gi, '')
            .replace(/padding-(top|bottom)\s*:\s*[^;]+;?/gi, '')
            .trim();
          const newStyle = cleaned ? `${cleaned} ${heightStyle}` : heightStyle;
          tr = tr.setNodeMarkup(curCellPos, undefined, {
            ...cellNode.attrs,
            style: newStyle,
          });
          curCellPos += cellNode.nodeSize;
        });
        dispatch(tr);
      } else {
        editor.chain().focus().setCellAttribute('style', heightStyle).run();
      }
    }
  };

  const applyColWidth = (widthPx: number) => {
    if (!editor) return;
    if (widthPx <= 0) {
      editor
        .chain()
        .focus()
        .setCellAttribute('colwidth', null)
        .setCellAttribute('style', '')
        .run();
      return;
    }
    const w = Math.max(30, Math.min(800, Math.round(widthPx)));
    const widthStyle = `width: ${w}px; min-width: ${w}px;`;

    editor
      .chain()
      .focus()
      .setCellAttribute('colwidth', [w])
      .setCellAttribute('style', widthStyle)
      .run();
  };

  const setCellHeightPreset = (preset: 'compact' | 'normal' | 'spacious' | 'tall') => {
    let px = 44;
    if (preset === 'compact') px = 32;
    else if (preset === 'spacious') px = 60;
    else if (preset === 'tall') px = 80;

    setCustomRowHeightInput(String(px));
    applyRowHeight(px, applyRowToAll);
    setShowRowHeightMenu(false);
  };

  const setColumnWidthPreset = (preset: 'auto' | 'compact' | 'medium' | 'wide') => {
    let widthPx = 0;
    if (preset === 'compact') widthPx = 110;
    else if (preset === 'medium') widthPx = 180;
    else if (preset === 'wide') widthPx = 280;

    setCustomColWidthInput(widthPx > 0 ? String(widthPx) : 'auto');
    applyColWidth(widthPx);
    setShowColWidthMenu(false);
  };

  // Interactive mouse drag handler for table row heights
  useEffect(() => {
    if (!editor || !editor.view || !editor.view.dom) return;
    const dom = editor.view.dom;

    let isDraggingRow = false;
    let targetRow: HTMLTableRowElement | null = null;
    let startY = 0;
    let startHeight = 0;
    let activeCell: HTMLElement | null = null;

    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRow && targetRow) {
        const deltaY = e.clientY - startY;
        const newHeight = Math.max(26, Math.round(startHeight + deltaY));
        targetRow.style.height = `${newHeight}px`;
        const cells = targetRow.querySelectorAll('th, td');
        cells.forEach((cell) => {
          (cell as HTMLElement).style.height = `${newHeight}px`;
          (cell as HTMLElement).style.minHeight = `${newHeight}px`;
        });
        return;
      }

      const target = (e.target as HTMLElement)?.closest('td, th') as HTMLElement | null;
      if (!target || !dom.contains(target)) {
        if (activeCell) {
          activeCell.classList.remove('row-resize-active');
          activeCell = null;
        }
        return;
      }

      const rect = target.getBoundingClientRect();
      const isNearBottom = e.clientY >= rect.bottom - 6 && e.clientY <= rect.bottom + 2;

      if (isNearBottom) {
        dom.style.cursor = 'row-resize';
        target.classList.add('row-resize-active');
        activeCell = target;
      } else {
        if (!isDraggingRow) {
          if (dom.style.cursor === 'row-resize') {
            dom.style.cursor = '';
          }
          target.classList.remove('row-resize-active');
          if (activeCell === target) activeCell = null;
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('td, th') as HTMLElement | null;
      if (!target || !dom.contains(target)) return;
      const rect = target.getBoundingClientRect();
      const isNearBottom = e.clientY >= rect.bottom - 6 && e.clientY <= rect.bottom + 2;

      if (isNearBottom) {
        e.preventDefault();
        e.stopPropagation();
        isDraggingRow = true;
        targetRow = target.closest('tr');
        if (targetRow) {
          startY = e.clientY;
          startHeight = targetRow.getBoundingClientRect().height;
          document.body.style.userSelect = 'none';
          document.body.style.cursor = 'row-resize';
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isDraggingRow && targetRow) {
        const deltaY = e.clientY - startY;
        const finalHeight = Math.max(26, Math.round(startHeight + deltaY));
        isDraggingRow = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        dom.style.cursor = '';
        if (activeCell) {
          activeCell.classList.remove('row-resize-active');
          activeCell = null;
        }

        setCustomRowHeightInput(String(finalHeight));
        applyRowHeight(finalHeight, false);
        targetRow = null;
      }
    };

    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      dom.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [editor, applyRowToAll]);

  if (!editor) {
    return (
      <div className="h-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500">
        Loading Rich Text Editor...
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 overflow-hidden shadow-sm flex flex-col h-[650px] sm:h-[720px] max-h-[82vh]">
      {/* Editor Toolbar - Sticky / Fixed at Top */}
      <div className="sticky top-0 z-30 shrink-0 p-2.5 sm:p-3 bg-slate-50/98 dark:bg-navy-950/98 backdrop-blur-md border-b border-slate-200 dark:border-navy-800 flex flex-wrap items-center gap-1 shadow-xs">
        {/* Formatting Controls */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('bold')
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('italic')
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('underline')
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('strike')
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-navy-800 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="H1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="H2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="H3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-navy-800 mx-1" />

        {/* Lists & Sub-numbering */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('bulletList')
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('orderedList')
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="Numbered List (Level 1: 1, 2, 3)"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleIndent}
          className="p-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          title="Indent / Sub-number (Tab) — Indents text or turns number into sub-number (a., b., c.)"
        >
          <Indent className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleOutdent}
          className="p-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          title="Outdent / Promote (Shift+Tab) — Outdents text or moves sub-number back to parent number"
        >
          <Outdent className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-navy-800 mx-1" />

        {/* Editorial Quotes & Cards */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('blockquote')
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="Editorial Pull Quote (Amber Card)"
        >
          <Quote className="w-4 h-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            editor
              .chain()
              .focus()
              .insertContent(
                '<div class="callout callout-tip"><p><strong>Pro Tip:</strong> Enter your actionable recommendation or key advice here...</p></div><p></p>'
              )
              .run();
          }}
          className="p-2 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
          title="Quick Insert: Green Pro Tip Card"
        >
          <Lightbulb className="w-4 h-4" />
        </button>

        {/* Cards & Callouts Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCardsMenu(!showCardsMenu)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              showCardsMenu
                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-400'
                : 'bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
            title="Insert Editorial Cards & Callouts"
          >
            <Sparkles className="w-3.5 h-3.5 text-amberBrand shrink-0" />
            <span>Cards</span>
            <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${showCardsMenu ? 'rotate-180' : ''}`} />
          </button>

          {showCardsMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowCardsMenu(false)}
              />
              <div className="absolute left-0 mt-1.5 w-72 p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-xl z-50 flex flex-col gap-1.5 text-xs animate-in fade-in-50">
                <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-navy-800">
                  Editorial Cards
                </div>

                <button
                  type="button"
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .insertContent(
                        '<div class="callout callout-tip"><p><strong>Pro Tip:</strong> Ensure you purchase a <em>Super Top-Up</em>, NOT a regular <em>Top-Up</em>. A regular top-up evaluates each hospitalization individually against the deductible, whereas a Super Top-Up aggregates all hospitalizations across the entire policy year.</p></div><p></p>'
                      )
                      .run();
                    setShowCardsMenu(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-start gap-2.5 transition-colors cursor-pointer group"
                >
                  <span className="w-3 h-3 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-800 dark:text-emerald-300 group-hover:text-emerald-700">💡 Pro Tip Card (Green)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Mint green box with emerald accent bar</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .insertContent(
                        '<blockquote>"A medical emergency should only test your emotional resilience, never your financial solvency."</blockquote><p></p>'
                      )
                      .run();
                    setShowCardsMenu(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-start gap-2.5 transition-colors cursor-pointer group"
                >
                  <span className="w-3 h-3 rounded-full bg-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-amber-800 dark:text-amber-300 group-hover:text-amber-700">💬 Editorial Quote (Amber)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Serif italic quote with warm amber bar</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .insertContent(
                        '<div class="callout callout-key"><p><strong>Key Insight:</strong> Before finalizing any major financial or career decision, draft a one-page document listing three direct consequences and three indirect cascading feedback loops.</p></div><p></p>'
                      )
                      .run();
                    setShowCardsMenu(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 flex items-start gap-2.5 transition-colors cursor-pointer group"
                >
                  <span className="w-3 h-3 rounded-full bg-navy-800 dark:bg-amberBrand mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-navy-900 dark:text-white group-hover:text-navy-700">🔑 Key Insight Card (Navy)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Deep navy/gold insight framework</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .insertContent(
                        '<div class="callout callout-warning"><p><strong>Warning:</strong> Whenever lending rates rise, instruct your lending institution to increase your monthly EMI amount rather than extending your loan tenure.</p></div><p></p>'
                      )
                      .run();
                    setShowCardsMenu(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/40 flex items-start gap-2.5 transition-colors cursor-pointer group"
                >
                  <span className="w-3 h-3 rounded-full bg-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-orange-800 dark:text-orange-300 group-hover:text-orange-700">⚠️ Warning Box (Amber/Orange)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Cautionary callout for borrower and consumer risks</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('codeBlock')
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-navy-800 mx-1" />

        {/* Links & Media */}
        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('link')
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowImageModal(true)}
          className="p-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          title="Insert Horizontal Line"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Table Button */}
        <button
          type="button"
          onClick={() => setShowTableModal(true)}
          className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            editor.isActive('table')
              ? 'bg-navy-800 text-white dark:bg-amberBrand dark:text-navy-950 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title="Insert Table (Rows, Columns, Resizing)"
        >
          <TableIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-navy-800 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className="p-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className="p-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className="p-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-navy-800 mx-1" />

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Dynamic Table Control Bar (active whenever cursor is inside any table) */}
      {editor.isActive('table') && (
        <div className="bg-amber-50/95 dark:bg-navy-950/95 border-b border-amber-200 dark:border-navy-800 px-3 py-2 flex flex-wrap items-center gap-1.5 text-xs text-navy-800 dark:text-offwhite shadow-xs z-20">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amberBrand uppercase tracking-wider pr-1.5 border-r border-amber-200 dark:border-navy-800 mr-0.5">
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table Tools</span>
          </div>

          {/* Row Management */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="Insert Row Above"
              className="px-2 py-1 rounded text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-emerald-600" />
              <span>Row Above</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Insert Row Below"
              className="px-2 py-1 rounded text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-emerald-600" />
              <span>Row Below</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Delete Current Row"
              className="px-2 py-1 rounded text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Del Row</span>
            </button>

            {/* Row Height Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowRowHeightMenu((p) => !p);
                  setShowColWidthMenu(false);
                }}
                title="Adjust Row Height Manually or with Presets (also drag row bottom borders directly)"
                className="px-2 py-1 rounded text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-1 border-l border-slate-200 dark:border-navy-800 cursor-pointer"
              >
                <ArrowUpDown className="w-3 h-3 text-amberBrand" />
                <span>Row Height</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              {showRowHeightMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowRowHeightMenu(false)} />
                  <div className="absolute left-0 mt-1 w-60 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-xl z-50 p-2.5 space-y-2 animate-in fade-in-50 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-navy-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Row Height (Manual)
                      </span>
                      <span className="text-[10px] text-amberBrand font-semibold">Type or Drag</span>
                    </div>

                    {/* Manual Pixel Stepper */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(24, (parseInt(customRowHeightInput, 10) || 44) - 5);
                            setCustomRowHeightInput(String(next));
                            applyRowHeight(next, applyRowToAll);
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 rounded font-bold text-xs"
                          title="Decrease height by 5px"
                        >
                          -5
                        </button>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={customRowHeightInput}
                            onChange={(e) => setCustomRowHeightInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const num = parseInt(customRowHeightInput, 10);
                                if (!isNaN(num)) applyRowHeight(num, applyRowToAll);
                              }
                            }}
                            className="w-full px-2 py-1 text-xs text-center border border-slate-200 dark:border-navy-700 rounded bg-slate-50 dark:bg-navy-950 font-bold"
                            min="24"
                            max="300"
                          />
                          <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 pointer-events-none">px</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.min(300, (parseInt(customRowHeightInput, 10) || 44) + 5);
                            setCustomRowHeightInput(String(next));
                            applyRowHeight(next, applyRowToAll);
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 rounded font-bold text-xs"
                          title="Increase height by 5px"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const num = parseInt(customRowHeightInput, 10);
                            if (!isNaN(num) && num >= 20) {
                              applyRowHeight(num, applyRowToAll);
                            }
                          }}
                          className="px-2.5 py-1 bg-amberBrand hover:bg-amber-600 text-navy-950 font-bold text-[11px] rounded shadow-xs"
                        >
                          Set
                        </button>
                      </div>

                      <label className="flex items-center gap-1.5 text-[10.5px] text-slate-600 dark:text-slate-400 cursor-pointer pt-0.5">
                        <input
                          type="checkbox"
                          checked={applyRowToAll}
                          onChange={(e) => setApplyRowToAll(e.target.checked)}
                          className="rounded text-amberBrand"
                        />
                        <span>Apply to all rows in table</span>
                      </label>
                    </div>

                    {/* Presets */}
                    <div className="pt-1.5 border-t border-slate-100 dark:border-navy-800 space-y-0.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-0.5">
                        Height Presets
                      </div>
                      {[
                        { label: 'Compact', px: 32 },
                        { label: 'Standard', px: 44 },
                        { label: 'Spacious', px: 60 },
                        { label: 'Tall', px: 80 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setCustomRowHeightInput(String(item.px));
                            applyRowHeight(item.px, applyRowToAll);
                          }}
                          className="w-full text-left px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-navy-800 cursor-pointer flex justify-between items-center text-xs"
                        >
                          <span>{item.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.px}px</span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-navy-800 text-[10px] text-slate-400 italic">
                      💡 Tip: You can also hover &amp; drag any row bottom border directly!
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Column Management */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              title="Insert Column to the Left"
              className="px-2 py-1 rounded text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-blue-600" />
              <span>Col Left</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Insert Column to the Right"
              className="px-2 py-1 rounded text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-blue-600" />
              <span>Col Right</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Delete Current Column"
              className="px-2 py-1 rounded text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Del Col</span>
            </button>

            {/* Column Width Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowColWidthMenu((p) => !p);
                  setShowRowHeightMenu(false);
                }}
                title="Adjust Column Width Manually or with Presets (also drag column borders directly)"
                className="px-2 py-1 rounded text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-1 border-l border-slate-200 dark:border-navy-800 cursor-pointer"
              >
                <ArrowLeftRight className="w-3 h-3 text-blue-600" />
                <span>Col Width</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              {showColWidthMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColWidthMenu(false)} />
                  <div className="absolute left-0 mt-1 w-60 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-xl z-50 p-2.5 space-y-2 animate-in fade-in-50 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-navy-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Column Width (Manual)
                      </span>
                      <span className="text-[10px] text-blue-500 font-semibold">Type or Drag</span>
                    </div>

                    {/* Manual Pixel Stepper */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(40, (parseInt(customColWidthInput, 10) || 160) - 10);
                            setCustomColWidthInput(String(next));
                            applyColWidth(next);
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 rounded font-bold text-xs"
                          title="Decrease width by 10px"
                        >
                          -10
                        </button>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={customColWidthInput}
                            onChange={(e) => setCustomColWidthInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const num = parseInt(customColWidthInput, 10);
                                if (!isNaN(num)) applyColWidth(num);
                              }
                            }}
                            className="w-full px-2 py-1 text-xs text-center border border-slate-200 dark:border-navy-700 rounded bg-slate-50 dark:bg-navy-950 font-bold"
                            min="40"
                            max="800"
                          />
                          <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 pointer-events-none">px</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.min(800, (parseInt(customColWidthInput, 10) || 160) + 10);
                            setCustomColWidthInput(String(next));
                            applyColWidth(next);
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 rounded font-bold text-xs"
                          title="Increase width by 10px"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const num = parseInt(customColWidthInput, 10);
                            if (!isNaN(num) && num >= 40) {
                              applyColWidth(num);
                            }
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded shadow-xs"
                        >
                          Set
                        </button>
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="pt-1.5 border-t border-slate-100 dark:border-navy-800 space-y-0.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-0.5">
                        Width Presets
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomColWidthInput('auto');
                          applyColWidth(0);
                        }}
                        className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer flex justify-between items-center text-xs"
                      >
                        <span>Auto (Equal Fit)</span>
                        <span className="text-[10px] text-slate-400 font-mono">Fit</span>
                      </button>
                      {[
                        { label: 'Narrow', px: 110 },
                        { label: 'Medium', px: 180 },
                        { label: 'Wide', px: 280 },
                        { label: 'Extra Wide', px: 360 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setCustomColWidthInput(String(item.px));
                            applyColWidth(item.px);
                          }}
                          className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer flex justify-between items-center text-xs"
                        >
                          <span>{item.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.px}px</span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-navy-800 text-[10px] text-slate-400 italic">
                      💡 Tip: You can also hover &amp; drag column borders directly!
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Structure / Merging */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              title="Toggle First Row as Header"
              className="px-2 py-1 rounded text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer"
            >
              Header Row
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
              title="Toggle First Column as Header"
              className="px-2 py-1 rounded text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer"
            >
              Header Col
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().mergeOrSplit().run()}
              title="Merge or Split Selected Cells"
              className="px-2 py-1 rounded text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer"
            >
              Merge/Split
            </button>
          </div>

          {/* Delete Table */}
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Delete Entire Table"
            className="ml-auto px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[11px] font-bold hover:bg-rose-100 cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete Table</span>
          </button>
        </div>
      )}

      {/* Editor Content Box - ONLY THIS PART SCROLLS DOWN */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-200 prose dark:prose-invert max-w-none focus:outline-none scrollbar-thin">
        <EditorContent editor={editor} className="min-h-full" />
      </div>

      {/* Image Insert Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Insert Image</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Upload Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white cursor-pointer"
                />
                {uploading && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Uploading image...</p>}
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-2 text-xs text-slate-400 dark:text-slate-500">OR</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addImageUrl}
                disabled={!imageUrl}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 cursor-pointer transition-colors shadow-xs"
              >
                Insert URL
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Table Insertion Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-navy-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amberBrand/15 text-amberBrand flex items-center justify-center shrink-0">
                <TableIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-navy-800 dark:text-offwhite">
                  Insert Table
                </h3>
                <p className="text-[11px] text-charcoal-500 dark:text-slate-400">
                  Configure rows, columns &amp; layout. You can freely resize columns and row heights after inserting!
                </p>
              </div>
            </div>

            {/* Quick Template Presets */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slateBrand dark:text-slate-400 mb-1.5">
                Quick Size Presets
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => insertTable(2, 2, true)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-navy-800 hover:border-amberBrand bg-slate-50 dark:bg-navy-950 text-xs font-semibold text-center hover:bg-amber-50 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                >
                  <Grid3X3 className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                  <span>2 × 2</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertTable(3, 3, true)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-navy-800 hover:border-amberBrand bg-slate-50 dark:bg-navy-950 text-xs font-semibold text-center hover:bg-amber-50 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                >
                  <Grid3X3 className="w-4 h-4 mx-auto mb-1 text-amberBrand" />
                  <span>3 × 3</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertTable(4, 3, true)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-navy-800 hover:border-amberBrand bg-slate-50 dark:bg-navy-950 text-xs font-semibold text-center hover:bg-amber-50 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                >
                  <Grid3X3 className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                  <span>4 × 3</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertTable(5, 4, true)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-navy-800 hover:border-amberBrand bg-slate-50 dark:bg-navy-950 text-xs font-semibold text-center hover:bg-amber-50 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                >
                  <Grid3X3 className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                  <span>5 × 4</span>
                </button>
              </div>
            </div>

            {/* Custom Dimensions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slateBrand dark:text-slate-300 mb-1">
                  Number of Rows
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={tableRows}
                  onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-bold text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBrand dark:text-slate-300 mb-1">
                  Number of Columns
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableCols}
                  onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-bold text-navy-800 dark:text-offwhite focus:outline-none focus:border-amberBrand"
                />
              </div>
            </div>

            {/* Options */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={tableHeader}
                  onChange={(e) => setTableHeader(e.target.checked)}
                  className="rounded border-navy-700 text-amberBrand"
                />
                <span className="font-semibold text-navy-800 dark:text-offwhite">
                  Include Top Header Row (styled with contrast background)
                </span>
              </label>
            </div>

            <div className="p-3 rounded-xl bg-amberBrand/5 border border-amberBrand/20 text-[11px] text-charcoal-600 dark:text-slate-300 space-y-1">
              <div className="font-bold text-amberBrand flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Editing &amp; Resizing Controls:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li><strong>Width:</strong> Hover over column borders and drag to resize column widths interactively.</li>
                <li><strong>Height:</strong> Click inside any cell to use the &ldquo;Row Height&rdquo; menu (Compact, Standard, Spacious, or custom px).</li>
                <li><strong>Rows &amp; Columns:</strong> Add or remove rows/columns above, below, left, or right anytime.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-navy-800">
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => insertTable()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amberBrand text-navy-950 hover:bg-amber-400 cursor-pointer transition-colors shadow-xs"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
