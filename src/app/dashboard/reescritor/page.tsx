'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ReescritorOutput } from '@/lib/gemini'
import { exportReescritorToPDF, exportReescritorToDOCX } from '@/lib/export'
import { EditContentModal } from '@/components/dashboard/edit-content-modal'
import { ModeSelector, type GenerationMode } from '@/components/dashboard/mode-selector'

const CREDIT_COST = 2

const OBJETIVOS = [
  { id: 'simplificar', label: 'Simplificar para alunos mais novos' },
  { id: 'formalizar', label: 'Formalizar/tornar mais acadêmico' },
  { id: 'adaptar_nee', label: 'Adaptar para necessidades especiais' },
  { id: 'resumir', label: 'Resumir/condensar' },
  { id: 'expandir', label: 'Expandir/detalhar mais' },
  { id: 'vocabulario', label: 'Adequar vocabulário ao nível' },
  { id: 'contextualizar', label: 'Contextualizar para realidade brasileira' },
  { id: 'atualizar', label: 'Atualizar linguagem/referências' },
  { id: 'corrigir', label: 'Corrigir erros e melhorar clareza' },
]

const NIVEIS_ENSINO = [
  { id: 'ef_inicial', label: 'Ensino Fundamental I (1º ao 5º ano)' },
  { id: 'ef_final', label: 'Ensino Fundamental II (6º ao 9º ano)' },
  { id: 'em', label: 'Ensino Médio' },
  { id: 'eja', label: 'Educação de Jovens e Adultos (EJA)' },
  { id: 'inclusivo', label: 'Educação Inclusiva/Especial' },
]

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

interface FormData {
  textoOriginal: string
  objetivo: string
  nivelEnsino: string
  disciplina: string
  instrucoes: string
  manterCodigoBncc: boolean
  incluirExplicacao: boolean
}

