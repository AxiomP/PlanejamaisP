/**
 * Tipos para configurações institucionais
 * Usados quando professores selecionam "Modo Institucional" na geração de conteúdo
 */

export interface InstitutionalHeader {
  schoolName: string
  logoUrl?: string
  showLogo: boolean
  subtitle?: string
  city?: string
  state?: string
}

export interface InstitutionalMethodology {
  preferredApproach: 'tradicional' | 'ativa' | 'hibrida' | 'gamificada' | 'montessoriana' | 'waldorf' | 'construtivista'
  evaluationStyle: 'formativa' | 'somativa' | 'diagnostica' | 'mista'
  inclusionPriority: boolean
  bnccAlignment: 'strict' | 'flexible'
}

export interface InstitutionalContentGuidelines {
  languageLevel: 'simples' | 'intermediario' | 'avancado'
  culturalContext?: string
  requiredElements?: string[]
  avoidTopics?: string[]
}

export interface InstitutionalDocumentPreferences {
  includeDateField: boolean
  includeTeacherField: boolean
  includeClassField: boolean
  footerText?: string
  defaultFontFamily?: 'Arial' | 'Times New Roman' | 'Roboto'
}

export interface InstitutionalSettings {
  header: InstitutionalHeader
  methodology: InstitutionalMethodology
  contentGuidelines: InstitutionalContentGuidelines
  documentPreferences: InstitutionalDocumentPreferences
}

/**
 * Valores padrão para configurações institucionais
 */
export const DEFAULT_INSTITUTIONAL_SETTINGS: InstitutionalSettings = {
  header: {
    schoolName: '',
    showLogo: false,
  },
  methodology: {
    preferredApproach: 'hibrida',
    evaluationStyle: 'mista',
    inclusionPriority: true,
    bnccAlignment: 'flexible',
  },
  contentGuidelines: {
    languageLevel: 'intermediario',
  },
  documentPreferences: {
    includeDateField: true,
    includeTeacherField: true,
    includeClassField: true,
  },
}

/**
 * Parse e valida configurações institucionais do JSON do banco de dados
 * @param json - Objeto JSON das configurações (de institutions.settings)
 * @returns InstitutionalSettings válido ou null se inválido
 */
export function parseInstitutionalSettings(json: unknown): InstitutionalSettings | null {
  if (!json || typeof json !== 'object') {
    return null
  }

  const data = json as Record<string, unknown>

  // Se não tem nenhuma configuração válida, retorna null
  if (!data.header && !data.methodology && !data.contentGuidelines && !data.documentPreferences) {
    return null
  }

  // Merge com valores padrão
  const settings: InstitutionalSettings = {
    header: {
      ...DEFAULT_INSTITUTIONAL_SETTINGS.header,
      ...(data.header as Partial<InstitutionalHeader> || {}),
    },
    methodology: {
      ...DEFAULT_INSTITUTIONAL_SETTINGS.methodology,
      ...(data.methodology as Partial<InstitutionalMethodology> || {}),
    },
    contentGuidelines: {
      ...DEFAULT_INSTITUTIONAL_SETTINGS.contentGuidelines,
      ...(data.contentGuidelines as Partial<InstitutionalContentGuidelines> || {}),
    },
    documentPreferences: {
      ...DEFAULT_INSTITUTIONAL_SETTINGS.documentPreferences,
      ...(data.documentPreferences as Partial<InstitutionalDocumentPreferences> || {}),
    },
  }

  // Validar preferredApproach
  const validApproaches = ['tradicional', 'ativa', 'hibrida', 'gamificada', 'montessoriana', 'waldorf', 'construtivista']
  if (!validApproaches.includes(settings.methodology.preferredApproach)) {
    settings.methodology.preferredApproach = 'hibrida'
  }

  // Validar evaluationStyle
  const validStyles = ['formativa', 'somativa', 'diagnostica', 'mista']
  if (!validStyles.includes(settings.methodology.evaluationStyle)) {
    settings.methodology.evaluationStyle = 'mista'
  }

  // Validar languageLevel
  const validLevels = ['simples', 'intermediario', 'avancado']
  if (!validLevels.includes(settings.contentGuidelines.languageLevel)) {
    settings.contentGuidelines.languageLevel = 'intermediario'
  }

  // Validar bnccAlignment
  const validAlignments = ['strict', 'flexible']
  if (!validAlignments.includes(settings.methodology.bnccAlignment)) {
    settings.methodology.bnccAlignment = 'flexible'
  }

  return settings
}

/**
 * Descrições em português para as abordagens pedagógicas
 */
export const METHODOLOGY_DESCRIPTIONS: Record<InstitutionalMethodology['preferredApproach'], string> = {
  tradicional: 'Abordagem tradicional com exposição dialogada e aulas expositivas',
  ativa: 'Metodologias ativas com protagonismo do aluno e aprendizagem por descoberta',
  hibrida: 'Combinação equilibrada de métodos tradicionais e ativos',
  gamificada: 'Uso de elementos de jogos para engajamento e motivação',
  montessoriana: 'Método Montessori com autonomia e materiais sensoriais',
  waldorf: 'Pedagogia Waldorf com foco em artes e desenvolvimento integral',
  construtivista: 'Abordagem construtivista com construção ativa do conhecimento',
}

/**
 * Descrições em português para os estilos de avaliação
 */
export const EVALUATION_STYLE_DESCRIPTIONS: Record<InstitutionalMethodology['evaluationStyle'], string> = {
  formativa: 'Avaliação formativa contínua ao longo do processo de aprendizagem',
  somativa: 'Avaliação somativa ao final de períodos ou unidades',
  diagnostica: 'Avaliação diagnóstica para identificar conhecimentos prévios',
  mista: 'Combinação de diferentes tipos de avaliação conforme contexto',
}

/**
 * Descrições em português para os níveis de linguagem
 */
export const LANGUAGE_LEVEL_DESCRIPTIONS: Record<InstitutionalContentGuidelines['languageLevel'], string> = {
  simples: 'Linguagem simples e acessível para turmas iniciais ou inclusão',
  intermediario: 'Linguagem intermediária adequada à maioria das turmas',
  avancado: 'Linguagem avançada com termos técnicos para turmas preparadas',
}
