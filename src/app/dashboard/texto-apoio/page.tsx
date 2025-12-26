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
import type { TextoApoioOutput } from '@/lib/gemini'
import { exportTextoApoioToPDF, exportTextoApoioToDOCX } from '@/lib/export'
import { EditContentModal } from '@/components/dashboard/edit-content-modal'
import { ModeSelector, type GenerationMode } from '@/components/dashboard/mode-selector'

const CREDIT_COST = 3

const TIPOS_TEXTO = [
  { id: 'texto_apoio', label: 'Texto de Apoio' },
  { id: 'resumo', label: 'Resumo' },
  { id: 'texto_explicativo', label: 'Texto Explicativo' },
  { id: 'guia_estudo', label: 'Guia de Estudo' },
]

const COMPLEXIDADES = [
  { id: 'basico', label: 'Básico - Introdução ao tema' },
  { id: 'intermediario', label: 'Intermediário - Aprofundamento' },
  { id: 'avancado', label: 'Avançado - Análise crítica' },
]

const TAMANHOS = [
  { id: 'curto', label: 'Curto (300-500 palavras)' },
  { id: 'medio', label: 'Médio (500-1000 palavras)' },
  { id: 'longo', label: 'Longo (1000-1500 palavras)' },
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
  'EJA - Fundamental',
  'EJA - Médio',
]

interface FormData {
  disciplina: string
  ano: string
  tema: string
  tipoTexto: string
  complexidade: string
  tamanho: string
  conceitosChave: string
  codigoBncc: string
  contextoAdicional: string
}

