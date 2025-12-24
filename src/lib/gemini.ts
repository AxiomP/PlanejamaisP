import Groq from 'groq-sdk'

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY não está configurada nas variáveis de ambiente. Acesse https://console.groq.com para obter uma chave gratuita.')
  }
  return new Groq({ apiKey })
}

export type ToolType = 'plano_aula' | 'prova' | 'lista_exercicios'

interface PlanoAulaInput {
  disciplina: string
  ano: string
  tema: string
  duracao: string
  objetivos?: string
  codigoBncc?: string
}

interface ProvaInput {
  disciplina: string
  ano: string
  tema: string
  tiposQuestoes: string[]
  quantidade: number
  dificuldade: string
  incluirGabarito: boolean
}

interface ListaExerciciosInput {
  disciplina: string
  ano: string
  tema: string
  quantidade: number
  dificuldade: string
  incluirRespostas: boolean
  contexto?: string
}

type GenerationInput = PlanoAulaInput | ProvaInput | ListaExerciciosInput

const SYSTEM_INSTRUCTION = `Você é um assistente especializado em educação brasileira, com profundo conhecimento da BNCC (Base Nacional Comum Curricular).
Você deve criar conteúdo pedagógico de alta qualidade, sempre em português brasileiro.
Suas respostas devem ser estruturadas, didáticas e adequadas ao nível de ensino especificado.
IMPORTANTE: Responda SEMPRE em formato JSON válido, sem texto adicional antes ou depois do JSON.`

const PROMPTS: Record<ToolType, (input: GenerationInput) => string> = {
  plano_aula: (input) => {
    const data = input as PlanoAulaInput
    return `Crie um plano de aula completo com as seguintes características:

DISCIPLINA: ${data.disciplina}
ANO/SÉRIE: ${data.ano}
TEMA/CONTEÚDO: ${data.tema}
DURAÇÃO: ${data.duracao}
${data.objetivos ? `OBJETIVOS ESPECÍFICOS DO PROFESSOR: ${data.objetivos}` : ''}
${data.codigoBncc ? `CÓDIGO BNCC DE REFERÊNCIA: ${data.codigoBncc}` : ''}

Responda EXATAMENTE neste formato JSON:
{
  "titulo": "Título do plano de aula",
  "objetivos": ["objetivo 1", "objetivo 2", "objetivo 3"],
  "competencias_bncc": ["EF01MA01", "EF01MA02"],
  "duracao": "50 minutos",
  "metodologia": "Descrição da metodologia a ser utilizada",
  "desenvolvimento": [
    {
      "etapa": "Introdução",
      "duracao": "10 minutos",
      "descricao": "Descrição detalhada da etapa"
    },
    {
      "etapa": "Desenvolvimento",
      "duracao": "30 minutos",
      "descricao": "Descrição detalhada da etapa"
    },
    {
      "etapa": "Conclusão",
      "duracao": "10 minutos",
      "descricao": "Descrição detalhada da etapa"
    }
  ],
  "recursos": ["recurso 1", "recurso 2"],
  "avaliacao": "Descrição dos critérios e métodos de avaliação",
  "referencias": ["referência 1", "referência 2"]
}`
  },

  prova: (input) => {
    const data = input as ProvaInput
    const tiposFormatados = data.tiposQuestoes.join(', ')
    return `Crie uma prova/avaliação com as seguintes características:

DISCIPLINA: ${data.disciplina}
ANO/SÉRIE: ${data.ano}
TEMA/CONTEÚDO: ${data.tema}
TIPOS DE QUESTÕES: ${tiposFormatados}
QUANTIDADE DE QUESTÕES: ${data.quantidade}
NÍVEL DE DIFICULDADE: ${data.dificuldade}
INCLUIR GABARITO: ${data.incluirGabarito ? 'Sim' : 'Não'}

Responda EXATAMENTE neste formato JSON:
{
  "titulo": "Avaliação de [disciplina] - [tema]",
  "instrucoes": "Instruções gerais para os alunos",
  "questoes": [
    {
      "numero": 1,
      "tipo": "multipla_escolha",
      "enunciado": "Texto da questão",
      "alternativas": ["a) opção 1", "b) opção 2", "c) opção 3", "d) opção 4"],
      "resposta_correta": "b",
      "justificativa": "Explicação da resposta correta"
    },
    {
      "numero": 2,
      "tipo": "verdadeiro_falso",
      "enunciado": "Afirmação para julgar",
      "resposta_correta": "V",
      "justificativa": "Explicação"
    },
    {
      "numero": 3,
      "tipo": "dissertativa",
      "enunciado": "Pergunta dissertativa",
      "resposta_esperada": "Resposta modelo",
      "criterios_avaliacao": "Critérios de correção"
    }
  ],
  "gabarito": ["1-b", "2-V", "3-ver resposta esperada"]
}

Gere exatamente ${data.quantidade} questões variando entre os tipos solicitados.`
  },

  lista_exercicios: (input) => {
    const data = input as ListaExerciciosInput
    return `Crie uma lista de exercícios com as seguintes características:

DISCIPLINA: ${data.disciplina}
ANO/SÉRIE: ${data.ano}
TEMA/CONTEÚDO: ${data.tema}
QUANTIDADE DE EXERCÍCIOS: ${data.quantidade}
NÍVEL DE DIFICULDADE: ${data.dificuldade}
INCLUIR RESPOSTAS: ${data.incluirRespostas ? 'Sim' : 'Não'}
${data.contexto ? `CONTEXTO/FINALIDADE: ${data.contexto}` : ''}

Responda EXATAMENTE neste formato JSON:
{
  "titulo": "Lista de Exercícios - [tema]",
  "instrucoes": "Instruções gerais para resolução",
  "exercicios": [
    {
      "numero": 1,
      "enunciado": "Texto do exercício",
      "resposta": "Resposta do exercício",
      "dica": "Dica opcional para ajudar o aluno"
    }
  ],
  "respostas": ["1. resposta 1", "2. resposta 2"]
}

${data.dificuldade === 'progressivo' ? 'Organize os exercícios em ordem crescente de dificuldade.' : ''}
Gere exatamente ${data.quantidade} exercícios.`
  }
}

