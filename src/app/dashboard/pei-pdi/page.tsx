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
import type { PeiPdiOutput } from '@/lib/gemini'
import { exportPeiPdiToPDF, exportPeiPdiToDOCX } from '@/lib/export'
import { EditContentModal } from '@/components/dashboard/edit-content-modal'
import { ModeSelector, type GenerationMode } from '@/components/dashboard/mode-selector'

const CREDIT_COST = 10

const TIPOS_PLANO = [
  { id: 'pei', label: 'PEI - Plano Educacional Individualizado' },
  { id: 'pdi', label: 'PDI - Plano de Desenvolvimento Individual' },
]

const PERIODOS_VIGENCIA = [
  { id: '1_bimestre', label: '1 Bimestre' },
  { id: '1_semestre', label: '1 Semestre' },
  { id: '1_ano', label: '1 Ano Letivo' },
]

const AREAS_DESENVOLVIMENTO = [
  { id: 'cognitiva', label: 'Cognitiva' },
  { id: 'linguagem', label: 'Linguagem e Comunicação' },
  { id: 'socioafetiva', label: 'Socioafetiva' },
  { id: 'motora', label: 'Motora' },
  { id: 'autonomia', label: 'Autonomia e Vida Prática' },
  { id: 'academica', label: 'Acadêmica/Escolar' },
  { id: 'sensorial', label: 'Sensorial' },
  { id: 'comportamental', label: 'Comportamental' },
]

const PROFISSIONAIS = [
  { id: 'professor_regente', label: 'Professor Regente' },
  { id: 'professor_aee', label: 'Professor de AEE' },
  { id: 'psicologo', label: 'Psicólogo' },
  { id: 'fonoaudiologo', label: 'Fonoaudiólogo' },
  { id: 'terapeuta_ocupacional', label: 'Terapeuta Ocupacional' },
  { id: 'fisioterapeuta', label: 'Fisioterapeuta' },
  { id: 'pedagogo', label: 'Pedagogo/Coordenador' },
  { id: 'cuidador', label: 'Cuidador/Apoio' },
  { id: 'neurologista', label: 'Neurologista' },
  { id: 'psiquiatra', label: 'Psiquiatra' },
]

const ANOS = [
  'Educação Infantil - Berçário',
  'Educação Infantil - Maternal I',
  'Educação Infantil - Maternal II',
  'Educação Infantil - Pré I',
  'Educação Infantil - Pré II',
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
  nomeAluno: string
  idade: number
  anoEscolar: string
  diagnostico: string
  tipoPlano: string
  areasDesenvolvimento: string[]
  habilidadesAtuais: string
  objetivosFamilia: string
  recursosDisponiveis: string
  profissionaisEnvolvidos: string[]
  periodoVigencia: string
  incluirCronograma: boolean
}

