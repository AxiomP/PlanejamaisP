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
import type { IdeiasAtividadesOutput } from '@/lib/gemini'
import { exportIdeiasAtividadesToPDF, exportIdeiasAtividadesToDOCX } from '@/lib/export'
import { EditContentModal } from '@/components/dashboard/edit-content-modal'
import { ModeSelector, type GenerationMode } from '@/components/dashboard/mode-selector'

const CREDIT_COST = 3

const TIPOS_ATIVIDADE = [
  { id: 'individual', label: 'Individual' },
  { id: 'dupla', label: 'Em Dupla' },
  { id: 'grupo', label: 'Em Grupo' },
  { id: 'mista', label: 'Mista (Individual + Coletivo)' },
]

const MODALIDADES = [
  { id: 'presencial', label: 'Presencial' },
  { id: 'remota', label: 'Remota/Online' },
  { id: 'hibrida', label: 'Híbrida' },
]

const DURACOES = [
  { id: 'curta', label: 'Curta (15-30 min)' },
  { id: 'media', label: 'Média (30-60 min)' },
  { id: 'longa', label: 'Longa (1-2 horas)' },
]

const QUANTIDADES = [
  { id: '3', label: '3 ideias' },
  { id: '5', label: '5 ideias' },
  { id: '7', label: '7 ideias' },
  { id: '10', label: '10 ideias' },
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
  tipoAtividade: string
  modalidade: string
  duracao: string
  quantidade: number
  recursos: string
  objetivoPedagogico: string
  codigoBncc: string
}

