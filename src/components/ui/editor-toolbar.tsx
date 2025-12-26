'use client'

import type { Editor } from '@tiptap/react'
import { Button } from './button'

interface EditorToolbarProps {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {/* Formatação de texto */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-[#2C3E7D] text-white' : ''}
        title="Negrito"
      >
        <span className="font-bold">B</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-[#2C3E7D] text-white' : ''}
        title="Itálico"
      >
        <span className="italic">I</span>
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      {/* Títulos */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'bg-[#2C3E7D] text-white' : ''}
        title="Título"
      >
        H2
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'bg-[#2C3E7D] text-white' : ''}
        title="Subtítulo"
      >
        H3
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      {/* Listas */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-[#2C3E7D] text-white' : ''}
        title="Lista com marcadores"
      >
        • Lista
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-[#2C3E7D] text-white' : ''}
        title="Lista numerada"
      >
        1. Lista
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      {/* Desfazer/Refazer */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Desfazer"
      >
        ↩
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Refazer"
      >
        ↪
      </Button>
    </div>
  )
}