export default function PeiPdiPage() {
  const { dbUser, institution } = useAuth()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<GenerationMode>('personalizado')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PeiPdiOutput | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [expandedSections, setExpandedSections] = useState<string[]>(['perfil', 'objetivos'])
  const [formData, setFormData] = useState<FormData>({
    nomeAluno: '',
    idade: 7,
    anoEscolar: '',
    diagnostico: '',
    tipoPlano: '',
    areasDesenvolvimento: [],
    habilidadesAtuais: '',
    objetivosFamilia: '',
    recursosDisponiveis: '',
    profissionaisEnvolvidos: [],
    periodoVigencia: '',
    incluirCronograma: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const toggleArea = (areaId: string) => {
    setFormData(prev => ({
      ...prev,
      areasDesenvolvimento: prev.areasDesenvolvimento.includes(areaId)
        ? prev.areasDesenvolvimento.filter(a => a !== areaId)
        : [...prev.areasDesenvolvimento, areaId]
    }))
  }

  const toggleProfissional = (profId: string) => {
    setFormData(prev => ({
      ...prev,
      profissionaisEnvolvidos: prev.profissionaisEnvolvidos.includes(profId)
        ? prev.profissionaisEnvolvidos.filter(p => p !== profId)
        : [...prev.profissionaisEnvolvidos, profId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setExpandedSections(['perfil', 'objetivos'])
    setLoading(true)

    // Mapear IDs para labels
    const areasLabels = formData.areasDesenvolvimento.map(
      id => AREAS_DESENVOLVIMENTO.find(a => a.id === id)?.label || id
    )
    const profissionaisLabels = formData.profissionaisEnvolvidos.map(
      id => PROFISSIONAIS.find(p => p.id === id)?.label || id
    )

    try {
      const response = await fetch('/api/generate/pei-pdi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          areasDesenvolvimento: areasLabels,
          profissionaisEnvolvidos: profissionaisLabels,
          mode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar PEI/PDI')
      }

      setResult(data.output as PeiPdiOutput)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const copyPlano = () => {
    if (!result) return

    let fullText = `${result.titulo}\n`
    fullText += `${'='.repeat(60)}\n\n`

    fullText += `DADOS DE IDENTIFICAÇÃO\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Nome: ${result.dadosIdentificacao.nomeAluno}\n`
    fullText += `Idade: ${result.dadosIdentificacao.idade} anos\n`
    fullText += `Ano Escolar: ${result.dadosIdentificacao.anoEscolar}\n`
    fullText += `Diagnóstico: ${result.dadosIdentificacao.diagnostico}\n`
    fullText += `Período de Vigência: ${result.dadosIdentificacao.periodoVigencia}\n`
    fullText += `Data de Elaboração: ${result.dadosIdentificacao.dataElaboracao}\n\n`

    fullText += `PERFIL DO ALUNO\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Potencialidades:\n${result.perfilDoAluno.potencialidades.map(p => `• ${p}`).join('\n')}\n\n`
    fullText += `Interesses:\n${result.perfilDoAluno.interesses.map(i => `• ${i}`).join('\n')}\n\n`
    fullText += `Estilo de Aprendizagem: ${result.perfilDoAluno.estiloAprendizagem}\n\n`
    fullText += `Formas de Expressão:\n${result.perfilDoAluno.formasExpressao.map(f => `• ${f}`).join('\n')}\n\n`
    fullText += `Necessidades Específicas:\n${result.perfilDoAluno.necessidadesEspecificas.map(n => `• ${n}`).join('\n')}\n\n`

    fullText += `AVALIAÇÃO INICIAL\n`
    fullText += `-`.repeat(40) + '\n'
    result.avaliacaoInicial.areasAvaliadas.forEach(area => {
      fullText += `${area.area}:\n`
      fullText += `  Nível Atual: ${area.nivelAtual}\n`
      fullText += `  Observações: ${area.observacoes}\n\n`
    })
    fullText += `Barreiras Identificadas:\n${result.avaliacaoInicial.barreirasIdentificadas.map(b => `• ${b}`).join('\n')}\n\n`
    fullText += `Apoios Necessários:\n${result.avaliacaoInicial.apoiosNecessarios.map(a => `• ${a}`).join('\n')}\n\n`

    fullText += `OBJETIVOS\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Objetivo Geral: ${result.objetivos.objetivoGeral}\n\n`
    fullText += `Objetivos Específicos:\n`
    result.objetivos.objetivosEspecificos.forEach((obj, i) => {
      fullText += `${i + 1}. ${obj.area}\n`
      fullText += `   Objetivo: ${obj.objetivo}\n`
      fullText += `   Indicadores: ${obj.indicadores.join(', ')}\n`
      fullText += `   Prazo: ${obj.prazo}\n\n`
    })

    fullText += `ESTRATÉGIAS DE INTERVENÇÃO\n`
    fullText += `-`.repeat(40) + '\n'
    result.estrategiasIntervencao.forEach(est => {
      fullText += `${est.area}:\n`
      fullText += `  Estratégias: ${est.estrategias.join('; ')}\n`
      fullText += `  Recursos: ${est.recursos.join(', ')}\n`
      fullText += `  Responsável: ${est.responsavel}\n`
      fullText += `  Frequência: ${est.frequencia}\n\n`
    })

    fullText += `ADAPTAÇÕES CURRICULARES\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Metodológicas:\n${result.adaptacoesCurriculares.metodologicas.map(m => `• ${m}`).join('\n')}\n\n`
    fullText += `Avaliativas:\n${result.adaptacoesCurriculares.avaliativas.map(a => `• ${a}`).join('\n')}\n\n`
    fullText += `Materiais:\n${result.adaptacoesCurriculares.materiais.map(m => `• ${m}`).join('\n')}\n\n`
    fullText += `Ambientais:\n${result.adaptacoesCurriculares.ambientais.map(a => `• ${a}`).join('\n')}\n\n`

    if (result.cronograma && result.cronograma.length > 0) {
      fullText += `CRONOGRAMA\n`
      fullText += `-`.repeat(40) + '\n'
      result.cronograma.forEach(item => {
        fullText += `${item.periodo}:\n`
        fullText += `  Ações: ${item.acoes.join('; ')}\n`
        fullText += `  Responsáveis: ${item.responsaveis.join(', ')}\n`
        fullText += `  Avaliação: ${item.avaliacaoPrevista}\n\n`
      })
    }

    fullText += `ACOMPANHAMENTO\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Formas de Registro: ${result.acompanhamento.formasRegistro.join(', ')}\n`
    fullText += `Frequência de Revisão: ${result.acompanhamento.frequenciaRevisao}\n`
    fullText += `Critérios de Avaliação: ${result.acompanhamento.criteriosAvaliacao.join(', ')}\n`
    fullText += `Instrumentos: ${result.acompanhamento.instrumentos.join(', ')}\n\n`

    fullText += `ARTICULAÇÃO COM A FAMÍLIA\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += `Formas de Participação: ${result.articulacaoFamilia.formasParticipacao.join(', ')}\n`
    fullText += `Orientações: ${result.articulacaoFamilia.orientacoes.join('; ')}\n`
    fullText += `Canais de Comunicação: ${result.articulacaoFamilia.canaisComunicacao.join(', ')}\n\n`

    fullText += `EQUIPE RESPONSÁVEL\n`
    fullText += `-`.repeat(40) + '\n'
    result.equipeResponsavel.forEach(prof => {
      fullText += `• ${prof.profissional}: ${prof.papel}\n`
    })

    fullText += `\nOBSERVAÇÕES FINAIS\n`
    fullText += `-`.repeat(40) + '\n'
    fullText += result.observacoesFinais + '\n\n'

    fullText += `Fundamentação Legal: ${result.metadados.fundamentacaoLegal}\n`
    fullText += `Próxima Revisão: ${result.metadados.proximaRevisao}`

    navigator.clipboard.writeText(fullText)
  }

  const creditsAvailable = dbUser?.credits ?? 0
  const canGenerate = true // creditsAvailable >= CREDIT_COST

  const handleExportPDF = async () => {
    if (!result) return
    setExporting(true)
    try {
      await exportPeiPdiToPDF(result)
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
      await exportPeiPdiToDOCX(result)
    } catch (err) {
      console.error('Erro ao exportar DOCX:', err)
    } finally {
      setExporting(false)
    }
  }

  // Converter resultado para HTML editavel
  const convertToEditableHTML = (peiResult: PeiPdiOutput): string => {
    let html = `<h1>${peiResult.titulo}</h1>\n\n`

    html += `<h2>Dados de Identificacao</h2>\n`
    html += `<p><strong>Nome:</strong> ${peiResult.dadosIdentificacao.nomeAluno}</p>\n`
    html += `<p><strong>Idade:</strong> ${peiResult.dadosIdentificacao.idade} anos</p>\n`
    html += `<p><strong>Ano Escolar:</strong> ${peiResult.dadosIdentificacao.anoEscolar}</p>\n`
    html += `<p><strong>Diagnostico:</strong> ${peiResult.dadosIdentificacao.diagnostico}</p>\n`
    html += `<p><strong>Periodo de Vigencia:</strong> ${peiResult.dadosIdentificacao.periodoVigencia}</p>\n\n`

    html += `<h2>Perfil do Aluno</h2>\n`
    html += `<h3>Potencialidades</h3>\n<ul>\n`
    peiResult.perfilDoAluno.potencialidades.forEach((p) => {
      html += `<li>${p}</li>\n`
    })
    html += `</ul>\n`
    html += `<h3>Interesses</h3>\n<ul>\n`
    peiResult.perfilDoAluno.interesses.forEach((i) => {
      html += `<li>${i}</li>\n`
    })
    html += `</ul>\n`
    html += `<p><strong>Estilo de Aprendizagem:</strong> ${peiResult.perfilDoAluno.estiloAprendizagem}</p>\n`
    html += `<h3>Formas de Expressao</h3>\n<ul>\n`
    peiResult.perfilDoAluno.formasExpressao.forEach((f) => {
      html += `<li>${f}</li>\n`
    })
    html += `</ul>\n`
    html += `<h3>Necessidades Especificas</h3>\n<ul>\n`
    peiResult.perfilDoAluno.necessidadesEspecificas.forEach((n) => {
      html += `<li>${n}</li>\n`
    })
    html += `</ul>\n\n`

    html += `<h2>Avaliacao Inicial</h2>\n`
    peiResult.avaliacaoInicial.areasAvaliadas.forEach((area) => {
      html += `<h3>${area.area}</h3>\n`
      html += `<p><strong>Nivel Atual:</strong> ${area.nivelAtual}</p>\n`
      html += `<p><strong>Observacoes:</strong> ${area.observacoes}</p>\n`
    })
    html += `<h3>Barreiras Identificadas</h3>\n<ul>\n`
    peiResult.avaliacaoInicial.barreirasIdentificadas.forEach((b) => {
      html += `<li>${b}</li>\n`
    })
    html += `</ul>\n`
    html += `<h3>Apoios Necessarios</h3>\n<ul>\n`
    peiResult.avaliacaoInicial.apoiosNecessarios.forEach((a) => {
      html += `<li>${a}</li>\n`
    })
    html += `</ul>\n\n`

    html += `<h2>Objetivos</h2>\n`
    html += `<p><strong>Objetivo Geral:</strong> ${peiResult.objetivos.objetivoGeral}</p>\n`
    html += `<h3>Objetivos Especificos</h3>\n`
    peiResult.objetivos.objetivosEspecificos.forEach((obj, i) => {
      html += `<h4>${i + 1}. ${obj.area}</h4>\n`
      html += `<p><strong>Objetivo:</strong> ${obj.objetivo}</p>\n`
      html += `<p><strong>Indicadores:</strong> ${obj.indicadores.join(', ')}</p>\n`
      html += `<p><strong>Prazo:</strong> ${obj.prazo}</p>\n`
    })
    html += '\n'

    html += `<h2>Estrategias de Intervencao</h2>\n`
    peiResult.estrategiasIntervencao.forEach((est) => {
      html += `<h3>${est.area}</h3>\n`
      html += `<p><strong>Estrategias:</strong> ${est.estrategias.join('; ')}</p>\n`
      html += `<p><strong>Recursos:</strong> ${est.recursos.join(', ')}</p>\n`
      html += `<p><strong>Responsavel:</strong> ${est.responsavel}</p>\n`
      html += `<p><strong>Frequencia:</strong> ${est.frequencia}</p>\n`
    })
    html += '\n'

    html += `<h2>Adaptacoes Curriculares</h2>\n`
    html += `<h3>Metodologicas</h3>\n<ul>\n`
    peiResult.adaptacoesCurriculares.metodologicas.forEach((m) => {
      html += `<li>${m}</li>\n`
    })
    html += `</ul>\n`
    html += `<h3>Avaliativas</h3>\n<ul>\n`
    peiResult.adaptacoesCurriculares.avaliativas.forEach((a) => {
      html += `<li>${a}</li>\n`
    })
    html += `</ul>\n`
    html += `<h3>Materiais</h3>\n<ul>\n`
    peiResult.adaptacoesCurriculares.materiais.forEach((m) => {
      html += `<li>${m}</li>\n`
    })
    html += `</ul>\n`
    html += `<h3>Ambientais</h3>\n<ul>\n`
    peiResult.adaptacoesCurriculares.ambientais.forEach((a) => {
      html += `<li>${a}</li>\n`
    })
    html += `</ul>\n\n`

    if (peiResult.cronograma && peiResult.cronograma.length > 0) {
      html += `<h2>Cronograma</h2>\n`
      peiResult.cronograma.forEach((item) => {
        html += `<h3>${item.periodo}</h3>\n`
        html += `<p><strong>Acoes:</strong> ${item.acoes.join('; ')}</p>\n`
        html += `<p><strong>Responsaveis:</strong> ${item.responsaveis.join(', ')}</p>\n`
        html += `<p><strong>Avaliacao Prevista:</strong> ${item.avaliacaoPrevista}</p>\n`
      })
      html += '\n'
    }

    html += `<h2>Acompanhamento</h2>\n`
    html += `<p><strong>Formas de Registro:</strong> ${peiResult.acompanhamento.formasRegistro.join(', ')}</p>\n`
    html += `<p><strong>Frequencia de Revisao:</strong> ${peiResult.acompanhamento.frequenciaRevisao}</p>\n`
    html += `<p><strong>Criterios de Avaliacao:</strong> ${peiResult.acompanhamento.criteriosAvaliacao.join(', ')}</p>\n`
    html += `<p><strong>Instrumentos:</strong> ${peiResult.acompanhamento.instrumentos.join(', ')}</p>\n\n`

    html += `<h2>Articulacao com a Familia</h2>\n`
    html += `<p><strong>Formas de Participacao:</strong> ${peiResult.articulacaoFamilia.formasParticipacao.join(', ')}</p>\n`
    html += `<p><strong>Orientacoes:</strong> ${peiResult.articulacaoFamilia.orientacoes.join('; ')}</p>\n`
    html += `<p><strong>Canais de Comunicacao:</strong> ${peiResult.articulacaoFamilia.canaisComunicacao.join(', ')}</p>\n\n`

    html += `<h2>Equipe Responsavel</h2>\n<ul>\n`
    peiResult.equipeResponsavel.forEach((prof) => {
      html += `<li><strong>${prof.profissional}:</strong> ${prof.papel}</li>\n`
    })
    html += `</ul>\n\n`

    html += `<h2>Observacoes Finais</h2>\n`
    html += `<p>${peiResult.observacoesFinais}</p>\n`

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
        <h2 className="text-3xl font-bold text-[#2C3E7D]">PEI / PDI</h2>
        <p className="mt-2 text-gray-600">
          Crie Planos Educacionais Individualizados para educação inclusiva, respeitando as potencialidades de cada aluno.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Plano</CardTitle>
              <CardDescription>
                Preencha as informações do aluno para gerar o plano individualizado
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

                {/* Dados do Aluno */}
                <div className="space-y-4">
                  <h4 className="font-medium text-[#2C3E7D] border-b pb-2">Dados do Aluno</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Nome do Aluno <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nomeAluno}
                        onChange={(e) => setFormData({ ...formData, nomeAluno: e.target.value })}
                        placeholder="Nome completo ou primeiro nome"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Idade <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={formData.idade}
                        onChange={(e) => setFormData({ ...formData, idade: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Ano Escolar <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.anoEscolar}
                        onValueChange={(value) => setFormData({ ...formData, anoEscolar: value })}
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
                        Tipo de Plano <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.tipoPlano}
                        onValueChange={(value) => setFormData({ ...formData, tipoPlano: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_PLANO.map((t) => (
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
                      Diagnóstico / Condição <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.diagnostico}
                      onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                      placeholder="Ex: TEA nível 1, TDAH, Deficiência Intelectual, Síndrome de Down..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Esta informação é usada apenas para personalizar as estratégias pedagógicas
                    </p>
                  </div>
                </div>

                {/* Áreas de Desenvolvimento */}
                <div className="space-y-4">
                  <h4 className="font-medium text-[#2C3E7D] border-b pb-2">
                    Áreas de Desenvolvimento Prioritárias <span className="text-red-500">*</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {AREAS_DESENVOLVIMENTO.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => toggleArea(area.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.areasDesenvolvimento.includes(area.id)
                            ? 'bg-[#2C3E7D] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {area.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Selecione as áreas que serão foco do plano (mínimo 1)
                  </p>
                </div>

                {/* Habilidades Atuais */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Habilidades Atuais do Aluno <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.habilidadesAtuais}
                    onChange={(e) => setFormData({ ...formData, habilidadesAtuais: e.target.value })}
                    placeholder="Descreva o que o aluno já consegue fazer: reconhece letras, conta até 10, interage com colegas, mantém contato visual, segue rotinas..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent resize-none"
                    rows={3}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Foque nas potencialidades e no que o aluno demonstra saber fazer
                  </p>
                </div>

                {/* Objetivos da Família */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Objetivos e Expectativas da Família (opcional)
                  </label>
                  <textarea
                    value={formData.objetivosFamilia}
                    onChange={(e) => setFormData({ ...formData, objetivosFamilia: e.target.value })}
                    placeholder="O que a família espera do processo educacional? Quais habilidades gostariam de ver desenvolvidas?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>

                {/* Recursos Disponíveis */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Recursos Disponíveis na Escola (opcional)
                  </label>
                  <textarea
                    value={formData.recursosDisponiveis}
                    onChange={(e) => setFormData({ ...formData, recursosDisponiveis: e.target.value })}
                    placeholder="Ex: Sala de recursos, materiais adaptados, tecnologia assistiva, profissional de apoio..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C3E7D] focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>

                {/* Profissionais Envolvidos */}
                <div className="space-y-4">
                  <h4 className="font-medium text-[#2C3E7D] border-b pb-2">
                    Profissionais Envolvidos (opcional)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {PROFISSIONAIS.map((prof) => (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => toggleProfissional(prof.id)}
                        className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          formData.profissionaisEnvolvidos.includes(prof.id)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {prof.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Período e Cronograma */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Período de Vigência <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.periodoVigencia}
                      onValueChange={(value) => setFormData({ ...formData, periodoVigencia: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODOS_VIGENCIA.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 pt-7">
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
                    !formData.nomeAluno ||
                    !formData.anoEscolar ||
                    !formData.diagnostico ||
                    !formData.tipoPlano ||
                    formData.areasDesenvolvimento.length === 0 ||
                    formData.habilidadesAtuais.length < 10 ||
                    !formData.periodoVigencia
                  }
                >
                  Gerar Plano ({CREDIT_COST} créditos)
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
              <CardTitle className="text-base">Sobre PEI e PDI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[#2C3E7D]">PEI</p>
                <p className="text-xs text-gray-600">
                  Plano Educacional Individualizado - foco nas adaptações curriculares e estratégias pedagógicas.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#2C3E7D]">PDI</p>
                <p className="text-xs text-gray-600">
                  Plano de Desenvolvimento Individual - visão mais ampla incluindo aspectos sociais e de autonomia.
                </p>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Ambos são documentos fundamentais para garantir uma educação inclusiva de qualidade.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dicas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Foque nas potencialidades, não nas limitações</li>
                <li>• Inclua a família no processo</li>
                <li>• Revise o plano periodicamente</li>
                <li>• Adapte conforme a evolução do aluno</li>
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
                        {result.metadados.tipoPlano}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {result.dadosIdentificacao.periodoVigencia}
                      </span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                        {result.dadosIdentificacao.idade} anos
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        {result.dadosIdentificacao.anoEscolar}
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
                    onClick={copyPlano}
                  >
                    Copiar Plano
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Perfil do Aluno */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('perfil')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Perfil do Aluno</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('perfil') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('perfil') && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Potencialidades</p>
                        <ul className="space-y-1">
                          {result.perfilDoAluno.potencialidades.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-green-500">✓</span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Interesses</p>
                        <div className="flex flex-wrap gap-2">
                          {result.perfilDoAluno.interesses.map((i, idx) => (
                            <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              {i}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Estilo de Aprendizagem</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {result.perfilDoAluno.estiloAprendizagem}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Formas de Expressão</p>
                        <div className="flex flex-wrap gap-2">
                          {result.perfilDoAluno.formasExpressao.map((f, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Necessidades Específicas</p>
                        <ul className="space-y-1">
                          {result.perfilDoAluno.necessidadesEspecificas.map((n, i) => (
                            <li key={i} className="text-sm text-gray-600">• {n}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Avaliação Inicial */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('avaliacao')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Avaliação Inicial</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('avaliacao') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('avaliacao') && (
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Áreas Avaliadas</p>
                      <div className="space-y-3">
                        {result.avaliacaoInicial.areasAvaliadas.map((area, i) => (
                          <div key={i} className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium text-[#2C3E7D] text-sm">{area.area}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Nível atual:</strong> {area.nivelAtual}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              <strong>Obs:</strong> {area.observacoes}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-800 mb-2">Barreiras Identificadas</p>
                        <ul className="space-y-1">
                          {result.avaliacaoInicial.barreirasIdentificadas.map((b, i) => (
                            <li key={i} className="text-sm text-red-700">• {b}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-green-800 mb-2">Apoios Necessários</p>
                        <ul className="space-y-1">
                          {result.avaliacaoInicial.apoiosNecessarios.map((a, i) => (
                            <li key={i} className="text-sm text-green-700">• {a}</li>
                          ))}
                        </ul>
                      </div>
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
                      <p className="text-gray-700">{result.objetivos.objetivoGeral}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">Objetivos Específicos</p>
                      <div className="space-y-3">
                        {result.objetivos.objetivosEspecificos.map((obj, i) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-8 h-8 bg-[#2C3E7D] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {i + 1}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-[#2C3E7D]">{obj.area}</p>
                                <p className="text-sm text-gray-700 mt-1">{obj.objetivo}</p>
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-500">Indicadores:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {obj.indicadores.map((ind, idx) => (
                                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                        {ind}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Prazo: {obj.prazo}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Estratégias de Intervenção */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('estrategias')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Estratégias de Intervenção</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('estrategias') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('estrategias') && (
                  <div className="p-4 space-y-4">
                    {result.estrategiasIntervencao.map((est, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-[#2C3E7D] mb-3">{est.area}</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-gray-500">Estratégias:</p>
                            <ul className="mt-1 space-y-1">
                              {est.estrategias.map((e, idx) => (
                                <li key={idx} className="text-sm text-gray-700">• {e}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Recursos: </span>
                              <span className="text-gray-700">{est.recursos.join(', ')}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Responsável: </span>
                              <span className="text-gray-700">{est.responsavel}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Frequência: </span>
                              <span className="text-gray-700">{est.frequencia}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Adaptações Curriculares */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('adaptacoes')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Adaptações Curriculares</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('adaptacoes') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('adaptacoes') && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-800 mb-2">Metodológicas</p>
                        <ul className="space-y-1">
                          {result.adaptacoesCurriculares.metodologicas.map((m, i) => (
                            <li key={i} className="text-sm text-blue-700">• {m}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-purple-800 mb-2">Avaliativas</p>
                        <ul className="space-y-1">
                          {result.adaptacoesCurriculares.avaliativas.map((a, i) => (
                            <li key={i} className="text-sm text-purple-700">• {a}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-orange-800 mb-2">Materiais</p>
                        <ul className="space-y-1">
                          {result.adaptacoesCurriculares.materiais.map((m, i) => (
                            <li key={i} className="text-sm text-orange-700">• {m}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-teal-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-teal-800 mb-2">Ambientais</p>
                        <ul className="space-y-1">
                          {result.adaptacoesCurriculares.ambientais.map((a, i) => (
                            <li key={i} className="text-sm text-teal-700">• {a}</li>
                          ))}
                        </ul>
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
                            <div className="flex-shrink-0 w-24 text-center">
                              <span className="inline-block px-3 py-1 bg-[#2C3E7D] text-white text-xs font-bold rounded">
                                {item.periodo}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">{item.acoes.join('; ')}</p>
                              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                <span>Responsáveis: {item.responsaveis.join(', ')}</span>
                                <span>Avaliação: {item.avaliacaoPrevista}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Acompanhamento */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('acompanhamento')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Acompanhamento e Avaliação</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('acompanhamento') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('acompanhamento') && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Formas de Registro</p>
                        <div className="flex flex-wrap gap-2">
                          {result.acompanhamento.formasRegistro.map((f, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Frequência de Revisão</p>
                        <p className="text-sm text-gray-600">{result.acompanhamento.frequenciaRevisao}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Critérios de Avaliação</p>
                        <ul className="space-y-1">
                          {result.acompanhamento.criteriosAvaliacao.map((c, i) => (
                            <li key={i} className="text-sm text-gray-600">• {c}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Instrumentos</p>
                        <div className="flex flex-wrap gap-2">
                          {result.acompanhamento.instrumentos.map((i, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {i}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Articulação com a Família */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('familia')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Articulação com a Família</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('familia') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('familia') && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Formas de Participação</p>
                        <ul className="space-y-1">
                          {result.articulacaoFamilia.formasParticipacao.map((f, i) => (
                            <li key={i} className="text-sm text-gray-600">• {f}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Orientações</p>
                        <ul className="space-y-1">
                          {result.articulacaoFamilia.orientacoes.map((o, i) => (
                            <li key={i} className="text-sm text-gray-600">• {o}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Canais de Comunicação</p>
                        <div className="flex flex-wrap gap-2">
                          {result.articulacaoFamilia.canaisComunicacao.map((c, i) => (
                            <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Equipe Responsável */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('equipe')}
                  className="w-full flex justify-between items-center p-4 bg-[#2C3E7D]/5 hover:bg-[#2C3E7D]/10 transition-colors text-left"
                >
                  <span className="font-semibold text-[#2C3E7D]">Equipe Responsável</span>
                  <span className="text-gray-400">
                    {expandedSections.includes('equipe') ? '▲' : '▼'}
                  </span>
                </button>
                {expandedSections.includes('equipe') && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.equipeResponsavel.map((prof, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                          <div className="w-10 h-10 bg-[#2C3E7D] text-white rounded-full flex items-center justify-center text-lg">
                            👤
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{prof.profissional}</p>
                            <p className="text-xs text-gray-500">{prof.papel}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Observações Finais */}
              <section className="bg-[#FDB913]/10 rounded-lg p-4">
                <h4 className="font-semibold text-[#2C3E7D] mb-2">Observações Finais</h4>
                <p className="text-gray-700 text-sm">{result.observacoesFinais}</p>
              </section>

              {/* Fundamentação Legal */}
              <section className="border-t border-gray-200 pt-4">
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span><strong>Fundamentação:</strong> {result.metadados.fundamentacaoLegal}</span>
                  <span>•</span>
                  <span><strong>Próxima Revisão:</strong> {result.metadados.proximaRevisao}</span>
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
        title="Editar PEI / PDI"
      />
    </div>
  )
}
