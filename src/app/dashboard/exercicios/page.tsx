'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ListaExerciciosOutput } from '@/lib/gemini'
import { exportListaExerciciosToPDF, exportListaExerciciosToDOCX } from '@/lib/export'
import { EditContentModal } from '@/components/dashboard/edit-content-modal'
import { ImportTemplateModal } from '@/components/dashboard/import-template-modal'
import { ModeSelector, type GenerationMode } from '@/components/dashboard/mode-selector'

const CREDIT_COST = 3

const DISCIPLINAS = [
  'Matemática',
  'Língua Portuguesa',
  'Ciências',
  'História',
  'Geografia',
  'Arte',
  'Educação Física',
  'Inglês',
  'Ensino Religioso',
  'Filosofia',
  'Sociologia',
  'Física',
  'Química',
  'Biologia',
]

const ANOS = [
  '1º ano - Ensino Fundamental',
  '2º ano - Ensino Fundamental',
  '3º ano - Ensino Fundamental',
  '4º ano - Ensino Fundamental',
  '5º ano - Ensino Fundamental',
  '6º ano - Ensino Fundamental',
  '7º ano - Ensino Fundamental',
  '8º ano - Ensino Fundamental',
  '9º ano - Ensino Fundamental',
  '1º ano - Ensino Médio',
  '2º ano - Ensino Médio',
  '3º ano - Ensino Médio',
]

const DIFICULDADES = [
  'Fácil',
  'Médio',
  'Difícil',
  'Progressivo (fácil a difícil)',
]

interface FormData {
  disciplina: string
  ano: string
  tema: string
  quantidade: number
  dificuldade: string
  incluirRespostas: boolean
  incluirDicas: boolean
  contexto: string
}

