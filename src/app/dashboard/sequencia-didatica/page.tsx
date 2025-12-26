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
import type { SequenciaDidaticaOutput } from '@/lib/gemini'
import { exportSequenciaDidaticaToPDF, exportSequenciaDidaticaToDOCX } from '@/lib/export'
import { EditContentModal } from '@/components/dashboard/edit-content-modal'
import { ModeSelector, type GenerationMode } from '@/components/dashboard/mode-selector'

const CREDIT_COST = 8

const NUMERO_AULAS = [
  { id: '3', label: '3 aulas' },
  { id: '4', label: '4 aulas' },
  { id: '5', label: '5 aulas' },
  { id: '6', label: '6 aulas' },
  { id: '7', label: '7 aulas' },
  { id: '8', label: '8 aulas' },
]

const DURACAO_AULA = [
  { id: '50min', label: '50 minutos (1 período)' },
  { id: '100min', label: '100 minutos (2 períodos)' },
  { id: '150min', label: '150 minutos (3 períodos)' },
  { id: 'flexivel', label: 'Flexível (definir por aula)' },
]

const METODOLOGIAS = [
  { id: 'tradicional', label: 'Tradicional' },
  { id: 'ativa', label: 'Metodologias Ativas' },
  { id: 'hibrida', label: 'Híbrida' },
  { id: 'gamificada', label: 'Gamificada' },
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
  numeroAulas: number
  duracaoAula: string
  metodologiaPreferida: string
  objetivoGeral: string
  codigoBncc: string
  contexto: string
  incluirAvaliacao: boolean
}

