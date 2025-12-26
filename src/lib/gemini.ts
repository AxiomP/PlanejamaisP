import Groq from 'groq-sdk'
import { injectInstitutionalContext } from './institutional-context'

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY não está configurada nas variáveis de ambiente. Acesse https://console.groq.com para obter uma chave gratuita.')
  }
  return new Groq({ apiKey })
}

export type ToolType = 'plano_aula' | 'prova' | 'lista_exercicios' | 'reescritor' | 'texto_apoio' | 'ideias_atividades' | 'sequencia_didatica' | 'pei_pdi' | 'projeto_educacional'

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
  contexto?: string
}

interface ListaExerciciosInput {
  disciplina: string
  ano: string
  tema: string
  quantidade: number
  dificuldade: string
  incluirRespostas: boolean
  incluirDicas: boolean
  contexto?: string
}

interface ReescritorInput {
  textoOriginal: string
  objetivo: string
  nivelEnsino: string
  disciplina?: string
  instrucoes?: string
  manterCodigoBncc: boolean
  incluirExplicacao: boolean
}

interface TextoApoioInput {
  disciplina: string
  ano: string
  tema: string
  tipoTexto: 'texto_apoio' | 'resumo' | 'texto_explicativo' | 'guia_estudo'
  complexidade: 'basico' | 'intermediario' | 'avancado'
  tamanho: 'curto' | 'medio' | 'longo'
  conceitosChave?: string
  codigoBncc?: string
  contextoAdicional?: string
}

interface IdeiasAtividadesInput {
  disciplina: string
  ano: string
  tema: string
  tipoAtividade: 'individual' | 'grupo' | 'dupla' | 'mista'
  modalidade: 'presencial' | 'remota' | 'hibrida'
  duracao: 'curta' | 'media' | 'longa'
  quantidade: number
  recursos?: string
  objetivoPedagogico?: string
  codigoBncc?: string
}

interface SequenciaDidaticaInput {
  disciplina: string
  ano: string
  tema: string
  numeroAulas: number
  duracaoAula: '50min' | '100min' | '150min' | 'flexivel'
  metodologiaPreferida?: 'tradicional' | 'ativa' | 'hibrida' | 'gamificada'
  objetivoGeral?: string
  codigoBncc?: string
  contexto?: string
  incluirAvaliacao: boolean
}

interface PeiPdiInput {
  nomeAluno: string
  idade: number
  anoEscolar: string
  diagnostico: string
  tipoPlano: 'pei' | 'pdi'
  areasDesenvolvimento: string[]
  habilidadesAtuais: string
  objetivosFamilia?: string
  recursosDisponiveis?: string
  profissionaisEnvolvidos?: string[]
  periodoVigencia: '1_bimestre' | '1_semestre' | '1_ano'
  incluirCronograma: boolean
}

interface ProjetoEducacionalInput {
  titulo: string
  disciplinas: string[]
  ano: string
  duracao: '1_2_semanas' | '3_4_semanas' | '1_2_meses' | 'bimestre' | 'semestre'
  temaGerador: string
  justificativa?: string
  objetivoGeral?: string
  publicoAlvo?: string
  recursosDisponiveis?: string
  incluirCronograma: boolean
  incluirAvaliacao: boolean
}

