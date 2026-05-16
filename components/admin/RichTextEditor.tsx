'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import Heading from '@tiptap/extension-heading'
import HardBreak from '@tiptap/extension-hard-break'
import Link from '@tiptap/extension-link'
import { useEffect, useRef, useState } from 'react'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const [hasSelection, setHasSelection] = useState(false)
  const [activeBlock, setActiveBlock] = useState('paragraph')
  // Save the last known selection before toolbar interaction
  const savedSelection = useRef<{ from: number; to: number } | null>(null)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        heading: false,
        hardBreak: false,
      }),
      BulletList.configure({ keepMarks: true, keepAttributes: false }),
      OrderedList.configure({ keepMarks: true, keepAttributes: false }),
      Heading.configure({ levels: [2, 3] }),
      HardBreak,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'rte-link',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: { class: 'rich-text-editor' },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      syncActiveBlock(editor)
    },
    onSelectionUpdate: ({ editor }) => {
      setHasSelection(!editor.state.selection.empty)
      syncActiveBlock(editor)
      // Save selection whenever it changes inside the editor
      savedSelection.current = {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      }
    },
    onBlur: ({ editor }) => {
      // Capture selection the moment editor loses focus
      savedSelection.current = {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      }
    },
  })

  function syncActiveBlock(ed: typeof editor) {
    if (!ed) return
    if (ed.isActive('heading', { level: 2 })) setActiveBlock('h2')
    else if (ed.isActive('heading', { level: 3 })) setActiveBlock('h3')
    else if (ed.isActive('bulletList')) setActiveBlock('bulletList')
    else if (ed.isActive('orderedList')) setActiveBlock('orderedList')
    else setActiveBlock('paragraph')
  }

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) return null

  function applyBlockType(type: string) {
    if (!editor) return

    // Restore the saved selection before applying the command
    if (savedSelection.current) {
      editor
        .chain()
        .setTextSelection({
          from: savedSelection.current.from,
          to: savedSelection.current.to,
        })
        .run()
    }

    switch (type) {
      case 'h2':
        editor.chain().focus().setHeading({ level: 2 }).run()
        break
      case 'h3':
        editor.chain().focus().setHeading({ level: 3 }).run()
        break
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run()
        break
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run()
        break
      default:
        editor.chain().focus().setParagraph().run()
    }

    setActiveBlock(type)
  }

  function applyLink() {
    if (!editor) return
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run()
      setShowLinkInput(false)
      return
    }
    const url = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`
    if (savedSelection.current) {
      editor.chain().setTextSelection({
        from: savedSelection.current.from,
        to: savedSelection.current.to,
      }).run()
    }
    editor.chain().focus().setLink({ href: url }).run()
    setShowLinkInput(false)
    setLinkUrl('')
  }

  function removeLink() {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
    setShowLinkInput(false)
    setLinkUrl('')
  }

  const markBtnStyle = (active: boolean) => ({
    padding: '4px 8px',
    borderRadius: 6,
    border: `1px solid ${active ? '#6D28D9' : '#1C1730'}`,
    background: active ? 'rgba(109,40,217,0.2)' : 'transparent',
    color: active ? '#A78BFA' : '#8B7EC8',
    cursor: 'pointer',
    fontFamily: 'Switzer, sans-serif',
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
  })

  return (
    <div style={{ border: '1px solid #1C1730', borderRadius: 8, background: '#0D0B14', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 flex-wrap p-2"
        style={{ borderBottom: '1px solid #1C1730', background: '#13101E' }}
      >
        {/* Block type dropdown */}
        <select
          value={activeBlock}
          onChange={(e) => applyBlockType(e.target.value)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid #1C1730',
            background: '#0D0B14',
            color: '#A78BFA',
            fontFamily: 'Switzer, sans-serif',
            fontSize: 12,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="paragraph">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="bulletList">Bullet list</option>
          <option value="orderedList">Numbered list</option>
        </select>

        <div style={{ width: 1, height: 18, background: '#1C1730', flexShrink: 0 }} />

        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            if (!hasSelection) return
            editor.chain().focus().toggleBold().run()
          }}
          style={markBtnStyle(editor.isActive('bold'))}
          title={hasSelection ? 'Bold' : 'Select text to apply bold'}
        >
          <strong>B</strong>
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            if (!hasSelection) return
            editor.chain().focus().toggleItalic().run()
          }}
          style={markBtnStyle(editor.isActive('italic'))}
          title={hasSelection ? 'Italic' : 'Select text to apply italic'}
        >
          <em>I</em>
        </button>

        <div style={{ width: 1, height: 18, background: '#1C1730', flexShrink: 0 }} />

        {/* Link button */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            if (!hasSelection && !editor.isActive('link')) return
            setShowLinkInput(prev => !prev)
            if (editor.isActive('link')) {
              setLinkUrl(editor.getAttributes('link').href ?? '')
            }
          }}
          style={markBtnStyle(editor.isActive('link'))}
          title={hasSelection || editor.isActive('link') ? 'Add or edit link' : 'Select text to add link'}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 6.5a2.5 2.5 0 0 0 3.536 0l1.5-1.5a2.5 2.5 0 0 0-3.536-3.536L5.5 2.5" />
            <path d="M7 5.5a2.5 2.5 0 0 0-3.536 0L2 7a2.5 2.5 0 0 0 3.536 3.536L6.5 9.5" />
          </svg>
        </button>
      </div>

      {/* Link input bar */}
      {showLinkInput && (
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ borderBottom: '1px solid #1C1730', background: '#0F0D1A' }}
        >
          <input
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink() }
              if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl('') }
            }}
            autoFocus
            style={{
              flex: 1,
              padding: '5px 10px',
              background: '#0D0B14',
              border: '1px solid #1C1730',
              borderRadius: 6,
              color: '#E8E6F0',
              fontFamily: 'Switzer, sans-serif',
              fontSize: 12,
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
            onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
          />
          <button
            type="button"
            onClick={applyLink}
            style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'rgba(109,40,217,0.2)', color: '#A78BFA', fontFamily: 'Switzer, sans-serif', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Apply
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={removeLink}
              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #1C1730', background: 'transparent', color: '#8B7EC8', fontFamily: 'Switzer, sans-serif', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={() => { setShowLinkInput(false); setLinkUrl('') }}
            style={{ color: '#6B5FA0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Editor area */}
      <div style={{ minHeight: 140, padding: '10px 14px', position: 'relative' }}>
        {editor.isEmpty && placeholder && (
          <p style={{
            position: 'absolute',
            top: 10,
            left: 14,
            pointerEvents: 'none',
            fontFamily: 'Switzer, sans-serif',
            fontSize: 13,
            color: '#2D2450',
            margin: 0,
            userSelect: 'none',
          }}>
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .rich-text-editor {
          outline: none;
          font-family: Switzer, sans-serif;
          font-size: 13px;
          color: #E8E6F0;
          line-height: 1.7;
          min-height: 120px;
        }
        .rich-text-editor p { margin: 0 0 8px; }
        .rich-text-editor h2 {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #E8E6F0;
          margin: 14px 0 6px;
          line-height: 1.3;
        }
        .rich-text-editor h3 {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #C4B5FD;
          margin: 10px 0 4px;
          line-height: 1.3;
        }
        .rich-text-editor ul { padding-left: 20px; margin: 6px 0; }
        .rich-text-editor ol { padding-left: 20px; margin: 6px 0; }
        .rich-text-editor li { margin-bottom: 4px; color: #E8E6F0; }
        .rich-text-editor strong { color: #E8E6F0; font-weight: 600; }
        .rich-text-editor em { color: #C4B5FD; }
        .rich-text-editor a, .rte-link {
          color: #A78BFA;
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
        }
        .rich-text-editor a:hover, .rte-link:hover { color: #C4B5FD; }
        .ProseMirror { outline: none; }
      `}</style>
    </div>
  )
}