function extractJSON(text: string): string {
  // Tenta encontrar JSON no texto
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }
  return text
}

export async function generateContent(toolType: ToolType, inputData: GenerationInput): Promise<unknown> {
  const groq = getGroqClient()
  const prompt = PROMPTS[toolType](inputData)

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: SYSTEM_INSTRUCTION
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 4096
  })

  const text = chatCompletion.choices[0]?.message?.content || ''

  // Extrair e fazer parse do JSON
  const jsonText = extractJSON(text)

  try {
    return JSON.parse(jsonText)
  } catch {
    // Se falhar o parse, retornar o texto como está em um objeto
    return { raw_content: text, parse_error: true }
  }
}

// Tipos de saída para cada ferramenta
export interface PlanoAulaOutput {
  titulo: string
  objetivos: string[]
  competencias_bncc: string[]
  duracao: string
  metodologia: string
  desenvolvimento: {
    etapa: string
    duracao: string
    descricao: string
  }[]
  recursos: string[]
  avaliacao: string
  referencias: string[]
}

export interface ProvaOutput {
  titulo: string
  instrucoes: string
  questoes: {
    numero: number
    tipo: string
    enunciado: string
    alternativas?: string[]
    resposta_correta: string
    justificativa?: string
    resposta_esperada?: string
    criterios_avaliacao?: string
  }[]
  gabarito: string[]
}

export interface ListaExerciciosOutput {
  titulo: string
  instrucoes: string
  exercicios: {
    numero: number
    enunciado: string
    resposta: string
    dica?: string
  }[]
  respostas: string[]
}