export default function ListaExerciciosPage() {
  const { dbUser, institution } = useAuth()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<GenerationMode>('personalizado')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ListaExerciciosOutput | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [templateText, setTemplateText] = useState('')
  const [templateFileName, setTemplateFileName] = useState('')
  const [showRespostas, setShowRespostas] = useState(false)
  const [showDicas, setShowDicas] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    disciplina: '',
    ano: '',
    tema: '',
    quantidade: 10,
    dificuldade: '',
    incluirRespostas: true,
    incluirDicas: true,
    contexto: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setShowRespostas(false)
    setShowDicas(false)
    setLoading(true)

    try {
      const response = await fetch('/api/generate/lista-exercicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode, templateDocument: templateText || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar lista de exercícios')
      }

      setResult(data.output as ListaExerciciosOutput)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const creditsAvailable = dbUser?.credits ?? 0
  // TODO: Remover 'true' e usar verificação real em produção
  const canGenerate = true // creditsAvailable >= CREDIT_COST

  const handleExportPDF = async () => {
    if (!result) return
    setExporting(true)
    try {
      await exportListaExerciciosToPDF(result)
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
    } finally {
      setExporting(false)
    }
  }

  const handleExportDOCX = async () => {
    if (!result) return
    setExporting(true)
    try {
      await exportListaExerciciosToDOCX(result)
    } catch (err) {
      console.error('Erro ao exportar DOCX:', err)
    } finally {
      setExporting(false)
    }
  }

  // Converter resultado para HTML editavel
  const convertToEditableHTML = (listaResult: ListaExerciciosOutput): string => {
    let html = `<h2>${listaResult.titulo}</h2>\n`
    html += `<p><em>${listaResult.instrucoes}</em></p>\n\n`

    listaResult.exercicios.forEach((exercicio) => {
      html += `<h3>Exercicio ${exercicio.numero}</h3>\n`
      html += `<p>${exercicio.enunciado}</p>\n`

      if (exercicio.resposta) {
        html += `<p><strong>Resposta:</strong> ${exercicio.resposta}</p>\n`
      }
      if (exercicio.dica) {
        html += `<p><strong>Dica:</strong> ${exercicio.dica}</p>\n`
      }
      html += '\n'
    })

    if (listaResult.respostas && listaResult.respostas.length > 0) {
      html += '<h3>Gabarito</h3>\n<ul>\n'
      listaResult.respostas.forEach((resp) => {
        html += `<li>${resp}</li>\n`
      })
      html += '</ul>\n'
    }

    return html
  }

  const handleOpenEdit = () => {
    if (result) {
      setEditedContent(convertToEditableHTML(result))
      setIsEditModalOpen(true)
    }
  }

  const handleSaveEdit = (newContent: string) => {
    setEditedContent(newContent)
    setIsEditModalOpen(false)
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#2C3E7D]">Lista de Exercícios</h2>
          <p className="mt-2 text-gray-600">
            Crie listas de exercícios variadas para prática e fixação de conteúdo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsImportModalOpen(true)}
          className={`flex shrink-0 items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
            templateFileName
              ? 'border-[#2C3E7D] bg-[#2C3E7D]/10 text-[#2C3E7D]'
              : 'border-gray-300 bg-white text-gray-600 hover:border-[#2C3E7D] hover:text-[#2C3E7D]'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {templateFileName ? `Modelo: ${templateFileName.slice(0, 20)}…` : 'Importar Modelo'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Lista de Exercícios</CardTitle>
              <CardDescription>
                Preencha os campos abaixo para gerar sua lista personalizada
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <ModeSelector
                  mode={mode}
                  onModeChange={setMode}
                  institutionName={institution?.name}
                  disabled={loading}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Disciplina <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.disciplina}
                      onValueChange={(value) => setFormData({ ...formData, disciplina: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {DISCIPLINAS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Ano/Série <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.ano}
                      onValueChange={(value) => setFormData({ ...formData, ano: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {ANOS.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Input
                  label="Tema/Conteúdo"
                  placeholder="Ex: Equações do primeiro grau"
                  value={formData.tema}
                  onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Quantidade de Exercícios <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min={5}
                      max={30}
                      value={formData.quantidade}
                      onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 10 })}
                    />
                    <p className="mt-1 text-sm text-gray-500">Entre 5 e 30 exercícios</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Nível de Dificuldade <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.dificuldade}
                      onValueChange={(value) => setFormData({ ...formData, dificuldade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a dificuldade" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFICULDADES.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Contexto/Finalidade (opcional)
                  </label>
                  <textarea
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-base transition-colors focus:border-[#2C3E7D] focus:outline-none focus:ring-2 focus:ring-[#2C3E7D]/30 focus:ring-offset-1 placeholder:text-gray-400"
                    rows={2}
                    placeholder="Ex: exercícios para reforço de alunos com dificuldade, preparação para prova..."
                    value={formData.contexto}
                    onChange={(e) => setFormData({ ...formData, contexto: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="incluirRespostas"
                      checked={formData.incluirRespostas}
                      onChange={(e) => setFormData({ ...formData, incluirRespostas: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-[#2C3E7D] focus:ring-[#2C3E7D]"
                    />
                    <label htmlFor="incluirRespostas" className="text-sm text-gray-700">
                      Incluir respostas/gabarito
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="incluirDicas"
                      checked={formData.incluirDicas}
                      onChange={(e) => setFormData({ ...formData, incluirDicas: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-[#2C3E7D] focus:ring-[#2C3E7D]"
                    />
                    <label htmlFor="incluirDicas" className="text-sm text-gray-700">
                      Incluir dicas para resolução
                    </label>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={loading}
                  disabled={
                    loading ||
                    !canGenerate ||
                    !formData.disciplina ||
                    !formData.ano ||
                    !formData.tema ||
                    !formData.dificuldade
                  }
                >
                  Gerar Lista ({CREDIT_COST} créditos)
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Esta ferramenta é um suporte ao seu trabalho pedagógico e não substitui sua expertise profissional.
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Seus créditos</p>
                <p className="text-3xl font-bold text-[#2C3E7D]">{creditsAvailable}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Custo desta geração:</span>
                  <span className="font-semibold text-[#2C3E7D]">{CREDIT_COST} créditos</span>
                </div>
              </div>
              {!canGenerate && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">
                    Créditos insuficientes. Adquira mais créditos para continuar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dicas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Use "Progressivo" para listas graduais</li>
                <li>• Descreva o contexto para exercícios mais adequados</li>
                <li>• As dicas ajudam alunos com dificuldade</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resultado */}
      {result && (
        <div className="mt-8">
          <Card variant="bordered">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{result.titulo}</CardTitle>
                  <CardDescription className="mt-2">{result.instrucoes}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEdit}
                  >
                    Editar Conteudo
                  </Button>
                  {formData.incluirRespostas && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRespostas(!showRespostas)}
                    >
                      {showRespostas ? 'Ocultar Respostas' : 'Mostrar Respostas'}
                    </Button>
                  )}
                  {formData.incluirDicas && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDicas(!showDicas)}
                    >
                      {showDicas ? 'Ocultar Dicas' : 'Mostrar Dicas'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Exercícios */}
              <div className="space-y-4">
                {result.exercicios.map((exercicio, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2C3E7D] text-white flex items-center justify-center text-sm font-semibold">
                        {exercicio.numero}
                      </span>
                      <div className="flex-1">
                        <p className="text-gray-800">{exercicio.enunciado}</p>

                        {/* Resposta e Dica (separados) */}
                        {(showRespostas || showDicas) && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                            {showRespostas && formData.incluirRespostas && (
                              <p className="text-sm">
                                <span className="font-medium text-green-600">Resposta: </span>
                                <span className="text-gray-700">{exercicio.resposta}</span>
                              </p>
                            )}
                            {showDicas && formData.incluirDicas && exercicio.dica && (
                              <p className="text-sm">
                                <span className="font-medium text-blue-600">Dica: </span>
                                <span className="text-gray-600">{exercicio.dica}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gabarito Resumido */}
              {formData.incluirRespostas && result.respostas && showRespostas && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-[#2C3E7D] mb-3">Gabarito Resumido</h4>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {result.respostas.map((r, i) => (
                        <span
                          key={i}
                          className="text-sm text-green-700"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t border-gray-200 pt-6">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={exporting}
                >
                  {exporting ? 'Exportando...' : 'Exportar PDF'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportDOCX}
                  disabled={exporting}
                >
                  {exporting ? 'Exportando...' : 'Exportar DOCX'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      <EditContentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        content={editedContent}
        onSave={handleSaveEdit}
        title="Editar Lista de Exercícios"
      />

      <ImportTemplateModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(text, name) => {
          setTemplateText(text)
          setTemplateFileName(name)
        }}
      />
    </div>
  )
}