export default function AtividadesPage() {
  const { dbUser, institution } = useAuth()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<GenerationMode>('personalizado')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<IdeiasAtividadesOutput | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [expandedActivities, setExpandedActivities] = useState<number[]>([0])
  const [formData, setFormData] = useState<FormData>({
    disciplina: '',
    ano: '',
    tema: '',
    tipoAtividade: '',
    modalidade: '',
    duracao: '',
    quantidade: 5,
    recursos: '',
    objetivoPedagogico: '',
    codigoBncc: '',
  })

  const toggleActivity = (index: number) => {
    setExpandedActivities(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setExpandedActivities([0])
    setLoading(true)

    try {
      const response = await fetch('/api/generate/atividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar ideias de atividades')
      }

      setResult(data.output as IdeiasAtividadesOutput)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const copyActivity = (atividade: IdeiasAtividadesOutput['atividades'][0]) => {
    let text = `${atividade.nome}\n\n`
    text += `${atividade.descricao}\n\n`
    text += `Objetivos:\n${atividade.objetivos.map(o => `- ${o}`).join('\n')}\n\n`
    text += `Materiais Necessários:\n${atividade.materiaisNecessarios.map(m => `- ${m}`).join('\n')}\n\n`
    text += `Passos:\n${atividade.passosExecucao.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`
    text += `Duração: ${atividade.duracaoEstimada}\n\n`
    text += `Dicas de Adaptação: ${atividade.dicasAdaptacao}\n\n`
    text += `Avaliação Sugerida: ${atividade.avaliacaoSugerida}`

    navigator.clipboard.writeText(text)
  }

  const copyAllActivities = () => {
    if (!result) return

    let fullText = `${result.titulo}\n\n`
    fullText += `${result.introducao}\n\n`
    fullText += `${'='.repeat(50)}\n\n`

    result.atividades.forEach(atividade => {
      fullText += `ATIVIDADE ${atividade.numero}: ${atividade.nome}\n`
      fullText += `-`.repeat(30) + '\n'
      fullText += `${atividade.descricao}\n\n`
      fullText += `Objetivos:\n${atividade.objetivos.map(o => `• ${o}`).join('\n')}\n\n`
      fullText += `Materiais:\n${atividade.materiaisNecessarios.map(m => `• ${m}`).join('\n')}\n\n`
      fullText += `Passos:\n${atividade.passosExecucao.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`
      fullText += `Duração: ${atividade.duracaoEstimada}\n`
      fullText += `Adaptação: ${atividade.dicasAdaptacao}\n`
      fullText += `Avaliação: ${atividade.avaliacaoSugerida}\n\n`
      fullText += `${'='.repeat(50)}\n\n`
    })

    fullText += `DICAS GERAIS:\n`
    result.dicasGerais.forEach(d => {
      fullText += `• ${d}\n`
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
      await exportIdeiasAtividadesToPDF(result)
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
      await exportIdeiasAtividadesToDOCX(result)
    } catch (err) {
      console.error('Erro ao exportar DOCX:', err)
    } finally {
      setExporting(false)
    }
  }

  // Converter resultado para HTML editavel
  const convertToEditableHTML = (atividadesResult: IdeiasAtividadesOutput): string => {
    let html = `<h1>${atividadesResult.titulo}</h1>\n\n`
    html += `<p>${atividadesResult.introducao}</p>\n\n`

    atividadesResult.atividades.forEach((atividade) => {
      html += `<h2>Atividade ${atividade.numero}: ${atividade.nome}</h2>\n`
      html += `<p>${atividade.descricao}</p>\n`
      html += `<p><strong>Duracao Estimada:</strong> ${atividade.duracaoEstimada}</p>\n\n`

      html += `<h3>Objetivos</h3>\n<ul>\n`
      atividade.objetivos.forEach((obj) => {
        html += `<li>${obj}</li>\n`
      })
      html += `</ul>\n`

      html += `<h3>Materiais Necessarios</h3>\n<ul>\n`
      atividade.materiaisNecessarios.forEach((mat) => {
        html += `<li>${mat}</li>\n`
      })
      html += `</ul>\n`

      html += `<h3>Passos para Execucao</h3>\n<ol>\n`
      atividade.passosExecucao.forEach((passo) => {
        html += `<li>${passo}</li>\n`
      })
      html += `</ol>\n`

      html += `<p><strong>Dicas de Adaptacao:</strong> ${atividade.dicasAdaptacao}</p>\n`
      html += `<p><strong>Avaliacao Sugerida:</strong> ${atividade.avaliacaoSugerida}</p>\n\n`
    })

    html += `<h2>Dicas Gerais</h2>\n<ul>\n`
    atividadesResult.dicasGerais.forEach((dica) => {
      html += `<li>${dica}</li>\n`
    })
    html += `</ul>\n\n`

    if (atividadesResult.variacoes && atividadesResult.variacoes.length > 0) {
      html += `<h2>Variacoes e Adaptacoes</h2>\n`
      atividadesResult.variacoes.forEach((variacao) => {
        html += `<p><strong>${variacao.contexto}:</strong> ${variacao.adaptacao}</p>\n`
      })
      html += '\n'
    }

    html += `<h2>Alinhamento BNCC</h2>\n`
    html += `<p><strong>Competencias:</strong> ${atividadesResult.alinhamentoBncc.competencias.join(', ')}</p>\n`
    html += `<p><strong>Habilidades:</strong> ${atividadesResult.alinhamentoBncc.habilidades.join(', ')}</p>\n`
    html += `<p>${atividadesResult.alinhamentoBncc.observacoes}</p>\n`

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
        <h2 className="text-3xl font-bold text-[#2C3E7D]">Ideias de Atividades</h2>
        <p className="mt-2 text-gray-600">
          Receba sugestões criativas de atividades pedagógicas alinhadas à BNCC para suas aulas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Atividades</CardTitle>
              <CardDescription>
                Preencha as informações para gerar ideias de atividades
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
                    placeholder="Ex: Frações, Segunda Guerra Mundial, Ecossistemas..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                    required
                  />
                  <p className={`text-sm mt-1 ${temaLength < 3 || temaLength > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                    {temaLength}/200 caracteres
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Tipo <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.tipoAtividade}
                      onValueChange={(value) => setFormData({ ...formData, tipoAtividade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_ATIVIDADE.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Modalidade <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.modalidade}
                      onValueChange={(value) => setFormData({ ...formData, modalidade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODALIDADES.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Duração <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.duracao}
                      onValueChange={(value) => setFormData({ ...formData, duracao: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURACOES.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Quantidade <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.quantidade.toString()}
                      onValueChange={(value) => setFormData({ ...formData, quantidade: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUANTIDADES.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Recursos Disponíveis (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.recursos}
                    onChange={(e) => setFormData({ ...formData, recursos: e.target.value })}
                    placeholder="Ex: Projetor, cartolinas, computadores, materiais recicláveis..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Objetivo Pedagógico (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.objetivoPedagogico}
                      onChange={(e) => setFormData({ ...formData, objetivoPedagogico: e.target.value })}
                      placeholder="Ex: Desenvolver raciocínio lógico"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Código BNCC (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.codigoBncc}
                      onChange={(e) => setFormData({ ...formData, codigoBncc: e.target.value })}
                      placeholder="Ex: EF06MA01"
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
                    temaLength < 3 ||
                    temaLength > 200 ||
                    !formData.disciplina ||
                    !formData.ano ||
                    !formData.tipoAtividade ||
                    !formData.modalidade ||
                    !formData.duracao
                  }
                >
                  Gerar Ideias ({CREDIT_COST} créditos)
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
                <li>• Informe os recursos disponíveis para atividades mais realistas</li>
                <li>• Atividades mistas engajam mais os alunos</li>
                <li>• Adapte as sugestões à sua realidade escolar</li>
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
                        Dificuldade: {result.metadados.nivelDificuldade}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        Engajamento: {result.metadados.engajamentoEsperado}
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
                    onClick={copyAllActivities}
                  >
                    Copiar Todas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Introdução */}
              <section>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-800">{result.introducao}</p>
                </div>
              </section>

              {/* Atividades */}
              <section>
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Atividades Sugeridas</h4>
                <div className="space-y-3">
                  {result.atividades.map((atividade, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleActivity(index)}
                        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-[#2C3E7D] text-white rounded-full text-sm font-bold">
                            {atividade.numero}
                          </span>
                          <span className="font-medium text-[#2C3E7D]">{atividade.nome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{atividade.duracaoEstimada}</span>
                          <span className="text-gray-400">
                            {expandedActivities.includes(index) ? '▲' : '▼'}
                          </span>
                        </div>
                      </button>
                      {expandedActivities.includes(index) && (
                        <div className="p-4 space-y-4 border-t border-gray-100">
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyActivity(atividade)}
                            >
                              Copiar Atividade
                            </Button>
                          </div>

                          <div>
                            <p className="text-gray-800">{atividade.descricao}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Objetivos</p>
                              <ul className="list-disc list-inside space-y-1">
                                {atividade.objetivos.map((obj, i) => (
                                  <li key={i} className="text-gray-600 text-sm">{obj}</li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Materiais Necessários</p>
                              <div className="flex flex-wrap gap-2">
                                {atividade.materiaisNecessarios.map((mat, i) => (
                                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {mat}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Passos para Execução</p>
                            <ol className="list-decimal list-inside space-y-1">
                              {atividade.passosExecucao.map((passo, i) => (
                                <li key={i} className="text-gray-600 text-sm">{passo}</li>
                              ))}
                            </ol>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                            <div className="bg-yellow-50 rounded-lg p-3">
                              <p className="text-sm font-medium text-yellow-800 mb-1">Dicas de Adaptação</p>
                              <p className="text-yellow-700 text-sm">{atividade.dicasAdaptacao}</p>
                            </div>

                            <div className="bg-green-50 rounded-lg p-3">
                              <p className="text-sm font-medium text-green-800 mb-1">Avaliação Sugerida</p>
                              <p className="text-green-700 text-sm">{atividade.avaliacaoSugerida}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Dicas Gerais */}
              <section className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Dicas Gerais</h4>
                <div className="bg-[#2C3E7D]/5 rounded-lg p-4">
                  <ul className="space-y-2">
                    {result.dicasGerais.map((dica, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="text-[#FDB913]">★</span>
                        {dica}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Variações */}
              {result.variacoes && result.variacoes.length > 0 && (
                <section className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-[#2C3E7D] mb-3">Variações e Adaptações</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.variacoes.map((variacao, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-700 text-sm">{variacao.contexto}</p>
                        <p className="text-gray-600 text-sm mt-1">{variacao.adaptacao}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

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
        title="Editar Ideias de Atividades"
      />
    </div>
  )
}
