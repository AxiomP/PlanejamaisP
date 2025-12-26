/**
 * Funções para construir contexto institucional para prompts de IA
 */

import type {
  InstitutionalSettings,
  InstitutionalMethodology,
} from '@/types/institutional-settings'
import {
  METHODOLOGY_DESCRIPTIONS,
  EVALUATION_STYLE_DESCRIPTIONS,
  LANGUAGE_LEVEL_DESCRIPTIONS,
} from '@/types/institutional-settings'

/**
 * Constrói o texto de contexto institucional para injetar nos prompts de IA
 * @param settings - Configurações institucionais
 * @returns String de contexto formatada para o prompt
 */
export function buildInstitutionalPromptContext(settings: InstitutionalSettings): string {
  const lines: string[] = []

  lines.push('\nCONTEXTO INSTITUCIONAL:')
  lines.push('Este conteúdo está sendo gerado para uso institucional. Siga as diretrizes da escola.')

  // Header/Identificação da escola
  if (settings.header.schoolName) {
    lines.push(`- Escola: ${settings.header.schoolName}`)
    if (settings.header.city && settings.header.state) {
      lines.push(`- Localização: ${settings.header.city}, ${settings.header.state}`)
    }
  }

  // Metodologia
  const approachDesc = METHODOLOGY_DESCRIPTIONS[settings.methodology.preferredApproach]
  lines.push(`- Abordagem pedagógica: ${approachDesc}`)

  const evalDesc = EVALUATION_STYLE_DESCRIPTIONS[settings.methodology.evaluationStyle]
  lines.push(`- Estilo de avaliação: ${evalDesc}`)

  // Alinhamento BNCC
  if (settings.methodology.bnccAlignment === 'strict') {
    lines.push('- Alinhamento BNCC: RIGOROSO - Referenciar explicitamente códigos e competências da BNCC')
  } else {
    lines.push('- Alinhamento BNCC: Flexível - Alinhar com competências da BNCC de forma natural')
  }

  // Inclusão
  if (settings.methodology.inclusionPriority) {
    lines.push('- IMPORTANTE: Priorizar linguagem e atividades inclusivas, acessíveis a todos os alunos')
  }

  // Nível de linguagem
  const langDesc = LANGUAGE_LEVEL_DESCRIPTIONS[settings.contentGuidelines.languageLevel]
  lines.push(`- Nível de linguagem: ${langDesc}`)

  // Contexto cultural
  if (settings.contentGuidelines.culturalContext) {
    lines.push(`- Contexto cultural da comunidade: ${settings.contentGuidelines.culturalContext}`)
  }

  // Elementos obrigatórios
  if (settings.contentGuidelines.requiredElements?.length) {
    lines.push(`- Elementos que devem ser incluídos: ${settings.contentGuidelines.requiredElements.join(', ')}`)
  }

  // Tópicos a evitar
  if (settings.contentGuidelines.avoidTopics?.length) {
    lines.push(`- Evitar os seguintes tópicos: ${settings.contentGuidelines.avoidTopics.join(', ')}`)
  }

  lines.push('')
  lines.push('Adapte o conteúdo gerado para refletir a identidade pedagógica da instituição.')
  lines.push('')

  return lines.join('\n')
}

/**
 * Injeta o contexto institucional em um prompt existente
 * O contexto é inserido antes da especificação do formato JSON
 * @param prompt - Prompt original
 * @param institutionalContext - Contexto institucional a injetar
 * @returns Prompt modificado com contexto institucional
 */
export function injectInstitutionalContext(prompt: string, institutionalContext: string): string {
  // Padrão usado em todos os prompts para indicar onde começa o formato JSON
  const jsonMarker = 'Responda EXATAMENTE neste formato JSON:'

  const markerIndex = prompt.indexOf(jsonMarker)

  if (markerIndex === -1) {
    // Se não encontrar o marcador, adiciona o contexto no final
    return prompt + '\n' + institutionalContext
  }

  // Insere o contexto antes do marcador JSON
  return (
    prompt.slice(0, markerIndex) +
    institutionalContext +
    prompt.slice(markerIndex)
  )
}

/**
 * Tipo para o modo de geração
 */
export type GenerationMode = 'personalizado' | 'institucional'

/**
 * Valida se o usuário pode usar o modo institucional
 * @param institutionId - ID da instituição do usuário (null se não tem)
 * @param mode - Modo solicitado
 * @returns Objeto com validação e mensagem de erro se aplicável
 */
export function validateInstitutionalMode(
  institutionId: string | null | undefined,
  mode: GenerationMode
): { valid: boolean; error?: string } {
  if (mode === 'institucional' && !institutionId) {
    return {
      valid: false,
      error: 'Modo institucional não disponível. Você não está vinculado a uma instituição.',
    }
  }

  return { valid: true }
}