export default function TextoApoioPage() {
  const { dbUser, institution } = useAuth()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<GenerationMode>('personalizado')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<TextoApoioOutput | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [expandedSections, setExpandedSections] = useState<number[]>([0])
  const [formData, setFormData] = useState<FormData>({
    disciplina: '',
    ano: '',
    tema: '',
    tipoTexto: '',
    complexidade: '',
    tamanho: '',
    conceitosChave: '',
    codigoBncc: '',
    contextoAdicional: '',
  })

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setExpandedSections([0])
    setLoading(true)

    try {
      const response = await fetch('/api/generate/texto-apoio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar texto de apoio')
      }

      setResult(data.output as TextoApoioOutput)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const copyFullText = () => {
    if (!result) return

    let fullText = `${result.titulo}\n\n`
    fullText += `${result.introducao}\n\n`

    result.secoes.forEach(secao => {
      fullText += `${secao.titulo}\n${secao.conteudo}\n\n`
    })

    fullText += `Conceitos-Chave:\n`
    result.conceitosChave.forEach(c => {
      fullText += `- ${c.termo}: ${c.definicao}\n`
    })

    fullText += `\n${result.resumoConclusao}\n`
    fullText += `\nBibliografia:\n`
    result.sugestoesBibliografia.forEach(b => {
      fullText += `- ${b}\n`
    })

    navigator.clipboard.writeText(fullText)
  }

  const creditsAvailable = dbUser?.credits ?? 0
  const canGenerate = true // creditsAvailable >= CREDIT_COST
  const temaLength = formData.tema.length

  const handleExportPDF = async () => {
    if (!result) return
    setExporting(true)
    try {
      await exportTextoApoioToPDF(result)
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
      await exportTextoApoioToDOCX(result)
    } catch (err) {
      console.error('Erro ao exportar DOCX:', err)
    } finally {
      setExporting(false)
    }
  }

  // Converter resultado para HTML editavel
  const convertToEditableHTML = (textoResult: TextoApoioOutput): string => {
    let html = `<h1>${textoResult.titulo}</h1>\n\n`

    html += `<h2>Introducao</h2>\n`
    html += `<p>${textoResult.introducao}</p>\n\n`

    textoResult.secoes.forEach((secao) => {
      html += `<h2>${secao.titulo}</h2>\n`
      html += `<p>${secao.conteudo}</p>\n`

      if (secao.conceitosDestacados && secao.conceitosDestacados.length > 0) {
        html += `<p><strong>Conceitos Destacados:</strong> ${secao.conceitosDestacados.join(', ')}</p>\n`
      }
      if (secao.exemplos && secao.exemplos.length > 0) {
        html += `<h3>Exemplos</h3>\n<ul>\n`
        secao.exemplos.forEach((ex) => {
          html += `<li>${ex}</li>\n`
        })
        html += `</ul>\n`
      }
      html += '\n'
    })

    html += `<h2>Conceitos-Chave</h2>\n`
    textoResult.conceitosChave.forEach((conceito) => {
      html += `<p><strong>${conceito.termo}:</strong> ${conceito.definicao}</p>\n`
    })
    html += '\n'

    html += `<h2>Conclusao</h2>\n`
    html += `<p>${textoResult.resumoConclusao}</p>\n\n`

    html += `<h2>Alinhamento BNCC</h2>\n`
    html += `<p><strong>Competencias:</strong> ${textoResult.alinhamentoBncc.competencias.join(', ')}</p>\n`
    html += `<p><strong>Habilidades:</strong> ${textoResult.alinhamentoBncc.habilidades.join(', ')}</p>\n`
    html += `<p>${textoResult.alinhamentoBncc.observacoes}</p>\n\n`

    html += `<h2>Bibliografia Sugerida</h2>\n<ul>\n`
    textoResult.sugestoesBibliografia.forEach((bib) => {
      html += `<li>${bib}</li>\n`
    })
    html += `</ul>\n`

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
        <h2 className="text-3xl font-bold text-[#2C3E7D]">Texto de Apoio / Resumo</h2>
        <p className="mt-2 text-gray-600">
          Gere textos de apoio, resumos e guias de estudo educacionais alinhados com a BNCC.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Texto</CardTitle>
              <CardDescription>
                Preencha as informações para gerar o texto educacional
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tema / Conteúdo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tema}
                    onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                    placeholder="Ex: Fotossíntese, Revolução Industrial, Frações..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                    required
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-sm text-gray-500">Mínimo: 5 caracteres | Máximo: 200 caracteres</p>
                    <p className={`text-sm ${temaLength < 5 || temaLength > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                      {temaLength}/200
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Tipo de Texto <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.tipoTexto}
                      onValueChange={(value) => setFormData({ ...formData, tipoTexto: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_TEXTO.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Complexidade <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.complexidade}
                      onValueChange={(value) => setFormData({ ...formData, complexidade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPLEXIDADES.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Tamanho <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.tamanho}
                      onValueChange={(value) => setFormData({ ...formData, tamanho: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TAMANHOS.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Conceitos-Chave a Incluir (opcional)
                  </label>
                  <textarea
                    value={formData.conceitosChave}
                    onChange={(e) => setFormData({ ...formData, conceitosChave: e.target.value })}
                    placeholder="Ex: cloroplasto, luz solar, gás carbônico, glicose..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Código BNCC (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.codigoBncc}
                      onChange={(e) => setFormData({ ...formData, codigoBncc: e.target.value })}
                      placeholder="Ex: EF06CI05"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Contexto Adicional (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.contextoAdicional}
                      onChange={(e) => setFormData({ ...formData, contextoAdicional: e.target.value })}
                      placeholder="Ex: Para aula prática no laboratório"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                    />
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
                    temaLength < 5 ||
                    temaLength > 200 ||
                    !formData.disciplina ||
                    !formData.ano ||
                    !formData.tipoTexto ||
                    !formData.complexidade ||
                    !formData.tamanho
                  }
                >
                  Gerar Texto ({CREDIT_COST} créditos)
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
              <CardTitle className="text-base">Tipos de Texto</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><strong>Texto de Apoio:</strong> Material didático para auxiliar na compreensão</li>
                <li><strong>Resumo:</strong> Síntese dos principais pontos</li>
                <li><strong>Texto Explicativo:</strong> Explicação detalhada do tema</li>
                <li><strong>Guia de Estudo:</strong> Roteiro estruturado para revisão</li>
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
                  <CardDescription className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-[#2C3E7D]/10 text-[#2C3E7D] rounded text-xs">
                        {result.metadados.publicoAlvo}
                      </span>
                      <span className="px-2 py-1 bg-[#FDB913]/20 text-[#2C3E7D] rounded text-xs">
                        {result.metadados.tempoLeituraEstimado}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {result.metadados.nivelComplexidade}
                      </span>
                    </div>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEdit}
                  >
                    Editar Conteudo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyFullText}
                  >
                    Copiar Texto Completo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Introdução */}
              <section>
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Introdução</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800">{result.introducao}</p>
                </div>
              </section>

              {/* Seções */}
              <section>
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Conteúdo</h4>
                <div className="space-y-3">
                  {result.secoes.map((secao, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(index)}
                        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <span className="font-medium text-[#2C3E7D]">{secao.titulo}</span>
                        <span className="text-gray-400">
                          {expandedSections.includes(index) ? '▲' : '▼'}
                        </span>
                      </button>
                      {expandedSections.includes(index) && (
                        <div className="p-4 space-y-3">
                          <p className="text-gray-800 whitespace-pre-wrap">{secao.conteudo}</p>

                          {secao.conceitosDestacados && secao.conceitosDestacados.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-2">Conceitos destacados:</p>
                              <div className="flex flex-wrap gap-2">
                                {secao.conceitosDestacados.map((conceito, i) => (
                                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                    {conceito}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {secao.exemplos && secao.exemplos.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-2">Exemplos:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {secao.exemplos.map((exemplo, i) => (
                                  <li key={i} className="text-gray-600 text-sm">{exemplo}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Conceitos-Chave */}
              <section className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Conceitos-Chave</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.conceitosChave.map((conceito, index) => (
                    <div key={index} className="bg-[#2C3E7D]/5 rounded-lg p-3">
                      <p className="font-medium text-[#2C3E7D]">{conceito.termo}</p>
                      <p className="text-gray-600 text-sm mt-1">{conceito.definicao}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Resumo/Conclusão */}
              <section className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Conclusão</h4>
                <div className="bg-[#FDB913]/10 rounded-lg p-4">
                  <p className="text-gray-800">{result.resumoConclusao}</p>
                </div>
              </section>

              {/* Alinhamento BNCC */}
              <section className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Alinhamento com a BNCC</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Competências:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.alinhamentoBncc.competencias.map((comp, i) => (
                        <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Habilidades:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.alinhamentoBncc.habilidades.map((hab, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-mono">
                          {hab}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{result.alinhamentoBncc.observacoes}</p>
                </div>
              </section>

              {/* Bibliografia */}
              <section className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Sugestões de Bibliografia</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.sugestoesBibliografia.map((bib, index) => (
                    <li key={index} className="text-gray-600 text-sm">{bib}</li>
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
        title="Editar Texto de Apoio"
      />
    </div>
  )
}
