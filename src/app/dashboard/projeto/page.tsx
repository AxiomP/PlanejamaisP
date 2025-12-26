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
import type { ProjetoEducacionalOutput } from '@/lib/gemini'
import { exportProjetoEducacionalToPDF, exportProjetoEducacionalToDOCX } from '@/lib/export'
import { EditContentModal } from '@/components/dashboard/edit-content-modal'
import { ModeSelector, type GenerationMode } from '@/components/dashboard/mode-selector'

const CREDIT_COST = 10

const DURACOES = [
  { id: '1_2_semanas', label: '1 a 2 semanas' },
  { id: '3_4_semanas', label: '3 a 4 semanas' },
  { id: '1_2_meses', label: '1 a 2 meses' },
  { id: 'bimestre', label: '1 bimestre' },
  { id: 'semestre', label: '1 semestre' },
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
  titulo: string
  disciplinas: string[]
  ano: string
  duracao: string
  temaGerador: string
  justificativa: string
  objetivoGeral: string
  publicoAlvo: string
  recursosDisponiveis: string
  incluirCronograma: boolean
  incluirAvaliacao: boolean
}

export default function ProjetoPage() {
  const { dbUser, institution } = useAuth()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<GenerationMode>('personalizado')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ProjetoEducacionalOutput | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [expandedSections, setExpandedSections] = useState<string[]>(['apresentacao', 'etapas'])
  const [expandedEtapas, setExpandedEtapas] = useState<number[]>([0])
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    disciplinas: [],
    ano: '',
    duracao: '',
    temaGerador: '',
    justificativa: '',
    objetivoGeral: '',
    publicoAlvo: '',
    recursosDisponiveis: '',
    incluirCronograma: true,
    incluirAvaliacao: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const toggleEtapa = (index: number) => {
    setExpandedEtapas(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const toggleDisciplina = (disciplina: string) => {
    setFormData(prev => ({
      ...prev,
      disciplinas: prev.disciplinas.includes(disciplina)
        ? prev.disciplinas.filter(d => d !== disciplina)
        : [...prev.disciplinas, disciplina]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setExpandedSections(['apresentacao', 'etapas'])
    setExpandedEtapas([0])
    setLoading(true)

    try {
      const response = await fetch('/api/generate/projeto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar projeto educacional')
      }

      setResult(data.output as ProjetoEducacionalOutput)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const copyProjeto = () => {
    if (!result) return

    let fullText = `${result.titulo}\n`
    fullText += `${'='.repeat(60)}\n\n`

    fullText += `IDENTIFICAÇÃO\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Disciplinas: ${result.identificacao.disciplinas.join(', ')}\n`
    fullText += `Ano/Série: ${result.identificacao.ano}\n`
    fullText += `Duração: ${result.identificacao.duracao}\n`
    fullText += `Público-Alvo: ${result.identificacao.publicoAlvo}\n\n`

    fullText += `APRESENTAÇÃO\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Tema Gerador: ${result.apresentacao.temaGerador}\n\n`
    fullText += `Justificativa:\n${result.apresentacao.justificativa}\n\n`
    fullText += `Questão Problematizadora:\n${result.apresentacao.problematizacao}\n\n`

    fullText += `OBJETIVOS\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Objetivo Geral: ${result.objetivos.geral}\n\n`
    fullText += `Objetivos Específicos:\n${result.objetivos.especificos.map(o => `• ${o}`).join('\n')}\n\n`

    fullText += `FUNDAMENTAÇÃO TEÓRICA\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Conceitos-Chave: ${result.fundamentacaoTeorica.conceitos.join(', ')}\n`
    fullText += `Autores de Referência: ${result.fundamentacaoTeorica.autoresReferencia.join('; ')}\n`
    fullText += `Competências BNCC: ${result.fundamentacaoTeorica.conexaoBncc.competencias.join(', ')}\n`
    fullText += `Habilidades BNCC: ${result.fundamentacaoTeorica.conexaoBncc.habilidades.join(', ')}\n\n`

    fullText += `METODOLOGIA\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Abordagem: ${result.metodologia.abordagem}\n`
    fullText += `Estratégias: ${result.metodologia.estrategias.join('; ')}\n`
    fullText += `Organização da Turma: ${result.metodologia.organizacaoTurma}\n\n`

    fullText += `ETAPAS DO PROJETO\n`
    fullText += `${'='.repeat(60)}\n\n`
    result.etapas.forEach(etapa => {
      fullText += `ETAPA ${etapa.numero}: ${etapa.titulo}\n`
      fullText += `-`.repeat(40) + '\n'
      fullText += `Duração: ${etapa.duracao}\n`
      fullText += `Descrição: ${etapa.descricao}\n\n`
      fullText += `Atividades:\n${etapa.atividades.map(a => `• ${a}`).join('\n')}\n\n`
      fullText += `Recursos: ${etapa.recursos.join(', ')}\n`
      fullText += `Produto Esperado: ${etapa.produtoEsperado}\n\n`
    })

    fullText += `RECURSOS\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Materiais: ${result.recursos.materiais.join(', ')}\n`
    fullText += `Tecnológicos: ${result.recursos.tecnologicos.join(', ')}\n`
    fullText += `Humanos: ${result.recursos.humanos.join(', ')}\n`
    fullText += `Espaços: ${result.recursos.espacos.join(', ')}\n\n`

    if (result.cronograma && result.cronograma.length > 0) {
      fullText += `CRONOGRAMA\n`
      fullText += `-`.repeat(40) + '\n'
      result.cronograma.forEach(item => {
        fullText += `${item.periodo} - ${item.etapa}\n`
        fullText += `  Atividades: ${item.atividades.join('; ')}\n`
        fullText += `  Responsável: ${item.responsavel}\n\n`
      })
    }

    fullText += `AVALIAÇÃO\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Critérios: ${result.avaliacao.criterios.join(', ')}\n`
    fullText += `Instrumentos: ${result.avaliacao.instrumentos.join(', ')}\n`
    fullText += `Formas de Registro: ${result.avaliacao.formasRegistro.join(', ')}\n`
    fullText += `Autoavaliação: ${result.avaliacao.autoavaliacao}\n\n`

    fullText += `PRODUTO FINAL\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Descrição: ${result.produtoFinal.descricao}\n`
    fullText += `Forma de Apresentação: ${result.produtoFinal.formaApresentacao}\n`
    fullText += `Público: ${result.produtoFinal.publico}\n\n`

    fullText += `REFERÊNCIAS\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += result.referencias.map(r => `• ${r}`).join('\n')

    navigator.clipboard.writeText(fullText)
  }

  const creditsAvailable = dbUser?.credits ?? 0
  const canGenerate = true // creditsAvailable >= CREDIT_COST
  const tituloLength = formData.titulo.length
  const isInterdisciplinar = formData.disciplinas.length > 1

  const handleExportPDF = async () => {
    if (!result) return
    setExporting(true)
    try {
      await exportProjetoEducacionalToPDF(result)
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
      await exportProjetoEducacionalToDOCX(result)
    } catch (err) {
      console.error('Erro ao exportar DOCX:', err)
    } finally {
      setExporting(false)
    }
  }

  // Converter resultado para HTML editavel
  const convertToEditableHTML = (projetoResult: ProjetoEducacionalOutput): string => {
    let html = `<h1>${projetoResult.titulo}</h1>\n\n`

    html += `<h2>Identificacao</h2>\n`
    html += `<p><strong>Disciplinas:</strong> ${projetoResult.identificacao.disciplinas.join(', ')}</p>\n`
    html += `<p><strong>Ano/Serie:</strong> ${projetoResult.identificacao.ano}</p>\n`
    html += `<p><strong>Duracao:</strong> ${projetoResult.identificacao.duracao}</p>\n`
    html += `<p><strong>Publico-Alvo:</strong> ${projetoResult.identificacao.publicoAlvo}</p>\n\n`

    html += `<h2>Apresentacao</h2>\n`
    html += `<p><strong>Tema Gerador:</strong> ${projetoResult.apresentacao.temaGerador}</p>\n`
    html += `<h3>Justificativa</h3>\n`
    html += `<p>${projetoResult.apresentacao.justificativa}</p>\n`
    html += `<h3>Questao Problematizadora</h3>\n`
    html += `<p><em>${projetoResult.apresentacao.problematizacao}</em></p>\n\n`

    html += `<h2>Objetivos</h2>\n`
    html += `<p><strong>Objetivo Geral:</strong> ${projetoResult.objetivos.geral}</p>\n`
    html += `<h3>Objetivos Especificos</h3>\n<ol>\n`
    projetoResult.objetivos.especificos.forEach((obj) => {
      html += `<li>${obj}</li>\n`
    })
    html += `</ol>\n\n`

    html += `<h2>Fundamentacao Teorica</h2>\n`
    html += `<p><strong>Conceitos-Chave:</strong> ${projetoResult.fundamentacaoTeorica.conceitos.join(', ')}</p>\n`
    html += `<p><strong>Autores de Referencia:</strong> ${projetoResult.fundamentacaoTeorica.autoresReferencia.join('; ')}</p>\n`
    html += `<p><strong>Competencias BNCC:</strong> ${projetoResult.fundamentacaoTeorica.conexaoBncc.competencias.join(', ')}</p>\n`
    html += `<p><strong>Habilidades BNCC:</strong> ${projetoResult.fundamentacaoTeorica.conexaoBncc.habilidades.join(', ')}</p>\n\n`

    html += `<h2>Metodologia</h2>\n`
    html += `<p><strong>Abordagem:</strong> ${projetoResult.metodologia.abordagem}</p>\n`
    html += `<h3>Estrategias</h3>\n<ul>\n`
    projetoResult.metodologia.estrategias.forEach((est) => {
      html += `<li>${est}</li>\n`
    })
    html += `</ul>\n`
    html += `<p><strong>Organizacao da Turma:</strong> ${projetoResult.metodologia.organizacaoTurma}</p>\n\n`

    html += `<h2>Etapas do Projeto</h2>\n`
    projetoResult.etapas.forEach((etapa) => {
      html += `<h3>Etapa ${etapa.numero}: ${etapa.titulo}</h3>\n`
      html += `<p><strong>Duracao:</strong> ${etapa.duracao}</p>\n`
      html += `<p>${etapa.descricao}</p>\n`
      html += `<h4>Atividades</h4>\n<ul>\n`
      etapa.atividades.forEach((ativ) => {
        html += `<li>${ativ}</li>\n`
      })
      html += `</ul>\n`
      html += `<p><strong>Recursos:</strong> ${etapa.recursos.join(', ')}</p>\n`
      html += `<p><strong>Produto Esperado:</strong> ${etapa.produtoEsperado}</p>\n\n`
    })

    html += `<h2>Recursos</h2>\n`
    html += `<p><strong>Materiais:</strong> ${projetoResult.recursos.materiais.join(', ')}</p>\n`
    html += `<p><strong>Tecnologicos:</strong> ${projetoResult.recursos.tecnologicos.join(', ')}</p>\n`
    html += `<p><strong>Humanos:</strong> ${projetoResult.recursos.humanos.join(', ')}</p>\n`
    html += `<p><strong>Espacos:</strong> ${projetoResult.recursos.espacos.join(', ')}</p>\n\n`

    if (projetoResult.cronograma && projetoResult.cronograma.length > 0) {
      html += `<h2>Cronograma</h2>\n`
      projetoResult.cronograma.forEach((item) => {
        html += `<h3>${item.periodo} - ${item.etapa}</h3>\n`
        html += `<p><strong>Atividades:</strong> ${item.atividades.join('; ')}</p>\n`
        html += `<p><strong>Responsavel:</strong> ${item.responsavel}</p>\n`
      })
      html += '\n'
    }

    html += `<h2>Avaliacao</h2>\n`
    html += `<p><strong>Criterios:</strong> ${projetoResult.avaliacao.criterios.join(', ')}</p>\n`
    html += `<p><strong>Instrumentos:</strong> ${projetoResult.avaliacao.instrumentos.join(', ')}</p>\n`
    html += `<p><strong>Formas de Registro:</strong> ${projetoResult.avaliacao.formasRegistro.join(', ')}</p>\n`
    html += `<p><strong>Autoavaliacao:</strong> ${projetoResult.avaliacao.autoavaliacao}</p>\n\n`

    html += `<h2>Produto Final</h2>\n`
    html += `<p>${projetoResult.produtoFinal.descricao}</p>\n`
    html += `<p><strong>Forma de Apresentacao:</strong> ${projetoResult.produtoFinal.formaApresentacao}</p>\n`
    html += `<p><strong>Publico:</strong> ${projetoResult.produtoFinal.publico}</p>\n\n`

    html += `<h2>Referencias</h2>\n<ul>\n`
    projetoResult.referencias.forEach((ref) => {
      html += `<li>${ref}</li>\n`
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
        <h2 className="text-3xl font-bold text-[#2C3E7D]">Projeto Educacional</h2>
        <p className="mt-2 text-gray-600">
          Desenvolva projetos educacionais completos e interdisciplinares com etapas, cronograma e avaliação.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Projeto</CardTitle>
              <CardDescription>
                Preencha as informações para gerar um projeto educacional completo
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
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

                {/* Título */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Título do Projeto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Sustentabilidade na Nossa Comunidade"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                    required
                  />
                  <p className={`text-sm mt-1 ${tituloLength < 3 || tituloLength > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                    {tituloLength}/200 caracteres
                  </p>
                </div>

                {/* Disciplinas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Disciplinas <span className="text-red-500">*</span>
                    </label>
                    {isInterdisciplinar && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        Projeto Interdisciplinar
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {DISCIPLINAS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDisciplina(d)}
                        className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          formData.disciplinas.includes(d)
                            ? 'bg-[#2C3E7D] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Selecione uma ou mais disciplinas para um projeto interdisciplinar
                  </p>
                </div>

                {/* Ano e Duração */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Duração do Projeto <span className="text-red-500">*</span>
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
                          <SelectItem key={d.id} value={d.id}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tema Gerador */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tema Gerador <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.temaGerador}
                    onChange={(e) => setFormData({ ...formData, temaGerador: e.target.value })}
                    placeholder="Ex: Meio ambiente, Cidadania, Cultura local..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                    required
                  />
                </div>

                {/* Justificativa */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Justificativa (opcional)
                  </label>
                  <textarea
                    value={formData.justificativa}
                    onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
                    placeholder="Por que este projeto é relevante para seus alunos?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>

                {/* Objetivo Geral */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Objetivo Geral (opcional)
                  </label>
                  <textarea
                    value={formData.objetivoGeral}
                    onChange={(e) => setFormData({ ...formData, objetivoGeral: e.target.value })}
                    placeholder="O que você espera que os alunos alcancem com este projeto?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>

                {/* Público-Alvo e Recursos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Público-Alvo Específico (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.publicoAlvo}
                      onChange={(e) => setFormData({ ...formData, publicoAlvo: e.target.value })}
                      placeholder="Ex: Turma do 6º A, 30 alunos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Recursos Disponíveis (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.recursosDisponiveis}
                      onChange={(e) => setFormData({ ...formData, recursosDisponiveis: e.target.value })}
                      placeholder="Ex: Laboratório, projetor, tablets"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="incluirCronograma"
                      checked={formData.incluirCronograma}
                      onChange={(e) => setFormData({ ...formData, incluirCronograma: e.target.checked })}
                      className="w-4 h-4 text-[#2C3E7D] border-gray-300 rounded focus:ring-[#2C3E7D]"
                    />
                    <label htmlFor="incluirCronograma" className="text-sm text-gray-700">
                      Incluir cronograma detalhado
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="incluirAvaliacao"
                      checked={formData.incluirAvaliacao}
                      onChange={(e) => setFormData({ ...formData, incluirAvaliacao: e.target.checked })}
                      className="w-4 h-4 text-[#2C3E7D] border-gray-300 rounded focus:ring-[#2C3E7D]"
                    />
                    <label htmlFor="incluirAvaliacao" className="text-sm text-gray-700">
                      Incluir avaliação detalhada
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
                    tituloLength < 3 ||
                    tituloLength > 200 ||
                    formData.disciplinas.length === 0 ||
                    !formData.ano ||
                    !formData.duracao ||
                    formData.temaGerador.length < 3
                  }
                >
                  Gerar Projeto ({CREDIT_COST} créditos)
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
              <CardTitle className="text-base">O que é um Projeto Educacional?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Um projeto educacional é uma proposta pedagógica estruturada que integra
                conhecimentos de forma significativa, com etapas claras e um produto final.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Pode ser interdisciplinar</li>
                <li>• Etapas progressivas com produtos</li>
                <li>• Protagonismo do aluno</li>
                <li>• Produto final apresentável</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dicas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Escolha um tema relevante para os alunos</li>
                <li>• Projetos interdisciplinares enriquecem a aprendizagem</li>
                <li>• Defina um produto final significativo</li>
                <li>• Envolva a comunidade escolar</li>
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
                      {result.identificacao.disciplinas.map((d, i) => (
                        <span key={i} className="px-2 py-1 bg-[#2C3E7D]/10 text-[#2C3E7D] rounded text-xs">
                          {d}
                        </span>
                      ))}
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {result.identificacao.duracao}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
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
                    onClick={copyProjeto}
                  >
                    Copiar Projeto
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Apresentação */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('apresentacao')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Apresentação</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('apresentacao') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('apresentacao') && (
                  <div className="p-4 space-y-4">
                    <div className="bg-[#FDB913]/10 rounded-lg p-4">
                      <p className="text-sm font-medium text-[#2C3E7D] mb-1">Tema Gerador</p>
                      <p className="text-gray-700">{result.apresentacao.temaGerador}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Justificativa</p>
                      <p className="text-gray-600 text-sm whitespace-pre-line">{result.apresentacao.justificativa}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-800 mb-1">Questão Problematizadora</p>
                      <p className="text-blue-700 italic">{result.apresentacao.problematizacao}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* Objetivos */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('objetivos')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Objetivos</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('objetivos') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('objetivos') && (
                  <div className="p-4 space-y-4">
                    <div className="bg-[#2C3E7D]/5 rounded-lg p-4">
                      <p className="text-sm font-medium text-[#2C3E7D] mb-1">Objetivo Geral</p>
                      <p className="text-gray-700">{result.objetivos.geral}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Objetivos Específicos</p>
                      <ul className="space-y-2">
                        {result.objetivos.especificos.map((obj, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="flex-shrink-0 w-5 h-5 bg-[#2C3E7D] text-white rounded-full flex items-center justify-center text-xs">
                              {i + 1}
                            </span>
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </section>

              {/* Fundamentação Teórica */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('fundamentacao')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Fundamentação Teórica</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('fundamentacao') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('fundamentacao') && (
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Conceitos-Chave</p>
                      <div className="flex flex-wrap gap-2">
                        {result.fundamentacaoTeorica.conceitos.map((c, i) => (
                          <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Autores de Referência</p>
                      <ul className="space-y-1">
                        {result.fundamentacaoTeorica.autoresReferencia.map((a, i) => (
                          <li key={i} className="text-sm text-gray-600">• {a}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Competências BNCC</p>
                        <div className="flex flex-wrap gap-2">
                          {result.fundamentacaoTeorica.conexaoBncc.competencias.map((c, i) => (
                            <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Habilidades BNCC</p>
                        <div className="flex flex-wrap gap-2">
                          {result.fundamentacaoTeorica.conexaoBncc.habilidades.map((h, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Metodologia */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('metodologia')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Metodologia</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('metodologia') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('metodologia') && (
                  <div className="p-4 space-y-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-purple-800 mb-1">Abordagem</p>
                      <p className="text-purple-700">{result.metodologia.abordagem}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Estratégias</p>
                      <ul className="space-y-1">
                        {result.metodologia.estrategias.map((e, i) => (
                          <li key={i} className="text-sm text-gray-600">• {e}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Organização da Turma</p>
                      <p className="text-sm text-gray-600">{result.metodologia.organizacaoTurma}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* Etapas */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('etapas')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Etapas do Projeto ({result.etapas.length})</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('etapas') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('etapas') && (
                  <div className="p-4 space-y-3">
                    {result.etapas.map((etapa, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleEtapa(index)}
                          className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 bg-[#2C3E7D] text-white rounded-full text-sm font-bold">
                              {etapa.numero}
                            </span>
                            <div>
                              <span className="font-medium text-[#2C3E7D]">{etapa.titulo}</span>
                              <p className="text-xs text-gray-500">{etapa.duracao}</p>
                            </div>
                          </div>
                          <span className="text-gray-400">
                            {expandedEtapas.includes(index) ? '▲' : '▼'}
                          </span>
                        </button>

                        {expandedEtapas.includes(index) && (
                          <div className="p-4 space-y-4 border-t border-gray-100">
                            <p className="text-gray-700 text-sm">{etapa.descricao}</p>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Atividades</p>
                              <ul className="space-y-1">
                                {etapa.atividades.map((a, i) => (
                                  <li key={i} className="text-sm text-gray-600">• {a}</li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Recursos</p>
                              <div className="flex flex-wrap gap-2">
                                {etapa.recursos.map((r, i) => (
                                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="bg-green-50 rounded-lg p-3">
                              <p className="text-sm font-medium text-green-800 mb-1">Produto Esperado</p>
                              <p className="text-green-700 text-sm">{etapa.produtoEsperado}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Recursos */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('recursos')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Recursos</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('recursos') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('recursos') && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-orange-800 mb-2">Materiais</p>
                        <div className="flex flex-wrap gap-1">
                          {result.recursos.materiais.map((m, i) => (
                            <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-purple-800 mb-2">Tecnológicos</p>
                        <div className="flex flex-wrap gap-1">
                          {result.recursos.tecnologicos.map((t, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-800 mb-2">Humanos</p>
                        <div className="flex flex-wrap gap-1">
                          {result.recursos.humanos.map((h, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-teal-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-teal-800 mb-2">Espaços</p>
                        <div className="flex flex-wrap gap-1">
                          {result.recursos.espacos.map((e, i) => (
                            <span key={i} className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Cronograma */}
              {result.cronograma && result.cronograma.length > 0 && (
                <section className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('cronograma')}
                    className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                  >
                    <span className="font-semibold text-[#2C3E7D]">Cronograma</span>
                    <span className="text-gray-400">
                      {expandedSections.includes('cronograma') ? '▲' : '▼'}
                    </span>
                  </button>
                  {expandedSections.includes('cronograma') && (
                    <div className="p-4">
                      <div className="space-y-3">
                        {result.cronograma.map((item, i) => (
                          <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-lg p-3">
                            <div className="flex-shrink-0 text-center">
                              <span className="inline-block px-3 py-1 bg-[#2C3E7D] text-white text-xs font-bold rounded">
                                {item.periodo}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-[#2C3E7D] text-sm">{item.etapa}</p>
                              <p className="text-sm text-gray-600 mt-1">{item.atividades.join('; ')}</p>
                              <p className="text-xs text-gray-500 mt-1">Responsável: {item.responsavel}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Avaliação */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('avaliacao')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Avaliação</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('avaliacao') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('avaliacao') && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Critérios</p>
                        <ul className="space-y-1">
                          {result.avaliacao.criterios.map((c, i) => (
                            <li key={i} className="text-sm text-gray-600">• {c}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Instrumentos</p>
                        <div className="flex flex-wrap gap-2">
                          {result.avaliacao.instrumentos.map((i, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {i}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Formas de Registro</p>
                        <div className="flex flex-wrap gap-2">
                          {result.avaliacao.formasRegistro.map((f, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Autoavaliação</p>
                        <p className="text-sm text-gray-600">{result.avaliacao.autoavaliacao}</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Produto Final */}
              <section className="bg-[#FDB913]/10 rounded-lg p-4">
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Produto Final</h4>
                <div className="space-y-3">
                  <p className="text-gray-700">{result.produtoFinal.descricao}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Forma de Apresentação: </span>
                      <span className="text-gray-700">{result.produtoFinal.formaApresentacao}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Público: </span>
                      <span className="text-gray-700">{result.produtoFinal.publico}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Referências */}
              <section className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Referências</h4>
                <ul className="space-y-1">
                  {result.referencias.map((ref, i) => (
                    <li key={i} className="text-sm text-gray-600">• {ref}</li>
                  ))}
                </ul>
              </section>

              {/* Metadados */}
              <section className="border-t border-gray-200 pt-4">
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span><strong>Interdisciplinaridade:</strong> {result.metadados.interdisciplinaridade}</span>
                  <span>•</span>
                  <span><strong>Tempo de Preparação:</strong> {result.metadados.tempoPreparacaoEstimado}</span>
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
        title="Editar Projeto Educacional"
      />
    </div>
  )
}
