'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
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

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCardsMenu, setShowCardsMenu] = useState(false);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Callout,
      IndentExtension,
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

  if (!editor) {
    return (
      <div className="h-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500">
        Loading Rich Text Editor...
      </div>
    );
  }

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
    </div>
  );
}