type GenerationInput = PlanoAulaInput | ProvaInput | ListaExerciciosInput | ReescritorInput | TextoApoioInput | IdeiasAtividadesInput | SequenciaDidaticaInput | PeiPdiInput | ProjetoEducacionalInput

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
${data.contexto ? `CONTEXTO/FINALIDADE: ${data.contexto}` : ''}

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
INCLUIR DICAS: ${data.incluirDicas ? 'Sim' : 'Não'}
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
  },

  reescritor: (input) => {
    const data = input as ReescritorInput

    const objetivoDescricao: Record<string, string> = {
      'simplificar': 'Simplificar o texto para alunos mais novos, usando vocabulário mais acessível e frases mais curtas',
      'formalizar': 'Tornar o texto mais formal e acadêmico, adequado para contextos institucionais',
      'adaptar_nee': 'Adaptar o texto para alunos com necessidades especiais, tornando-o mais claro, direto e com estrutura visual acessível',
      'resumir': 'Resumir o texto mantendo as informações essenciais de forma concisa',
      'expandir': 'Expandir o texto com mais detalhes, exemplos e explicações',
      'vocabulario': 'Adequar o vocabulário ao nível educacional especificado, substituindo termos complexos por equivalentes apropriados',
      'contextualizar': 'Contextualizar o texto para a realidade brasileira, usando exemplos e referências locais',
      'atualizar': 'Atualizar a linguagem e referências do texto para torná-lo mais contemporâneo',
      'corrigir': 'Corrigir erros gramaticais, ortográficos e de clareza, melhorando a qualidade geral do texto',
    }

    const nivelDescricao: Record<string, string> = {
      'ef_inicial': 'alunos do 1º ao 5º ano do Ensino Fundamental (6-10 anos)',
      'ef_final': 'alunos do 6º ao 9º ano do Ensino Fundamental (11-14 anos)',
      'em': 'alunos do Ensino Médio (15-18 anos)',
      'eja': 'alunos da Educação de Jovens e Adultos',
      'inclusivo': 'alunos com necessidades educacionais especiais',
    }

    return `Reescreva o texto educacional a seguir de acordo com as especificações:

TEXTO ORIGINAL:
"""
${data.textoOriginal}
"""

OBJETIVO DA REESCRITA: ${objetivoDescricao[data.objetivo] || data.objetivo}
PÚBLICO-ALVO: ${nivelDescricao[data.nivelEnsino] || data.nivelEnsino}
${data.disciplina ? `DISCIPLINA: ${data.disciplina}` : ''}
${data.instrucoes ? `INSTRUÇÕES ADICIONAIS: ${data.instrucoes}` : ''}
${data.manterCodigoBncc ? 'IMPORTANTE: Preserve qualquer referência a códigos BNCC presentes no texto original.' : ''}

Responda EXATAMENTE neste formato JSON:
{
  "titulo": "Texto reescrito para [público-alvo]",
  "textoReescrito": "O texto completo reescrito aqui...",
  "resumoMudancas": [
    "Mudança 1 realizada",
    "Mudança 2 realizada",
    "Mudança 3 realizada"
  ]${data.incluirExplicacao ? `,
  "explicacao": {
    "motivacao": "Por que essas mudanças foram necessárias",
    "alteracoesRealizadas": [
      {
        "tipo": "Vocabulário",
        "descricao": "Descrição da alteração",
        "exemplo": "Antes: X -> Depois: Y"
      }
    ],
    "dicasUso": ["Dica 1", "Dica 2"]
  }` : ''},
  "alinhamentoBncc": {
    "competenciasPreservadas": ["Competência 1", "Competência 2"],
    "observacoes": "Observações sobre alinhamento com BNCC"
  },
  "metadados": {
    "tamanhoOriginal": ${data.textoOriginal.length},
    "tamanhoFinal": 0,
    "nivelLeitura": "Adequado para [nível]",
    "objetivoAtendido": "Sim/Parcialmente - explicação"
  }
}

Garanta que o texto reescrito:
1. Mantenha o sentido e as informações essenciais do original
2. Seja adequado ao nível educacional especificado
3. Preserve o valor pedagógico
4. Esteja alinhado com as diretrizes da BNCC para educação brasileira
5. Use português brasileiro correto e natural`
  },

  texto_apoio: (input) => {
    const data = input as TextoApoioInput

    const tipoDescricao: Record<string, string> = {
      'texto_apoio': 'um texto de apoio didático para auxiliar os alunos na compreensão do tema',
      'resumo': 'um resumo educacional sintetizando os principais pontos do tema',
      'texto_explicativo': 'um texto explicativo detalhado sobre o tema',
      'guia_estudo': 'um guia de estudo estruturado para revisão e aprendizado'
    }

    const complexidadeDescricao: Record<string, string> = {
      'basico': 'Nível básico: introdução ao tema com linguagem simples e exemplos cotidianos',
      'intermediario': 'Nível intermediário: aprofundamento com terminologia técnica adequada',
      'avancado': 'Nível avançado: análise crítica, conexões interdisciplinares e reflexões'
    }

    const tamanhoDescricao: Record<string, string> = {
      'curto': '300 a 500 palavras',
      'medio': '500 a 1000 palavras',
      'longo': '1000 a 1500 palavras'
    }

    return `Crie ${tipoDescricao[data.tipoTexto]} com as seguintes características:

DISCIPLINA: ${data.disciplina}
ANO/SÉRIE: ${data.ano}
TEMA/CONTEÚDO: ${data.tema}
TIPO DE TEXTO: ${data.tipoTexto}
COMPLEXIDADE: ${complexidadeDescricao[data.complexidade]}
TAMANHO DESEJADO: ${tamanhoDescricao[data.tamanho]}
${data.conceitosChave ? `CONCEITOS-CHAVE A INCLUIR: ${data.conceitosChave}` : ''}
${data.codigoBncc ? `CÓDIGO BNCC DE REFERÊNCIA: ${data.codigoBncc}` : ''}
${data.contextoAdicional ? `CONTEXTO ADICIONAL: ${data.contextoAdicional}` : ''}

Responda EXATAMENTE neste formato JSON:
{
  "titulo": "Título do texto",
  "introducao": "Parágrafo introdutório contextualizando o tema",
  "secoes": [
    {
      "titulo": "Título da seção",
      "conteudo": "Conteúdo detalhado da seção...",
      "conceitosDestacados": ["conceito 1", "conceito 2"],
      "exemplos": ["exemplo prático 1", "exemplo prático 2"]
    }
  ],
  "conceitosChave": [
    {
      "termo": "Termo importante",
      "definicao": "Definição clara e acessível"
    }
  ],
  "resumoConclusao": "Parágrafo de conclusão sintetizando os principais pontos",
  "alinhamentoBncc": {
    "competencias": ["Competência Geral 1", "Competência Geral 2"],
    "habilidades": ["EF06MA01", "EF06MA02"],
    "observacoes": "Observações sobre o alinhamento com a BNCC"
  },
  "sugestoesBibliografia": [
    "Livro ou recurso 1",
    "Livro ou recurso 2",
    "Site ou material complementar"
  ],
  "metadados": {
    "nivelComplexidade": "Básico/Intermediário/Avançado",
    "tempoLeituraEstimado": "X minutos",
    "publicoAlvo": "Alunos do Xº ano do Ensino Y"
  }
}

Garanta que o texto:
1. Seja adequado ao nível educacional do ano/série especificado
2. Use linguagem apropriada para a complexidade solicitada
3. Inclua exemplos práticos e contextualizados para a realidade brasileira
4. Destaque os conceitos-chave de forma clara
5. Mantenha alinhamento com as diretrizes da BNCC
6. Possua estrutura didática que facilite a compreensão
7. Tenha aproximadamente o tamanho solicitado`
  },

  ideias_atividades: (input) => {
    const data = input as IdeiasAtividadesInput

    const tipoDescricao: Record<string, string> = {
      'individual': 'atividades individuais',
      'grupo': 'atividades em grupo',
      'dupla': 'atividades em dupla',
      'mista': 'atividades que combinam trabalho individual e coletivo'
    }

    const modalidadeDescricao: Record<string, string> = {
      'presencial': 'ambiente presencial em sala de aula',
      'remota': 'ensino remoto/online',
      'hibrida': 'modalidade híbrida (presencial e remoto)'
    }

    const duracaoDescricao: Record<string, string> = {
      'curta': '15 a 30 minutos',
      'media': '30 a 60 minutos',
      'longa': '1 a 2 horas ou mais'
    }

    return `Gere ${data.quantidade} ideias criativas de ${tipoDescricao[data.tipoAtividade]} para uso em ${modalidadeDescricao[data.modalidade]} com as seguintes características:

DISCIPLINA: ${data.disciplina}
ANO/SÉRIE: ${data.ano}
TEMA/CONTEÚDO: ${data.tema}
TIPO DE ATIVIDADE: ${data.tipoAtividade}
MODALIDADE: ${data.modalidade}
DURAÇÃO ESTIMADA: ${duracaoDescricao[data.duracao]}
QUANTIDADE DE IDEIAS: ${data.quantidade}
${data.recursos ? `RECURSOS DISPONÍVEIS: ${data.recursos}` : ''}
${data.objetivoPedagogico ? `OBJETIVO PEDAGÓGICO: ${data.objetivoPedagogico}` : ''}
${data.codigoBncc ? `CÓDIGO BNCC DE REFERÊNCIA: ${data.codigoBncc}` : ''}

Responda EXATAMENTE neste formato JSON:
{
  "titulo": "Ideias de Atividades: [tema]",
  "introducao": "Breve contextualização pedagógica sobre as atividades propostas",
  "atividades": [
    {
      "numero": 1,
      "nome": "Nome criativo da atividade",
      "descricao": "Descrição detalhada de como realizar a atividade",
      "objetivos": ["objetivo 1", "objetivo 2"],
      "materiaisNecessarios": ["material 1", "material 2"],
      "passosExecucao": ["passo 1", "passo 2", "passo 3"],
      "duracaoEstimada": "X minutos",
      "dicasAdaptacao": "Sugestões para adaptar a diferentes contextos ou necessidades",
      "avaliacaoSugerida": "Como avaliar o desempenho dos alunos nesta atividade"
    }
  ],
  "dicasGerais": [
    "Dica pedagógica 1",
    "Dica pedagógica 2"
  ],
  "variacoes": [
    {
      "contexto": "Para turmas maiores",
      "adaptacao": "Descrição da adaptação"
    },
    {
      "contexto": "Para alunos com dificuldades",
      "adaptacao": "Descrição da adaptação"
    }
  ],
  "alinhamentoBncc": {
    "competencias": ["Competência Geral 1", "Competência Geral 2"],
    "habilidades": ["EF06MA01", "EF06MA02"],
    "observacoes": "Observações sobre o alinhamento com a BNCC"
  },
  "metadados": {
    "nivelDificuldade": "Fácil/Médio/Difícil",
    "engajamentoEsperado": "Alto/Médio/Baixo",
    "publicoAlvo": "Alunos do Xº ano do Ensino Y"
  }
}

Garanta que as atividades:
1. Sejam criativas, engajadoras e adequadas à faixa etária
2. Tenham instruções claras e práticas
3. Possam ser realizadas com recursos acessíveis
4. Promovam a participação ativa dos alunos
5. Estejam alinhadas com os objetivos pedagógicos da BNCC
6. Incluam opções de adaptação para diferentes contextos
7. Sejam diversificadas em suas abordagens metodológicas`
  },

  sequencia_didatica: (input) => {
    const data = input as SequenciaDidaticaInput

    const metodologiaDescricao: Record<string, string> = {
      'tradicional': 'abordagem tradicional com exposição dialogada',
      'ativa': 'metodologias ativas com protagonismo do aluno',
      'hibrida': 'combinação de ensino presencial e recursos digitais',
      'gamificada': 'elementos de gamificação para engajamento'
    }

    const duracaoDescricao: Record<string, string> = {
      '50min': '50 minutos (1 período)',
      '100min': '100 minutos (2 períodos)',
      '150min': '150 minutos (3 períodos)',
      'flexivel': 'flexível (definir por aula)'
    }

    return `Crie uma sequência didática completa com ${data.numeroAulas} aulas conectadas progressivamente:

DISCIPLINA: ${data.disciplina}
ANO/SÉRIE: ${data.ano}
TEMA CENTRAL: ${data.tema}
NÚMERO DE AULAS: ${data.numeroAulas}
DURAÇÃO POR AULA: ${duracaoDescricao[data.duracaoAula]}
${data.objetivoGeral ? `OBJETIVO GERAL: ${data.objetivoGeral}` : ''}
${data.codigoBncc ? `CÓDIGO BNCC DE REFERÊNCIA: ${data.codigoBncc}` : ''}
${data.contexto ? `CONTEXTO ESCOLAR: ${data.contexto}` : ''}
${data.metodologiaPreferida ? `METODOLOGIA PREFERIDA: ${metodologiaDescricao[data.metodologiaPreferida]}` : ''}
INCLUIR AVALIAÇÃO DETALHADA: ${data.incluirAvaliacao ? 'Sim' : 'Não'}

IMPORTANTE: A sequência deve ter progressão clara de complexidade, onde cada aula conecta-se à anterior e prepara para a próxima.

Responda EXATAMENTE neste formato JSON:
{
  "titulo": "Sequência Didática: [tema]",
  "apresentacao": "Descrição geral da sequência e sua importância pedagógica (2-3 parágrafos)",
  "objetivoGeral": "Objetivo geral da sequência",
  "objetivosEspecificos": ["objetivo 1", "objetivo 2", "objetivo 3"],
  "publicoAlvo": "Descrição do público-alvo",
  "duracao": {
    "totalAulas": ${data.numeroAulas},
    "duracaoPorAula": "${duracaoDescricao[data.duracaoAula]}",
    "cargaHorariaTotal": "X horas"
  },
  "alinhamentoBncc": {
    "competenciasGerais": ["Competência 1", "Competência 2"],
    "habilidades": ["EF06MA01", "EF06MA02"],
    "observacoes": "Observações sobre alinhamento"
  },
  "aulas": [
    {
      "numero": 1,
      "titulo": "Título da aula 1",
      "objetivos": ["objetivo 1", "objetivo 2"],
      "conteudos": ["conteúdo 1", "conteúdo 2"],
      "metodologia": "Descrição da metodologia usada nesta aula",
      "recursos": ["recurso 1", "recurso 2"],
      "atividades": [
        {
          "descricao": "Descrição da atividade",
          "duracao": "X minutos",
          "tipo": "individual"
        }
      ],
      "avaliacaoFormativa": "Como avaliar o aprendizado nesta aula",
      "conexaoProximaAula": "Como esta aula conecta-se à próxima"
    }
  ],
  "avaliacaoFinal": {
    "criterios": ["critério 1", "critério 2"],
    "instrumentos": ["instrumento 1", "instrumento 2"],
    "sugestoes": "Sugestões para avaliação somativa"
  },
  "recursos": {
    "materiais": ["material 1", "material 2"],
    "tecnologicos": ["recurso tech 1"],
    "espacos": ["sala de aula", "laboratório"]
  },
  "referencias": ["referência 1", "referência 2"],
  "metadados": {
    "nivelComplexidade": "Básico/Intermediário/Avançado",
    "tempoPreparacaoEstimado": "X horas",
    "adaptabilidade": "Alta/Média/Baixa"
  }
}

Garanta que:
1. Gere EXATAMENTE ${data.numeroAulas} aulas
2. Cada aula tenha progressão de complexidade em relação à anterior
3. As conexões entre aulas sejam claras e lógicas
4. O campo "tipo" das atividades seja "individual", "grupo" ou "coletiva"
5. As habilidades BNCC sejam códigos válidos para a disciplina e ano especificados
6. O conteúdo esteja alinhado com as diretrizes da BNCC para educação brasileira`
  },

  pei_pdi: (input) => {
    const data = input as PeiPdiInput

    const tipoPlanoDescricao = data.tipoPlano === 'pei'
      ? 'Plano Educacional Individualizado (PEI)'
      : 'Plano de Desenvolvimento Individual (PDI)'

    const periodoDescricao: Record<string, string> = {
      '1_bimestre': '1 bimestre',
      '1_semestre': '1 semestre',
      '1_ano': '1 ano letivo'
    }

    const areasFormatadas = data.areasDesenvolvimento.join(', ')

    return `Crie um ${tipoPlanoDescricao} completo e detalhado para educação inclusiva:

DADOS DO ALUNO:
- Nome: ${data.nomeAluno}
- Idade: ${data.idade} anos
- Ano Escolar: ${data.anoEscolar}
- Diagnóstico/Condição: ${data.diagnostico}

ÁREAS DE DESENVOLVIMENTO PRIORITÁRIAS: ${areasFormatadas}

HABILIDADES ATUAIS DO ALUNO:
${data.habilidadesAtuais}

${data.objetivosFamilia ? `OBJETIVOS DA FAMÍLIA: ${data.objetivosFamilia}` : ''}
${data.recursosDisponiveis ? `RECURSOS DISPONÍVEIS NA ESCOLA: ${data.recursosDisponiveis}` : ''}
${data.profissionaisEnvolvidos && data.profissionaisEnvolvidos.length > 0 ? `PROFISSIONAIS ENVOLVIDOS: ${data.profissionaisEnvolvidos.join(', ')}` : ''}

PERÍODO DE VIGÊNCIA: ${periodoDescricao[data.periodoVigencia]}
INCLUIR CRONOGRAMA DETALHADO: ${data.incluirCronograma ? 'Sim' : 'Não'}

IMPORTANTE:
- Crie um plano respeitoso e centrado nas potencialidades do aluno
- Use linguagem positiva e focada em habilidades (não em déficits)
- Alinhe com a Política Nacional de Educação Especial na Perspectiva da Educação Inclusiva
- Considere as diretrizes da BNCC para educação inclusiva

Responda EXATAMENTE neste formato JSON:
{
  "titulo": "${tipoPlanoDescricao} - ${data.nomeAluno}",
  "dadosIdentificacao": {
    "nomeAluno": "${data.nomeAluno}",
    "idade": ${data.idade},
    "anoEscolar": "${data.anoEscolar}",
    "diagnostico": "${data.diagnostico}",
    "periodoVigencia": "${periodoDescricao[data.periodoVigencia]}",
    "dataElaboracao": "Data atual"
  },
  "perfilDoAluno": {
    "potencialidades": ["potencialidade 1", "potencialidade 2", "potencialidade 3"],
    "interesses": ["interesse 1", "interesse 2"],
    "estiloAprendizagem": "Descrição do estilo de aprendizagem preferencial",
    "formasExpressao": ["forma de expressão 1", "forma de expressão 2"],
    "necessidadesEspecificas": ["necessidade 1", "necessidade 2"]
  },
  "avaliacaoInicial": {
    "areasAvaliadas": [
      {
        "area": "Nome da área",
        "nivelAtual": "Descrição do nível atual de habilidade",
        "observacoes": "Observações relevantes"
      }
    ],
    "barreirasIdentificadas": ["barreira 1", "barreira 2"],
    "apoiosNecessarios": ["apoio 1", "apoio 2"]
  },
  "objetivos": {
    "objetivoGeral": "Objetivo geral do plano para o período",
    "objetivosEspecificos": [
      {
        "area": "Área de desenvolvimento",
        "objetivo": "Descrição do objetivo",
        "indicadores": ["indicador de progresso 1", "indicador de progresso 2"],
        "prazo": "Prazo estimado"
      }
    ]
  },
  "estrategiasIntervencao": [
    {
      "area": "Área de desenvolvimento",
      "estrategias": ["estratégia 1", "estratégia 2", "estratégia 3"],
      "recursos": ["recurso 1", "recurso 2"],
      "responsavel": "Profissional responsável",
      "frequencia": "Frequência de aplicação"
    }
  ],
  "adaptacoesCurriculares": {
    "metodologicas": ["adaptação metodológica 1", "adaptação metodológica 2"],
    "avaliativas": ["adaptação avaliativa 1", "adaptação avaliativa 2"],
    "materiais": ["material adaptado 1", "material adaptado 2"],
    "ambientais": ["adaptação ambiental 1", "adaptação ambiental 2"]
  },
  "cronograma": ${data.incluirCronograma ? `[
    {
      "periodo": "Período (ex: 1º mês)",
      "acoes": ["ação 1", "ação 2"],
      "responsaveis": ["responsável 1"],
      "avaliacaoPrevista": "Tipo de avaliação"
    }
  ]` : '[]'},
  "acompanhamento": {
    "formasRegistro": ["forma de registro 1", "forma de registro 2"],
    "frequenciaRevisao": "Frequência de revisão do plano",
    "criteriosAvaliacao": ["critério 1", "critério 2"],
    "instrumentos": ["instrumento de avaliação 1", "instrumento 2"]
  },
  "articulacaoFamilia": {
    "formasParticipacao": ["forma de participação 1", "forma de participação 2"],
    "orientacoes": ["orientação para família 1", "orientação 2"],
    "canaisComunicacao": ["canal de comunicação 1", "canal 2"]
  },
  "equipeResponsavel": [
    {
      "profissional": "Nome/Função do profissional",
      "papel": "Papel no acompanhamento do aluno"
    }
  ],
  "observacoesFinais": "Observações adicionais importantes",
  "metadados": {
    "tipoPlano": "${data.tipoPlano.toUpperCase()}",
    "fundamentacaoLegal": "Lei Brasileira de Inclusão (Lei 13.146/2015), Política Nacional de Educação Especial",
    "proximaRevisao": "Data prevista para próxima revisão"
  }
}

Garanta que:
1. O plano seja respeitoso e focado nas potencialidades do aluno
2. Os objetivos sejam SMART (Específicos, Mensuráveis, Atingíveis, Relevantes, Temporais)
3. As estratégias sejam práticas e aplicáveis no contexto escolar
4. O cronograma (se solicitado) seja realista e detalhado
5. O plano esteja alinhado com a legislação brasileira de inclusão`
  },

  projeto_educacional: (input) => {
    const data = input as ProjetoEducacionalInput

    const duracaoDescricao: Record<string, string> = {
      '1_2_semanas': '1 a 2 semanas',
      '3_4_semanas': '3 a 4 semanas',
      '1_2_meses': '1 a 2 meses',
      'bimestre': '1 bimestre',
      'semestre': '1 semestre'
    }

    const disciplinasFormatadas = data.disciplinas.join(', ')
    const isInterdisciplinar = data.disciplinas.length > 1

    return `Crie um projeto educacional ${isInterdisciplinar ? 'interdisciplinar' : ''} completo e detalhado:

DADOS DO PROJETO:
- Título: ${data.titulo}
- Disciplina(s): ${disciplinasFormatadas}
- Ano/Série: ${data.ano}
- Duração: ${duracaoDescricao[data.duracao]}
- Tema Gerador: ${data.temaGerador}
${data.justificativa ? `- Justificativa do Professor: ${data.justificativa}` : ''}
${data.objetivoGeral ? `- Objetivo Geral Desejado: ${data.objetivoGeral}` : ''}
${data.publicoAlvo ? `- Público-Alvo Específico: ${data.publicoAlvo}` : ''}
${data.recursosDisponiveis ? `- Recursos Disponíveis: ${data.recursosDisponiveis}` : ''}

INCLUIR CRONOGRAMA DETALHADO: ${data.incluirCronograma ? 'Sim' : 'Não'}
INCLUIR AVALIAÇÃO DETALHADA: ${data.incluirAvaliacao ? 'Sim' : 'Não'}

IMPORTANTE:
- ${isInterdisciplinar ? 'Por ser interdisciplinar, integre as disciplinas de forma orgânica e significativa' : 'Mantenha foco na disciplina especificada'}
- Crie etapas progressivas com produtos esperados claros
- Defina um produto final significativo para o projeto
- Alinhe com as competências e habilidades da BNCC

Responda EXATAMENTE neste formato JSON:
{
  "titulo": "${data.titulo}",
  "identificacao": {
    "disciplinas": ${JSON.stringify(data.disciplinas)},
    "ano": "${data.ano}",
    "duracao": "${duracaoDescricao[data.duracao]}",
    "publicoAlvo": "Descrição do público-alvo"
  },
  "apresentacao": {
    "temaGerador": "${data.temaGerador}",
    "justificativa": "Justificativa pedagógica do projeto (2-3 parágrafos)",
    "problematizacao": "Questão problematizadora que guia o projeto"
  },
  "objetivos": {
    "geral": "Objetivo geral do projeto",
    "especificos": ["objetivo específico 1", "objetivo específico 2", "objetivo específico 3", "objetivo específico 4"]
  },
  "fundamentacaoTeorica": {
    "conceitos": ["conceito-chave 1", "conceito-chave 2", "conceito-chave 3"],
    "autoresReferencia": ["Autor 1 - contribuição", "Autor 2 - contribuição"],
    "conexaoBncc": {
      "competencias": ["Competência Geral 1", "Competência Geral 2"],
      "habilidades": ["EF06MA01", "EF06LP01"]
    }
  },
  "metodologia": {
    "abordagem": "Descrição da abordagem metodológica (ex: ABP, metodologias ativas)",
    "estrategias": ["estratégia 1", "estratégia 2", "estratégia 3"],
    "organizacaoTurma": "Como a turma será organizada durante o projeto"
  },
  "etapas": [
    {
      "numero": 1,
      "titulo": "Título da etapa",
      "descricao": "Descrição detalhada do que será feito",
      "duracao": "X dias/semanas",
      "atividades": ["atividade 1", "atividade 2", "atividade 3"],
      "recursos": ["recurso 1", "recurso 2"],
      "produtoEsperado": "O que os alunos devem produzir nesta etapa"
    }
  ],
  "recursos": {
    "materiais": ["material 1", "material 2"],
    "tecnologicos": ["recurso tech 1", "recurso tech 2"],
    "humanos": ["professor", "convidado especialista"],
    "espacos": ["sala de aula", "laboratório", "área externa"]
  },
  "cronograma": ${data.incluirCronograma ? `[
    {
      "periodo": "Semana 1",
      "etapa": "Etapa 1 - Título",
      "atividades": ["atividade 1", "atividade 2"],
      "responsavel": "Professor/Alunos"
    }
  ]` : '[]'},
  "avaliacao": ${data.incluirAvaliacao ? `{
    "criterios": ["critério 1", "critério 2", "critério 3"],
    "instrumentos": ["instrumento 1", "instrumento 2"],
    "formasRegistro": ["portfólio", "diário de bordo", "rubricas"],
    "autoavaliacao": "Descrição de como os alunos farão autoavaliação"
  }` : `{
    "criterios": ["participação", "produção", "colaboração"],
    "instrumentos": ["observação", "produto final"],
    "formasRegistro": ["registro do professor"],
    "autoavaliacao": "Roda de conversa ao final"
  }`},
  "produtoFinal": {
    "descricao": "Descrição detalhada do produto final do projeto",
    "formaApresentacao": "Como o produto será apresentado (feira, exposição, publicação, etc.)",
    "publico": "Para quem será apresentado (comunidade escolar, pais, etc.)"
  },
  "referencias": ["referência bibliográfica 1", "referência bibliográfica 2", "site ou recurso online"],
  "metadados": {
    "nivelComplexidade": "Básico/Intermediário/Avançado",
    "interdisciplinaridade": "${isInterdisciplinar ? 'Alta - ' + data.disciplinas.length + ' disciplinas integradas' : 'Baixa - foco em ' + data.disciplinas[0]}",
    "tempoPreparacaoEstimado": "X horas"
  }
}

Garanta que:
1. O projeto tenha entre 3 e 6 etapas progressivas
2. Cada etapa tenha um produto esperado claro
3. O produto final seja significativo e apresentável
4. ${isInterdisciplinar ? 'As disciplinas sejam integradas de forma coerente' : 'O conteúdo esteja focado na disciplina especificada'}
5. As habilidades BNCC sejam apropriadas para o ano e disciplinas
6. O cronograma (se solicitado) seja realista para a duração especificada`
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

export async function generateContent(
  toolType: ToolType,
  inputData: GenerationInput,
  institutionalContext?: string | null
): Promise<unknown> {
  const groq = getGroqClient()
  const basePrompt = PROMPTS[toolType](inputData)

  // Injetar contexto institucional se fornecido
  const prompt = institutionalContext
    ? injectInstitutionalContext(basePrompt, institutionalContext)
    : basePrompt

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

export interface ReescritorOutput {
  titulo: string
  textoReescrito: string
  resumoMudancas: string[]
  explicacao?: {
    motivacao: string
    alteracoesRealizadas: {
      tipo: string
      descricao: string
      exemplo?: string
    }[]
    dicasUso: string[]
  }
  alinhamentoBncc?: {
    competenciasPreservadas: string[]
    observacoes: string
  }
  metadados: {
    tamanhoOriginal: number
    tamanhoFinal: number
    nivelLeitura: string
    objetivoAtendido: string
  }
}

export interface TextoApoioOutput {
  titulo: string
  introducao: string
  secoes: {
    titulo: string
    conteudo: string
    conceitosDestacados?: string[]
    exemplos?: string[]
  }[]
  conceitosChave: {
    termo: string
    definicao: string
  }[]
  resumoConclusao: string
  alinhamentoBncc: {
    competencias: string[]
    habilidades: string[]
    observacoes: string
  }
  sugestoesBibliografia: string[]
  metadados: {
    nivelComplexidade: string
    tempoLeituraEstimado: string
    publicoAlvo: string
  }
}

export interface IdeiasAtividadesOutput {
  titulo: string
  introducao: string
  atividades: {
    numero: number
    nome: string
    descricao: string
    objetivos: string[]
    materiaisNecessarios: string[]
    passosExecucao: string[]
    duracaoEstimada: string
    dicasAdaptacao: string
    avaliacaoSugerida: string
  }[]
  dicasGerais: string[]
  variacoes: {
    contexto: string
    adaptacao: string
  }[]
  alinhamentoBncc: {
    competencias: string[]
    habilidades: string[]
    observacoes: string
  }
  metadados: {
    nivelDificuldade: string
    engajamentoEsperado: string
    publicoAlvo: string
  }
}

export interface SequenciaDidaticaOutput {
  titulo: string
  apresentacao: string
  objetivoGeral: string
  objetivosEspecificos: string[]
  publicoAlvo: string
  duracao: {
    totalAulas: number
    duracaoPorAula: string
    cargaHorariaTotal: string
  }
  alinhamentoBncc: {
    competenciasGerais: string[]
    habilidades: string[]
    observacoes: string
  }
  aulas: {
    numero: number
    titulo: string
    objetivos: string[]
    conteudos: string[]
    metodologia: string
    recursos: string[]
    atividades: {
      descricao: string
      duracao: string
      tipo: 'individual' | 'grupo' | 'coletiva'
    }[]
    avaliacaoFormativa: string
    conexaoProximaAula: string
  }[]
  avaliacaoFinal: {
    criterios: string[]
    instrumentos: string[]
    sugestoes: string
  }
  recursos: {
    materiais: string[]
    tecnologicos: string[]
    espacos: string[]
  }
  referencias: string[]
  metadados: {
    nivelComplexidade: string
    tempoPreparacaoEstimado: string
    adaptabilidade: string
  }
}

export interface PeiPdiOutput {
  titulo: string
  dadosIdentificacao: {
    nomeAluno: string
    idade: number
    anoEscolar: string
    diagnostico: string
    periodoVigencia: string
    dataElaboracao: string
  }
  perfilDoAluno: {
    potencialidades: string[]
    interesses: string[]
    estiloAprendizagem: string
    formasExpressao: string[]
    necessidadesEspecificas: string[]
  }
  avaliacaoInicial: {
    areasAvaliadas: {
      area: string
      nivelAtual: string
      observacoes: string
    }[]
    barreirasIdentificadas: string[]
    apoiosNecessarios: string[]
  }
  objetivos: {
    objetivoGeral: string
    objetivosEspecificos: {
      area: string
      objetivo: string
      indicadores: string[]
      prazo: string
    }[]
  }
  estrategiasIntervencao: {
    area: string
    estrategias: string[]
    recursos: string[]
    responsavel: string
    frequencia: string
  }[]
  adaptacoesCurriculares: {
    metodologicas: string[]
    avaliativas: string[]
    materiais: string[]
    ambientais: string[]
  }
  cronograma: {
    periodo: string
    acoes: string[]
    responsaveis: string[]
    avaliacaoPrevista: string
  }[]
  acompanhamento: {
    formasRegistro: string[]
    frequenciaRevisao: string
    criteriosAvaliacao: string[]
    instrumentos: string[]
  }
  articulacaoFamilia: {
    formasParticipacao: string[]
    orientacoes: string[]
    canaisComunicacao: string[]
  }
  equipeResponsavel: {
    profissional: string
    papel: string
  }[]
  observacoesFinais: string
  metadados: {
    tipoPlano: string
    fundamentacaoLegal: string
    proximaRevisao: string
  }
}

export interface ProjetoEducacionalOutput {
  titulo: string
  identificacao: {
    disciplinas: string[]
    ano: string
    duracao: string
    publicoAlvo: string
  }
  apresentacao: {
    temaGerador: string
    justificativa: string
    problematizacao: string
  }
  objetivos: {
    geral: string
    especificos: string[]
  }
  fundamentacaoTeorica: {
    conceitos: string[]
    autoresReferencia: string[]
    conexaoBncc: {
      competencias: string[]
      habilidades: string[]
    }
  }
  metodologia: {
    abordagem: string
    estrategias: string[]
    organizacaoTurma: string
  }
  etapas: {
    numero: number
    titulo: string
    descricao: string
    duracao: string
    atividades: string[]
    recursos: string[]
    produtoEsperado: string
  }[]
  recursos: {
    materiais: string[]
    tecnologicos: string[]
    humanos: string[]
    espacos: string[]
  }
  cronograma: {
    periodo: string
    etapa: string
    atividades: string[]
    responsavel: string
  }[]
  avaliacao: {
    criterios: string[]
    instrumentos: string[]
    formasRegistro: string[]
    autoavaliacao: string
  }
  produtoFinal: {
    descricao: string
    formaApresentacao: string
    publico: string
  }
  referencias: string[]
  metadados: {
    nivelComplexidade: string
    interdisciplinaridade: string
    tempoPreparacaoEstimado: string
  }
}
