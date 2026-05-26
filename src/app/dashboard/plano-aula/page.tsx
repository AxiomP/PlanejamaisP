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
import type { PlanoAulaOutput } from '@/lib/gemini'
import { exportPlanoAulaToPDF, exportPlanoAulaToDOCX } from '@/lib/export'
import { EditContentModal } from '@/components/dashboard/edit-content-modal'
import { ImportTemplateModal } from '@/components/dashboard/import-template-modal'
import { ModeSelector, type GenerationMode } from '@/components/dashboard/mode-selector'

const CREDIT_COST = 5

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

const DURACOES = [
  '1 aula (50 minutos)',
  '2 aulas (100 minutos)',
  '3 aulas (150 minutos)',
  '4 aulas ou mais',
]

interface FormData {
  disciplina: string
  ano: string
  tema: string
  duracao: string
  objetivos: string
  codigoBncc: string
}

export default function PlanoAulaPage() {
  const { dbUser, institution } = useAuth()
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PlanoAulaOutput | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [templateText, setTemplateText] = useState('')
  const [templateFileName, setTemplateFileName] = useState('')
  const [mode, setMode] = useState<GenerationMode>('personalizado')
  const [formData, setFormData] = useState<FormData>({
    disciplina: '',
    ano: '',
    tema: '',
    duracao: '',
    objetivos: '',
    codigoBncc: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    try {
      const response = await fetch('/api/generate/plano-aula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode, templateDocument: templateText || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar plano de aula')
      }

      setResult(data.output as PlanoAulaOutput)
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
      await exportPlanoAulaToPDF(result)
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
      await exportPlanoAulaToDOCX(result)
    } catch (err) {
      console.error('Erro ao exportar DOCX:', err)
    } finally {
      setExporting(false)
    }
  }

  const convertToEditableHTML = (plano: PlanoAulaOutput): string => {
    let html = `<h1>${plano.titulo}</h1>`
    html += `<p><strong>Duração:</strong> ${plano.duracao}</p>`

    html += `<h2>Objetivos de Aprendizagem</h2><ul>`
    plano.objetivos.forEach(obj => {
      html += `<li>${obj}</li>`
    })
    html += `</ul>`

    html += `<h2>Competências BNCC</h2><ul>`
    plano.competencias_bncc.forEach(comp => {
      html += `<li>${comp}</li>`
    })
    html += `</ul>`

    html += `<h2>Metodologia</h2>`
    html += `<p>${plano.metodologia}</p>`

    html += `<h2>Desenvolvimento da Aula</h2>`
    plano.desenvolvimento.forEach(etapa => {
      html += `<h3>${etapa.etapa} (${etapa.duracao})</h3>`
      html += `<p>${etapa.descricao}</p>`
    })

    html += `<h2>Recursos</h2><ul>`
    plano.recursos.forEach(rec => {
      html += `<li>${rec}</li>`
    })
    html += `</ul>`

    html += `<h2>Avaliação</h2>`
    html += `<p>${plano.avaliacao}</p>`

    html += `<h2>Referências</h2><ul>`
    plano.referencias.forEach(ref => {
      html += `<li>${ref}</li>`
    })
    html += `</ul>`

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
          <h2 className="text-3xl font-bold text-[#2C3E7D]">Plano de Aula</h2>
          <p className="mt-2 text-gray-600">
            Crie planos de aula completos alinhados à BNCC com objetivos, metodologias e avaliação.
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
              <CardTitle>Configurar Plano de Aula</CardTitle>
              <CardDescription>
                Preencha os campos abaixo para gerar seu plano de aula personalizado
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
                  placeholder="Ex: Frações e números decimais"
                  value={formData.tema}
                  onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                  required
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Duração <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.duracao}
                    onValueChange={(value) => setFormData({ ...formData, duracao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a duração" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURACOES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Objetivos Específicos (opcional)
                  </label>
                  <textarea
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-base transition-colors focus:border-[#2C3E7D] focus:outline-none focus:ring-2 focus:ring-[#2C3E7D]/30 focus:ring-offset-1 placeholder:text-gray-400"
                    rows={3}
                    placeholder="Descreva objetivos específicos que deseja incluir..."
                    value={formData.objetivos}
                    onChange={(e) => setFormData({ ...formData, objetivos: e.target.value })}
                  />
                </div>

                <Input
                  label="Código BNCC (opcional)"
                  placeholder="Ex: EF06MA01"
                  value={formData.codigoBncc}
                  onChange={(e) => setFormData({ ...formData, codigoBncc: e.target.value })}
                  hint="Informe um código BNCC específico para alinhar o plano"
                />
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={loading}
                  disabled={loading || !canGenerate || !formData.disciplina || !formData.ano || !formData.tema || !formData.duracao}
                >
                  Gerar Plano de Aula ({CREDIT_COST} créditos)
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
                <li>• Seja específico no tema para melhores resultados</li>
                <li>• Informe o código BNCC para maior alinhamento</li>
                <li>• Use os objetivos específicos para personalizar</li>
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
                <CardTitle className="text-2xl">{result.titulo}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEdit}
                >
                  Editar Conteúdo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Objetivos */}
              <section>
                <h4 className="font-semibold text-[#2C3E7D] mb-2">Objetivos de Aprendizagem</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {result.objetivos.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </section>

              {/* Competências BNCC */}
              <section>
                <h4 className="font-semibold text-[#2C3E7D] mb-2">Competências BNCC</h4>
                <div className="flex flex-wrap gap-2">
                  {result.competencias_bncc.map((comp, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-[#2C3E7D]/10 text-[#2C3E7D] rounded-full text-sm font-medium"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </section>

              {/* Duração e Metodologia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <section>
                  <h4 className="font-semibold text-[#2C3E7D] mb-2">Duração</h4>
                  <p className="text-gray-700">{result.duracao}</p>
                </section>
                <section>
                  <h4 className="font-semibold text-[#2C3E7D] mb-2">Metodologia</h4>
                  <p className="text-gray-700">{result.metodologia}</p>
                </section>
              </div>

              {/* Desenvolvimento */}
              <section>
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Desenvolvimento da Aula</h4>
                <div className="space-y-4">
                  {result.desenvolvimento.map((etapa, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-[#2C3E7D]">{etapa.etapa}</h5>
                        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                          {etapa.duracao}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{etapa.descricao}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recursos */}
              <section>
                <h4 className="font-semibold text-[#2C3E7D] mb-2">Recursos Necessários</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {result.recursos.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </section>

              {/* Avaliação */}
              <section>
                <h4 className="font-semibold text-[#2C3E7D] mb-2">Avaliação</h4>
                <p className="text-gray-700">{result.avaliacao}</p>
              </section>

              {/* Referências */}
              <section>
                <h4 className="font-semibold text-[#2C3E7D] mb-2">Referências</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {result.referencias.map((ref, i) => (
                    <li key={i}>{ref}</li>
                  ))}
                </ul>
              </section>
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
        title="Editar Plano de Aula"
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