export default function ReescritorPage() {
  const { dbUser, institution } = useAuth()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<GenerationMode>('personalizado')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ReescritorOutput | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [showExplicacao, setShowExplicacao] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    textoOriginal: '',
    objetivo: '',
    nivelEnsino: '',
    disciplina: '',
    instrucoes: '',
    manterCodigoBncc: false,
    incluirExplicacao: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setShowExplicacao(false)
    setLoading(true)

    try {
      const response = await fetch('/api/generate/reescritor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao reescrever texto')
      }

      setResult(data.output as ReescritorOutput)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const creditsAvailable = dbUser?.credits ?? 0
  const canGenerate = true // creditsAvailable >= CREDIT_COST
  const charCount = formData.textoOriginal.length

  const handleExportPDF = async () => {
    if (!result) return
    setExporting(true)
    try {
      await exportReescritorToPDF(result)
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
      await exportReescritorToDOCX(result)
    } catch (err) {
      console.error('Erro ao exportar DOCX:', err)
    } finally {
      setExporting(false)
    }
  }

  // Converter resultado para HTML editavel
  const convertToEditableHTML = (reescritorResult: ReescritorOutput): string => {
    let html = `<h1>${reescritorResult.titulo}</h1>\n\n`

    html += `<h2>Resumo das Mudancas</h2>\n<ul>\n`
    reescritorResult.resumoMudancas.forEach((mudanca) => {
      html += `<li>${mudanca}</li>\n`
    })
    html += `</ul>\n\n`

    html += `<h2>Texto Reescrito</h2>\n`
    html += `<p>${reescritorResult.textoReescrito}</p>\n\n`

    if (reescritorResult.explicacao) {
      html += `<h2>Explicacao das Alteracoes</h2>\n`
      html += `<p><strong>Motivacao:</strong> ${reescritorResult.explicacao.motivacao}</p>\n\n`

      html += `<h3>Alteracoes Realizadas</h3>\n`
      reescritorResult.explicacao.alteracoesRealizadas.forEach((alt) => {
        html += `<p><strong>${alt.tipo}:</strong> ${alt.descricao}</p>\n`
        if (alt.exemplo) {
          html += `<p><em>Exemplo: ${alt.exemplo}</em></p>\n`
        }
      })
      html += '\n'

      html += `<h3>Dicas de Uso</h3>\n<ul>\n`
      reescritorResult.explicacao.dicasUso.forEach((dica) => {
        html += `<li>${dica}</li>\n`
      })
      html += `</ul>\n\n`
    }

    if (reescritorResult.alinhamentoBncc) {
      html += `<h2>Alinhamento BNCC</h2>\n`
      html += `<p><strong>Competencias Preservadas:</strong> ${reescritorResult.alinhamentoBncc.competenciasPreservadas.join(', ')}</p>\n`
      html += `<p>${reescritorResult.alinhamentoBncc.observacoes}</p>\n\n`
    }

    html += `<h2>Informacoes</h2>\n`
    html += `<p><strong>Tamanho Original:</strong> ${reescritorResult.metadados.tamanhoOriginal} caracteres</p>\n`
    html += `<p><strong>Tamanho Final:</strong> ${reescritorResult.metadados.tamanhoFinal} caracteres</p>\n`
    html += `<p><strong>Nivel de Leitura:</strong> ${reescritorResult.metadados.nivelLeitura}</p>\n`
    html += `<p><strong>Objetivo Atendido:</strong> ${reescritorResult.metadados.objetivoAtendido}</p>\n`

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
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#2C3E7D]">Reescritor de Texto</h2>
        <p className="mt-2 text-gray-600">
          Reescreva textos educacionais para diferentes níveis e propósitos, mantendo o alinhamento com a BNCC.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Reescrita</CardTitle>
              <CardDescription>
                Cole o texto original e escolha como você quer que ele seja reescrito
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Texto Original <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.textoOriginal}
                    onChange={(e) => setFormData({ ...formData, textoOriginal: e.target.value })}
                    placeholder="Cole aqui o texto que você deseja reescrever..."
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent resize-none"
                    required
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-sm text-gray-500">Mínimo: 50 caracteres | Máximo: 5000 caracteres</p>
                    <p className={`text-sm ${charCount < 50 || charCount > 5000 ? 'text-red-500' : 'text-gray-500'}`}>
                      {charCount}/5000
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Objetivo da Reescrita <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.objetivo}
                      onValueChange={(value) => setFormData({ ...formData, objetivo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o objetivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {OBJETIVOS.map((obj) => (
                          <SelectItem key={obj.id} value={obj.id}>
                            {obj.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Nível de Ensino Alvo <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.nivelEnsino}
                      onValueChange={(value) => setFormData({ ...formData, nivelEnsino: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVEIS_ENSINO.map((nivel) => (
                          <SelectItem key={nivel.id} value={nivel.id}>
                            {nivel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Disciplina (opcional)
                  </label>
                  <Select
                    value={formData.disciplina}
                    onValueChange={(value) => setFormData({ ...formData, disciplina: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a disciplina (opcional)" />
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
                    Instruções Adicionais (opcional)
                  </label>
                  <textarea
                    value={formData.instrucoes}
                    onChange={(e) => setFormData({ ...formData, instrucoes: e.target.value })}
                    placeholder="Ex: Manter o tom informal, focar em exemplos práticos..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="manterCodigoBncc"
                      checked={formData.manterCodigoBncc}
                      onChange={(e) => setFormData({ ...formData, manterCodigoBncc: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-[#2C3E7D] focus:ring-[#2C3E7D]"
                    />
                    <label htmlFor="manterCodigoBncc" className="text-sm text-gray-700">
                      Preservar referências a códigos BNCC no texto
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="incluirExplicacao"
                      checked={formData.incluirExplicacao}
                      onChange={(e) => setFormData({ ...formData, incluirExplicacao: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-[#2C3E7D] focus:ring-[#2C3E7D]"
                    />
                    <label htmlFor="incluirExplicacao" className="text-sm text-gray-700">
                      Incluir explicação detalhada das alterações
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
                    charCount < 50 ||
                    charCount > 5000 ||
                    !formData.objetivo ||
                    !formData.nivelEnsino
                  }
                >
                  Reescrever Texto ({CREDIT_COST} créditos)
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
                <li>• Use &quot;Simplificar&quot; para adaptar textos complexos</li>
                <li>• &quot;Adaptar para NEE&quot; cria versões mais acessíveis</li>
                <li>• O alinhamento BNCC é preservado automaticamente</li>
                <li>• Revise sempre o texto gerado antes de usar</li>
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
                  <CardDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {result.resumoMudancas.map((mudanca, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-[#2C3E7D]/10 text-[#2C3E7D] rounded text-xs"
                        >
                          {mudanca}
                        </span>
                      ))}
                    </div>
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEdit}
                >
                  Editar Conteudo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Texto Reescrito */}
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-[#2C3E7D]">Texto Reescrito</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(result.textoReescrito)}
                  >
                    Copiar Texto
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-wrap">{result.textoReescrito}</p>
                </div>
              </section>

              {/* Explicação (se disponível) */}
              {result.explicacao && (
                <section className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-[#2C3E7D]">Explicação das Alterações</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExplicacao(!showExplicacao)}
                    >
                      {showExplicacao ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                    </Button>
                  </div>

                  {showExplicacao && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-800 mb-1">Motivação</p>
                        <p className="text-blue-700">{result.explicacao.motivacao}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Alterações Realizadas</p>
                        <div className="space-y-2">
                          {result.explicacao.alteracoesRealizadas.map((alt, i) => (
                            <div key={i} className="bg-gray-50 rounded-lg p-3">
                              <span className="text-xs px-2 py-1 bg-[#2C3E7D]/10 text-[#2C3E7D] rounded font-medium">
                                {alt.tipo}
                              </span>
                              <p className="text-gray-700 mt-2">{alt.descricao}</p>
                              {alt.exemplo && (
                                <p className="text-sm text-gray-500 mt-1 italic">{alt.exemplo}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Dicas de Uso</p>
                        <ul className="list-disc list-inside space-y-1">
                          {result.explicacao.dicasUso.map((dica, i) => (
                            <li key={i} className="text-gray-600 text-sm">{dica}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Alinhamento BNCC */}
              {result.alinhamentoBncc && (
                <section className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-[#2C3E7D] mb-3">Alinhamento com a BNCC</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {result.alinhamentoBncc.competenciasPreservadas.map((comp, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm">{result.alinhamentoBncc.observacoes}</p>
                </section>
              )}

              {/* Metadados */}
              <section className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Informações</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-500">Tamanho Original</p>
                    <p className="font-semibold text-[#2C3E7D]">{result.metadados.tamanhoOriginal} chars</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-500">Tamanho Final</p>
                    <p className="font-semibold text-[#2C3E7D]">{result.metadados.tamanhoFinal} chars</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-500">Nível de Leitura</p>
                    <p className="font-semibold text-[#2C3E7D] text-xs">{result.metadados.nivelLeitura}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-500">Objetivo</p>
                    <p className="font-semibold text-[#2C3E7D] text-xs">{result.metadados.objetivoAtendido}</p>
                  </div>
                </div>
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
        title="Editar Texto Reescrito"
      />
    </div>
  )
}
