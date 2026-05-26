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
import type { ProvaOutput } from '@/lib/gemini'
import { exportProvaToPDF, exportProvaToDOCX } from '@/lib/export'
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

const TIPOS_QUESTOES = [
  { id: 'multipla_escolha', label: 'Múltipla Escolha' },
  { id: 'verdadeiro_falso', label: 'Verdadeiro ou Falso' },
  { id: 'dissertativa', label: 'Dissertativa' },
  { id: 'associacao', label: 'Associação de Colunas' },
]

const DIFICULDADES = [
  'Fácil',
  'Médio',
  'Difícil',
  'Misto (variado)',
]

interface FormData {
  disciplina: string
  ano: string
  tema: string
  tiposQuestoes: string[]
  quantidade: number
  dificuldade: string
  incluirGabarito: boolean
  contexto: string
}

export default function ProvaPage() {
  const { dbUser, institution } = useAuth()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<GenerationMode>('personalizado')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ProvaOutput | null>(null)
  const [showGabarito, setShowGabarito] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [templateText, setTemplateText] = useState('')
  const [templateFileName, setTemplateFileName] = useState('')
  const [formData, setFormData] = useState<FormData>({
    disciplina: '',
    ano: '',
    tema: '',
    tiposQuestoes: [],
    quantidade: 10,
    dificuldade: '',
    incluirGabarito: true,
    contexto: '',
  })

  const toggleTipoQuestao = (tipo: string) => {
    setFormData((prev) => ({
      ...prev,
      tiposQuestoes: prev.tiposQuestoes.includes(tipo)
        ? prev.tiposQuestoes.filter((t) => t !== tipo)
        : [...prev.tiposQuestoes, tipo],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setShowGabarito(false)
    setLoading(true)

    try {
      const response = await fetch('/api/generate/prova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode, templateDocument: templateText || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar prova')
      }

      setResult(data.output as ProvaOutput)
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
      await exportProvaToPDF(result)
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
      await exportProvaToDOCX(result)
    } catch (err) {
      console.error('Erro ao exportar DOCX:', err)
    } finally {
      setExporting(false)
    }
  }

  // Converter resultado para HTML editável
  const convertToEditableHTML = (provaResult: ProvaOutput): string => {
    let html = `<h2>${provaResult.titulo}</h2>\n`
    html += `<p><em>${provaResult.instrucoes}</em></p>\n\n`

    provaResult.questoes.forEach((questao) => {
      html += `<h3>Questão ${questao.numero} (${questao.tipo.replace('_', ' ')})</h3>\n`
      html += `<p>${questao.enunciado}</p>\n`

      if (questao.alternativas && questao.alternativas.length > 0) {
        html += '<ul>\n'
        questao.alternativas.forEach((alt) => {
          html += `<li>${alt}</li>\n`
        })
        html += '</ul>\n'
      }

      if (questao.resposta_correta) {
        html += `<p><strong>Resposta:</strong> ${questao.resposta_correta}</p>\n`
      }
      if (questao.justificativa) {
        html += `<p><strong>Justificativa:</strong> ${questao.justificativa}</p>\n`
      }
      html += '\n'
    })

    if (provaResult.gabarito && provaResult.gabarito.length > 0) {
      html += '<h3>Gabarito</h3>\n<p>'
      html += provaResult.gabarito.join(' | ')
      html += '</p>\n'
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
    // O conteúdo editado pode ser usado para exportação customizada
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#2C3E7D]">Prova/Avaliação</h2>
          <p className="mt-2 text-gray-600">
            Gere provas e avaliações personalizadas com questões objetivas e dissertativas.
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
              <CardTitle>Configurar Prova</CardTitle>
              <CardDescription>
                Preencha os campos abaixo para gerar sua avaliação personalizada
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
                  placeholder="Ex: Trigonometria no triângulo retângulo"
                  value={formData.tema}
                  onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                  required
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tipos de Questões <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIPOS_QUESTOES.map((tipo) => (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => toggleTipoQuestao(tipo.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.tiposQuestoes.includes(tipo.id)
                            ? 'bg-[#2C3E7D] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tipo.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Selecione um ou mais tipos de questões
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Quantidade de Questões <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min={5}
                      max={20}
                      value={formData.quantidade}
                      onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 10 })}
                    />
                    <p className="mt-1 text-sm text-gray-500">Entre 5 e 20 questões</p>
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
                    placeholder="Ex: Avaliação diagnóstica do 1º bimestre, focando em equações do primeiro grau..."
                    value={formData.contexto}
                    onChange={(e) => setFormData({ ...formData, contexto: e.target.value })}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Especifique o objetivo ou parte do conteúdo que deseja avaliar
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="incluirGabarito"
                    checked={formData.incluirGabarito}
                    onChange={(e) => setFormData({ ...formData, incluirGabarito: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-[#2C3E7D] focus:ring-[#2C3E7D]"
                  />
                  <label htmlFor="incluirGabarito" className="text-sm text-gray-700">
                    Incluir gabarito com justificativas
                  </label>
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
                    formData.tiposQuestoes.length === 0 ||
                    !formData.dificuldade
                  }
                >
                  Gerar Prova ({CREDIT_COST} créditos)
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
                <li>• Combine diferentes tipos de questões</li>
                <li>• Use "Misto" para variar a dificuldade</li>
                <li>• O gabarito inclui justificativas para correção</li>
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
                  <CardDescription>{result.instrucoes}</CardDescription>
                </div>
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
              {/* Questões */}
              <div className="space-y-6">
                {result.questoes.map((questao, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-semibold text-[#2C3E7D]">
                        Questão {questao.numero}
                      </span>
                      <span className="text-xs px-2 py-1 bg-[#2C3E7D]/10 text-[#2C3E7D] rounded">
                        {questao.tipo.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-gray-800 mb-3">{questao.enunciado}</p>

                    {/* Alternativas para múltipla escolha */}
                    {questao.alternativas && (
                      <div className="space-y-2 ml-4">
                        {questao.alternativas.map((alt, j) => (
                          <p key={j} className="text-gray-700">{alt}</p>
                        ))}
                      </div>
                    )}

                    {/* Gabarito individual (se visível) */}
                    {showGabarito && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-sm">
                          <span className="font-medium text-green-600">Resposta: </span>
                          {questao.resposta_correta}
                        </p>
                        {questao.justificativa && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Justificativa: </span>
                            {questao.justificativa}
                          </p>
                        )}
                        {questao.resposta_esperada && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Resposta esperada: </span>
                            {questao.resposta_esperada}
                          </p>
                        )}
                        {questao.criterios_avaliacao && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Critérios: </span>
                            {questao.criterios_avaliacao}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Gabarito Resumido */}
              {formData.incluirGabarito && result.gabarito && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-[#2C3E7D]">Gabarito</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGabarito(!showGabarito)}
                    >
                      {showGabarito ? 'Ocultar Justificativas' : 'Mostrar Justificativas'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.gabarito.map((g, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                      >
                        {g}
                      </span>
                    ))}
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
        title="Editar Prova"
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