export default function SequenciaDidaticaPage() {
  const { dbUser, institution } = useAuth()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<GenerationMode>('personalizado')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SequenciaDidaticaOutput | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [expandedAulas, setExpandedAulas] = useState<number[]>([0])
  const [formData, setFormData] = useState<FormData>({
    disciplina: '',
    ano: '',
    tema: '',
    numeroAulas: 5,
    duracaoAula: '',
    metodologiaPreferida: '',
    objetivoGeral: '',
    codigoBncc: '',
    contexto: '',
    incluirAvaliacao: true,
  })

  const toggleAula = (index: number) => {
    setExpandedAulas(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const expandAllAulas = () => {
    if (result) {
      setExpandedAulas(result.aulas.map((_, i) => i))
    }
  }

  const collapseAllAulas = () => {
    setExpandedAulas([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setExpandedAulas([0])
    setLoading(true)

    try {
      const response = await fetch('/api/generate/sequencia-didatica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar sequência didática')
      }

      setResult(data.output as SequenciaDidaticaOutput)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const copyAula = (aula: SequenciaDidaticaOutput['aulas'][0]) => {
    let text = `AULA ${aula.numero}: ${aula.titulo}\n\n`
    text += `Objetivos:\n${aula.objetivos.map(o => `- ${o}`).join('\n')}\n\n`
    text += `Conteúdos:\n${aula.conteudos.map(c => `- ${c}`).join('\n')}\n\n`
    text += `Metodologia:\n${aula.metodologia}\n\n`
    text += `Recursos:\n${aula.recursos.map(r => `- ${r}`).join('\n')}\n\n`
    text += `Atividades:\n`
    aula.atividades.forEach((a, i) => {
      text += `${i + 1}. ${a.descricao} (${a.duracao} - ${a.tipo})\n`
    })
    text += `\nAvaliação Formativa:\n${aula.avaliacaoFormativa}\n\n`
    text += `Conexão com Próxima Aula:\n${aula.conexaoProximaAula}`

    navigator.clipboard.writeText(text)
  }

  const copyAllSequencia = () => {
    if (!result) return

    let fullText = `${result.titulo}\n\n`
    fullText += `APRESENTAÇÃO\n${result.apresentacao}\n\n`
    fullText += `${'='.repeat(60)}\n\n`

    fullText += `OBJETIVO GERAL:\n${result.objetivoGeral}\n\n`
    fullText += `OBJETIVOS ESPECÍFICOS:\n${result.objetivosEspecificos.map(o => `• ${o}`).join('\n')}\n\n`
    fullText += `PÚBLICO-ALVO: ${result.publicoAlvo}\n\n`
    fullText += `DURAÇÃO: ${result.duracao.totalAulas} aulas de ${result.duracao.duracaoPorAula} (${result.duracao.cargaHorariaTotal})\n\n`

    fullText += `${'='.repeat(60)}\n\n`

    result.aulas.forEach(aula => {
      fullText += `AULA ${aula.numero}: ${aula.titulo}\n`
      fullText += `-`.repeat(40) + '\n\n'
      fullText += `Objetivos:\n${aula.objetivos.map(o => `• ${o}`).join('\n')}\n\n`
      fullText += `Conteúdos:\n${aula.conteudos.map(c => `• ${c}`).join('\n')}\n\n`
      fullText += `Metodologia: ${aula.metodologia}\n\n`
      fullText += `Recursos: ${aula.recursos.join(', ')}\n\n`
      fullText += `Atividades:\n`
      aula.atividades.forEach((a, i) => {
        fullText += `${i + 1}. ${a.descricao} (${a.duracao} - ${a.tipo})\n`
      })
      fullText += `\nAvaliação: ${aula.avaliacaoFormativa}\n`
      fullText += `Conexão: ${aula.conexaoProximaAula}\n\n`
      fullText += `${'='.repeat(60)}\n\n`
    })

    fullText += `AVALIAÇÃO FINAL:\n`
    fullText += `Critérios: ${result.avaliacaoFinal.criterios.join(', ')}\n`
    fullText += `Instrumentos: ${result.avaliacaoFinal.instrumentos.join(', ')}\n`
    fullText += `Sugestões: ${result.avaliacaoFinal.sugestoes}\n\n`

    fullText += `RECURSOS GERAIS:\n`
    fullText += `Materiais: ${result.recursos.materiais.join(', ')}\n`
    fullText += `Tecnológicos: ${result.recursos.tecnologicos.join(', ')}\n`
    fullText += `Espaços: ${result.recursos.espacos.join(', ')}\n\n`

    fullText += `ALINHAMENTO BNCC:\n`
    fullText += `Competências: ${result.alinhamentoBncc.competenciasGerais.join(', ')}\n`
    fullText += `Habilidades: ${result.alinhamentoBncc.habilidades.join(', ')}\n`
    fullText += `Observações: ${result.alinhamentoBncc.observacoes}\n\n`

    fullText += `REFERÊNCIAS:\n${result.referencias.map(r => `• ${r}`).join('\n')}`

    navigator.clipboard.writeText(fullText)
  }

  const creditsAvailable = dbUser?.credits ?? 0
  const canGenerate = true // creditsAvailable >= CREDIT_COST
  const temaLength = formData.tema.length

  const handleExportPDF = async () => {
    if (!result) return
    setExporting(true)
    try {
      await exportSequenciaDidaticaToPDF(result)
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
      await exportSequenciaDidaticaToDOCX(result)
    } catch (err) {
      console.error('Erro ao exportar DOCX:', err)
    } finally {
      setExporting(false)
    }
  }

  // Converter resultado para HTML editavel
  const convertToEditableHTML = (sequenciaResult: SequenciaDidaticaOutput): string => {
    let html = `<h1>${sequenciaResult.titulo}</h1>\n\n`
    html += `<h2>Apresentacao</h2>\n`
    html += `<p>${sequenciaResult.apresentacao}</p>\n\n`

    html += `<h2>Objetivo Geral</h2>\n`
    html += `<p>${sequenciaResult.objetivoGeral}</p>\n\n`

    html += `<h2>Objetivos Especificos</h2>\n<ul>\n`
    sequenciaResult.objetivosEspecificos.forEach((obj) => {
      html += `<li>${obj}</li>\n`
    })
    html += `</ul>\n\n`

    html += `<h2>Informacoes</h2>\n`
    html += `<p><strong>Publico-Alvo:</strong> ${sequenciaResult.publicoAlvo}</p>\n`
    html += `<p><strong>Duracao:</strong> ${sequenciaResult.duracao.totalAulas} aulas de ${sequenciaResult.duracao.duracaoPorAula} (${sequenciaResult.duracao.cargaHorariaTotal})</p>\n\n`

    sequenciaResult.aulas.forEach((aula) => {
      html += `<h2>Aula ${aula.numero}: ${aula.titulo}</h2>\n`
      html += `<h3>Objetivos</h3>\n<ul>\n`
      aula.objetivos.forEach((obj) => {
        html += `<li>${obj}</li>\n`
      })
      html += `</ul>\n`

      html += `<h3>Conteudos</h3>\n<ul>\n`
      aula.conteudos.forEach((cont) => {
        html += `<li>${cont}</li>\n`
      })
      html += `</ul>\n`

      html += `<h3>Metodologia</h3>\n`
      html += `<p>${aula.metodologia}</p>\n`

      html += `<h3>Recursos</h3>\n<ul>\n`
      aula.recursos.forEach((rec) => {
        html += `<li>${rec}</li>\n`
      })
      html += `</ul>\n`

      html += `<h3>Atividades</h3>\n<ol>\n`
      aula.atividades.forEach((ativ) => {
        html += `<li>${ativ.descricao} (${ativ.duracao} - ${ativ.tipo})</li>\n`
      })
      html += `</ol>\n`

      html += `<p><strong>Avaliacao Formativa:</strong> ${aula.avaliacaoFormativa}</p>\n`
      html += `<p><strong>Conexao com Proxima Aula:</strong> ${aula.conexaoProximaAula}</p>\n\n`
    })

    html += `<h2>Avaliacao Final</h2>\n`
    html += `<h3>Criterios</h3>\n<ul>\n`
    sequenciaResult.avaliacaoFinal.criterios.forEach((c) => {
      html += `<li>${c}</li>\n`
    })
    html += `</ul>\n`
    html += `<h3>Instrumentos</h3>\n<ul>\n`
    sequenciaResult.avaliacaoFinal.instrumentos.forEach((i) => {
      html += `<li>${i}</li>\n`
    })
    html += `</ul>\n`
    html += `<p><strong>Sugestoes:</strong> ${sequenciaResult.avaliacaoFinal.sugestoes}</p>\n\n`

    html += `<h2>Alinhamento BNCC</h2>\n`
    html += `<p><strong>Competencias:</strong> ${sequenciaResult.alinhamentoBncc.competenciasGerais.join(', ')}</p>\n`
    html += `<p><strong>Habilidades:</strong> ${sequenciaResult.alinhamentoBncc.habilidades.join(', ')}</p>\n`
    html += `<p>${sequenciaResult.alinhamentoBncc.observacoes}</p>\n\n`

    html += `<h2>Referencias</h2>\n<ul>\n`
    sequenciaResult.referencias.forEach((ref) => {
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
        <h2 className="text-3xl font-bold text-[#2C3E7D]">Sequência Didática</h2>
        <p className="mt-2 text-gray-600">
          Desenvolva sequências didáticas estruturadas com múltiplas aulas progressivas alinhadas à BNCC.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Sequência</CardTitle>
              <CardDescription>
                Preencha as informações para gerar uma sequência didática completa
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
                    Tema Central <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tema}
                    onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                    placeholder="Ex: Frações, Segunda Guerra Mundial, Ecossistemas Brasileiros..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                    required
                  />
                  <p className={`text-sm mt-1 ${temaLength < 3 || temaLength > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                    {temaLength}/200 caracteres
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Número de Aulas <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.numeroAulas.toString()}
                      onValueChange={(value) => setFormData({ ...formData, numeroAulas: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {NUMERO_AULAS.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Duração por Aula <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.duracaoAula}
                      onValueChange={(value) => setFormData({ ...formData, duracaoAula: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURACAO_AULA.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Metodologia (opcional)
                    </label>
                    <Select
                      value={formData.metodologiaPreferida}
                      onValueChange={(value) => setFormData({ ...formData, metodologiaPreferida: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Qualquer" />
                      </SelectTrigger>
                      <SelectContent>
                        {METODOLOGIAS.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Objetivo Geral (opcional)
                  </label>
                  <textarea
                    value={formData.objetivoGeral}
                    onChange={(e) => setFormData({ ...formData, objetivoGeral: e.target.value })}
                    placeholder="Descreva o objetivo geral que deseja alcançar com esta sequência..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Contexto Escolar (opcional)
                  </label>
                  <textarea
                    value={formData.contexto}
                    onChange={(e) => setFormData({ ...formData, contexto: e.target.value })}
                    placeholder="Descreva a realidade da sua escola, recursos disponíveis, perfil dos alunos..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent resize-none"
                    rows={2}
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

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="incluirAvaliacao"
                    checked={formData.incluirAvaliacao}
                    onChange={(e) => setFormData({ ...formData, incluirAvaliacao: e.target.checked })}
                    className="w-4 h-4 text-[#2C3E7D] border-gray-300 rounded focus:ring-[#2C3E7D]"
                  />
                  <label htmlFor="incluirAvaliacao" className="text-sm text-gray-700">
                    Incluir avaliação detalhada em cada aula
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
                    temaLength < 3 ||
                    temaLength > 200 ||
                    !formData.disciplina ||
                    !formData.ano ||
                    !formData.duracaoAula
                  }
                >
                  Gerar Sequência ({CREDIT_COST} créditos)
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
              <CardTitle className="text-base">O que é uma Sequência Didática?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Uma sequência didática é um conjunto de aulas planejadas de forma progressiva,
                onde cada aula se conecta à anterior e prepara para a próxima.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Progressão clara de complexidade</li>
                <li>• Conexões lógicas entre aulas</li>
                <li>• Avaliação formativa contínua</li>
                <li>• Alinhamento completo com BNCC</li>
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
                        {result.publicoAlvo}
                      </span>
                      <span className="px-2 py-1 bg-[#FDB913]/20 text-[#2C3E7D] rounded text-xs">
                        {result.duracao.totalAulas} aulas
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {result.duracao.cargaHorariaTotal}
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
                    onClick={copyAllSequencia}
                  >
                    Copiar Tudo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Apresentação */}
              <section>
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Apresentação</h4>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-line">{result.apresentacao}</p>
                </div>
              </section>

              {/* Objetivos */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-[#2C3E7D] mb-3">Objetivo Geral</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{result.objetivoGeral}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-[#2C3E7D] mb-3">Objetivos Específicos</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="list-disc list-inside space-y-1">
                      {result.objetivosEspecificos.map((obj, i) => (
                        <li key={i} className="text-gray-700 text-sm">{obj}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Aulas */}
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-[#2C3E7D]">Aulas da Sequência</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={expandAllAulas}>
                      Expandir Todas
                    </Button>
                    <Button variant="outline" size="sm" onClick={collapseAllAulas}>
                      Recolher Todas
                    </Button>
                  </div>
                </div>

                {/* Timeline visual */}
                <div className="relative mb-4">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#2C3E7D]/20"></div>
                  <div className="flex justify-between px-4">
                    {result.aulas.map((aula, index) => (
                      <div
                        key={index}
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          expandedAulas.includes(index)
                            ? 'bg-[#2C3E7D] text-white'
                            : 'bg-[#2C3E7D]/20 text-[#2C3E7D]'
                        }`}
                      >
                        {aula.numero}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {result.aulas.map((aula, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleAula(index)}
                        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-10 h-10 bg-[#2C3E7D] text-white rounded-full text-sm font-bold">
                            {aula.numero}
                          </span>
                          <div>
                            <span className="font-medium text-[#2C3E7D]">{aula.titulo}</span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {aula.conteudos.slice(0, 2).join(' • ')}
                            </p>
                          </div>
                        </div>
                        <span className="text-gray-400">
                          {expandedAulas.includes(index) ? '▲' : '▼'}
                        </span>
                      </button>

                      {expandedAulas.includes(index) && (
                        <div className="p-4 space-y-4 border-t border-gray-100">
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyAula(aula)}
                            >
                              Copiar Aula
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Objetivos</p>
                              <ul className="list-disc list-inside space-y-1">
                                {aula.objetivos.map((obj, i) => (
                                  <li key={i} className="text-gray-600 text-sm">{obj}</li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Conteúdos</p>
                              <div className="flex flex-wrap gap-2">
                                {aula.conteudos.map((cont, i) => (
                                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {cont}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Metodologia</p>
                            <p className="text-gray-600 text-sm">{aula.metodologia}</p>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Recursos</p>
                            <div className="flex flex-wrap gap-2">
                              {aula.recursos.map((rec, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                  {rec}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Atividades</p>
                            <div className="space-y-2">
                              {aula.atividades.map((ativ, i) => (
                                <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                                  <span className="flex-shrink-0 w-6 h-6 bg-[#2C3E7D]/10 text-[#2C3E7D] rounded-full flex items-center justify-center text-xs font-bold">
                                    {i + 1}
                                  </span>
                                  <div>
                                    <p className="text-gray-700 text-sm">{ativ.descricao}</p>
                                    <div className="flex gap-2 mt-1">
                                      <span className="text-xs text-gray-500">{ativ.duracao}</span>
                                      <span className="text-xs text-gray-400">•</span>
                                      <span className="text-xs text-gray-500 capitalize">{ativ.tipo}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                            <div className="bg-green-50 rounded-lg p-3">
                              <p className="text-sm font-medium text-green-800 mb-1">Avaliação Formativa</p>
                              <p className="text-green-700 text-sm">{aula.avaliacaoFormativa}</p>
                            </div>

                            {index < result.aulas.length - 1 && (
                              <div className="bg-[#FDB913]/10 rounded-lg p-3">
                                <p className="text-sm font-medium text-[#2C3E7D] mb-1">Conexão com Próxima Aula</p>
                                <p className="text-[#2C3E7D]/80 text-sm">{aula.conexaoProximaAula}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Avaliação Final */}
              <section className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Avaliação Final</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Critérios</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.avaliacaoFinal.criterios.map((c, i) => (
                        <li key={i} className="text-gray-600 text-sm">{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Instrumentos</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.avaliacaoFinal.instrumentos.map((i, idx) => (
                        <li key={idx} className="text-gray-600 text-sm">{i}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Sugestões</p>
                    <p className="text-gray-600 text-sm">{result.avaliacaoFinal.sugestoes}</p>
                  </div>
                </div>
              </section>

              {/* Recursos */}
              <section className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Recursos Necessários</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Materiais</p>
                    <div className="flex flex-wrap gap-2">
                      {result.recursos.materiais.map((m, i) => (
                        <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Tecnológicos</p>
                    <div className="flex flex-wrap gap-2">
                      {result.recursos.tecnologicos.map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Espaços</p>
                    <div className="flex flex-wrap gap-2">
                      {result.recursos.espacos.map((e, i) => (
                        <span key={i} className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Alinhamento BNCC */}
              <section className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Alinhamento com a BNCC</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Competências Gerais:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.alinhamentoBncc.competenciasGerais.map((comp, i) => (
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

              {/* Referências */}
              <section className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-[#2C3E7D] mb-3">Referências</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.referencias.map((ref, i) => (
                    <li key={i} className="text-gray-600 text-sm">{ref}</li>
                  ))}
                </ul>
              </section>

              {/* Metadados */}
              <section className="border-t border-gray-200 pt-6">
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>Tempo de preparação estimado: {result.metadados.tempoPreparacaoEstimado}</span>
                  <span>•</span>
                  <span>Adaptabilidade: {result.metadados.adaptabilidade}</span>
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
        title="Editar Sequencia Didatica"
      />
    </div>
  )
}
