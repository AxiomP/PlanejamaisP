'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RichEditor } from '@/components/ui/rich-editor'

interface EditContentModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onSave: (content: string) => void
  title?: string
}

export function EditContentModal({
  isOpen,
  onClose,
  content,
  onSave,
  title = 'Editar Conteúdo'
}: EditContentModalProps) {
  const [editedContent, setEditedContent] = useState(content)
  const [isSaving, setIsSaving] = useState(false)

  // Reset content when modal opens with new content
  useEffect(() => {
    if (isOpen) {
      setEditedContent(content)
    }
  }, [isOpen, content])

  const handleSave = () => {
    setIsSaving(true)
    // Small delay to show saving state
    setTimeout(() => {
      onSave(editedContent)
      setIsSaving(false)
    }, 300)
  }

  const handleCancel = () => {
    setEditedContent(content) // Reset to original
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Edite o conteúdo gerado antes de exportar. Use a barra de ferramentas para formatar o texto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto my-4">
          <RichEditor
            content={editedContent}
            onChange={setEditedContent}
            placeholder="Edite o conteúdo aqui..."
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
