import jsPDF from 'jspdf'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType
} from 'docx'
import type {
  PlanoAulaOutput,
  ProvaOutput,
  ListaExerciciosOutput,
  ReescritorOutput,
  TextoApoioOutput,
  IdeiasAtividadesOutput,
  SequenciaDidaticaOutput,
  PeiPdiOutput,
  ProjetoEducacionalOutput
} from './gemini'

// Cores do design system
const PRIMARY_COLOR = '#2C3E7D'

// Constantes de paginação PDF
const PAGE_BREAK_Y = 260       // Quando adicionar nova página
const PAGE_START_Y = 20        // Y inicial após nova página
const FOOTER_Y = 285           // Posição do footer

// ================== UTILIDADES ==================

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function sanitizeFilename(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)
}

// ================== PDF EXPORT ==================

function createPDFDocument(title: string): jsPDF {
  const doc = new jsPDF()

  // Header
  doc.setFillColor(44, 62, 125) // Primary color
  doc.rect(0, 0, 210, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Planeja+', 14, 15)

  // Title
  doc.setTextColor(44, 62, 125)
  doc.setFontSize(18)
  doc.text(title, 14, 40)

  // Reset
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  return doc
}

function addPDFSection(doc: jsPDF, title: string, yPos: number): number {
  if (yPos > PAGE_BREAK_Y) {
    doc.addPage()
    yPos = PAGE_START_Y
  }

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(44, 62, 125)
  doc.text(title, 14, yPos)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  return yPos + 8
}

function addPDFText(doc: jsPDF, text: string, yPos: number, maxWidth: number = 180): number {
  const lines = doc.splitTextToSize(text, maxWidth)

  for (const line of lines) {
    if (yPos > PAGE_BREAK_Y) {
      doc.addPage()
      yPos = PAGE_START_Y
    }
    doc.text(line, 14, yPos)
    yPos += 6
  }

  return yPos + 2
}

function addPDFList(doc: jsPDF, items: string[], yPos: number): number {
  for (const item of items) {
    if (yPos > PAGE_BREAK_Y) {
      doc.addPage()
      yPos = PAGE_START_Y
    }
    const lines = doc.splitTextToSize(`• ${item}`, 175)
    for (const line of lines) {
      doc.text(line, 18, yPos)
      yPos += 6
    }
  }
  return yPos + 2
}

// ================== DOCX EXPORT ==================

function createHeading(text: string, level: typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2 = HeadingLevel.HEADING_2): Paragraph {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 400, after: 200 }
  })
}

function createParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun(text)],
    spacing: { after: 200 }
  })
}

function createBulletList(items: string[]): Paragraph[] {
  return items.map(item => new Paragraph({
    children: [new TextRun(item)],
    bullet: { level: 0 },
    spacing: { after: 100 }
  }))
}

// ================== PLANO DE AULA ==================

export async function exportPlanoAulaToPDF(data: PlanoAulaOutput): Promise<void> {
  const doc = createPDFDocument(data.titulo)
  let y = 50

  // Objetivos
  y = addPDFSection(doc, 'Objetivos de Aprendizagem', y)
  y = addPDFList(doc, data.objetivos, y)

  // Competências BNCC
  y = addPDFSection(doc, 'Competências BNCC', y)
  y = addPDFText(doc, data.competencias_bncc.join(', '), y)

  // Duração e Metodologia
  y = addPDFSection(doc, 'Duração', y)
  y = addPDFText(doc, data.duracao, y)

  y = addPDFSection(doc, 'Metodologia', y)
  y = addPDFText(doc, data.metodologia, y)

  // Desenvolvimento
  y = addPDFSection(doc, 'Desenvolvimento da Aula', y)
  for (const etapa of data.desenvolvimento) {
    doc.setFont('helvetica', 'bold')
    y = addPDFText(doc, `${etapa.etapa} (${etapa.duracao})`, y)
    doc.setFont('helvetica', 'normal')
    y = addPDFText(doc, etapa.descricao, y)
    y += 4
  }

  // Recursos
  y = addPDFSection(doc, 'Recursos Necessários', y)
  y = addPDFList(doc, data.recursos, y)

  // Avaliação
  y = addPDFSection(doc, 'Avaliação', y)
  y = addPDFText(doc, data.avaliacao, y)

  // Referências
  y = addPDFSection(doc, 'Referências', y)
  y = addPDFList(doc, data.referencias, y)

  // Footer
  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text('Gerado por Planeja+ - planeja.com.br', 14, FOOTER_Y)

  const blob = doc.output('blob')
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.pdf`)
}

export async function exportPlanoAulaToDOCX(data: PlanoAulaOutput): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: 'Planeja+', bold: true, size: 28, color: PRIMARY_COLOR.replace('#', '') })
          ],
          spacing: { after: 400 }
        }),
        new Paragraph({
          text: data.titulo,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 }
        }),

        createHeading('Objetivos de Aprendizagem'),
        ...createBulletList(data.objetivos),

        createHeading('Competências BNCC'),
        createParagraph(data.competencias_bncc.join(', ')),

        createHeading('Duração'),
        createParagraph(data.duracao),

        createHeading('Metodologia'),
        createParagraph(data.metodologia),

        createHeading('Desenvolvimento da Aula'),
        ...data.desenvolvimento.flatMap(etapa => [
          new Paragraph({
            children: [
              new TextRun({ text: `${etapa.etapa} `, bold: true }),
              new TextRun({ text: `(${etapa.duracao})`, italics: true })
            ],
            spacing: { before: 200, after: 100 }
          }),
          createParagraph(etapa.descricao)
        ]),

        createHeading('Recursos Necessários'),
        ...createBulletList(data.recursos),

        createHeading('Avaliação'),
        createParagraph(data.avaliacao),

        createHeading('Referências'),
        ...createBulletList(data.referencias),

        new Paragraph({
          children: [
            new TextRun({ text: 'Gerado por Planeja+ - planeja.com.br', size: 18, color: '808080' })
          ],
          spacing: { before: 800 }
        })
      ]
    }]
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.docx`)
}

// ================== PROVA ==================

export async function exportProvaToPDF(data: ProvaOutput): Promise<void> {
  const doc = createPDFDocument(data.titulo)
  let y = 50

  // Instruções
  y = addPDFSection(doc, 'Instruções', y)
  y = addPDFText(doc, data.instrucoes, y)
  y += 5

  // Questões
  y = addPDFSection(doc, 'Questões', y)
  for (const q of data.questoes) {
    if (y > PAGE_BREAK_Y) {
      doc.addPage()
      y = PAGE_START_Y
    }

    doc.setFont('helvetica', 'bold')
    y = addPDFText(doc, `${q.numero}. (${q.tipo})`, y)
    doc.setFont('helvetica', 'normal')
    y = addPDFText(doc, q.enunciado, y)

    if (q.alternativas) {
      y = addPDFList(doc, q.alternativas, y)
    }
    y += 5
  }

  // Gabarito
  doc.addPage()
  y = PAGE_START_Y
  y = addPDFSection(doc, 'Gabarito', y)
  y = addPDFList(doc, data.gabarito, y)

  // Justificativas
  y = addPDFSection(doc, 'Justificativas', y)
  for (const q of data.questoes) {
    if (q.justificativa) {
      doc.setFont('helvetica', 'bold')
      y = addPDFText(doc, `Questão ${q.numero}:`, y)
      doc.setFont('helvetica', 'normal')
      y = addPDFText(doc, q.justificativa, y)
      y += 3
    }
  }

  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text('Gerado por Planeja+ - planeja.com.br', 14, FOOTER_Y)

  const blob = doc.output('blob')
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.pdf`)
}

export async function exportProvaToDOCX(data: ProvaOutput): Promise<void> {
  const questoesContent: Paragraph[] = []

  for (const q of data.questoes) {
    questoesContent.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${q.numero}. `, bold: true }),
          new TextRun({ text: `(${q.tipo}) `, italics: true }),
          new TextRun(q.enunciado)
        ],
        spacing: { before: 300, after: 200 }
      })
    )

    if (q.alternativas) {
      questoesContent.push(...q.alternativas.map(alt =>
        new Paragraph({
          text: alt,
          indent: { left: 720 },
          spacing: { after: 100 }
        })
      ))
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: data.titulo,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 }
        }),

        createHeading('Instruções'),
        createParagraph(data.instrucoes),

        createHeading('Questões'),
        ...questoesContent,

        new Paragraph({ text: '', spacing: { before: 400 } }),
        createHeading('Gabarito'),
        ...createBulletList(data.gabarito),

        new Paragraph({
          children: [
            new TextRun({ text: 'Gerado por Planeja+ - planeja.com.br', size: 18, color: '808080' })
          ],
          spacing: { before: 800 }
        })
      ]
    }]
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.docx`)
}

// ================== LISTA DE EXERCÍCIOS ==================

export async function exportListaExerciciosToPDF(data: ListaExerciciosOutput): Promise<void> {
  const doc = createPDFDocument(data.titulo)
  let y = 50

  y = addPDFSection(doc, 'Instruções', y)
  y = addPDFText(doc, data.instrucoes, y)
  y += 5

  y = addPDFSection(doc, 'Exercícios', y)
  for (const ex of data.exercicios) {
    if (y > PAGE_BREAK_Y) {
      doc.addPage()
      y = PAGE_START_Y
    }

    doc.setFont('helvetica', 'bold')
    y = addPDFText(doc, `${ex.numero}.`, y)
    doc.setFont('helvetica', 'normal')
    y = addPDFText(doc, ex.enunciado, y)

    if (ex.dica) {
      doc.setFont('helvetica', 'italic')
      y = addPDFText(doc, `Dica: ${ex.dica}`, y)
      doc.setFont('helvetica', 'normal')
    }
    y += 5
  }

  doc.addPage()
  y = PAGE_START_Y
  y = addPDFSection(doc, 'Respostas', y)
  y = addPDFList(doc, data.respostas, y)

  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text('Gerado por Planeja+ - planeja.com.br', 14, FOOTER_Y)

  const blob = doc.output('blob')
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.pdf`)
}

export async function exportListaExerciciosToDOCX(data: ListaExerciciosOutput): Promise<void> {
  const exerciciosContent: Paragraph[] = []

  for (const ex of data.exercicios) {
    exerciciosContent.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${ex.numero}. `, bold: true }),
          new TextRun(ex.enunciado)
        ],
        spacing: { before: 300, after: 200 }
      })
    )

    if (ex.dica) {
      exerciciosContent.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Dica: ', italics: true, bold: true }),
            new TextRun({ text: ex.dica, italics: true })
          ],
          indent: { left: 720 },
          spacing: { after: 200 }
        })
      )
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: data.titulo,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 }
        }),

        createHeading('Instruções'),
        createParagraph(data.instrucoes),

        createHeading('Exercícios'),
        ...exerciciosContent,

        createHeading('Respostas'),
        ...createBulletList(data.respostas),

        new Paragraph({
          children: [
            new TextRun({ text: 'Gerado por Planeja+ - planeja.com.br', size: 18, color: '808080' })
          ],
          spacing: { before: 800 }
        })
      ]
    }]
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.docx`)
}

// ================== REESCRITOR ==================

export async function exportReescritorToPDF(data: ReescritorOutput): Promise<void> {
  const doc = createPDFDocument(data.titulo)
  let y = 50

  y = addPDFSection(doc, 'Texto Reescrito', y)
  y = addPDFText(doc, data.textoReescrito, y)
  y += 5

  y = addPDFSection(doc, 'Resumo das Mudanças', y)
  y = addPDFList(doc, data.resumoMudancas, y)

  if (data.explicacao) {
    y = addPDFSection(doc, 'Explicação das Alterações', y)
    y = addPDFText(doc, data.explicacao.motivacao, y)

    if (data.explicacao.dicasUso) {
      y = addPDFSection(doc, 'Dicas de Uso', y)
      y = addPDFList(doc, data.explicacao.dicasUso, y)
    }
  }

  if (data.alinhamentoBncc) {
    y = addPDFSection(doc, 'Alinhamento BNCC', y)
    y = addPDFText(doc, data.alinhamentoBncc.observacoes, y)
  }

  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text('Gerado por Planeja+ - planeja.com.br', 14, FOOTER_Y)

  const blob = doc.output('blob')
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.pdf`)
}

export async function exportReescritorToDOCX(data: ReescritorOutput): Promise<void> {
  const sections: Paragraph[] = [
    new Paragraph({
      text: data.titulo,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 }
    }),

    createHeading('Texto Reescrito'),
    createParagraph(data.textoReescrito),

    createHeading('Resumo das Mudanças'),
    ...createBulletList(data.resumoMudancas)
  ]

  if (data.explicacao) {
    sections.push(
      createHeading('Explicação das Alterações'),
      createParagraph(data.explicacao.motivacao)
    )

    if (data.explicacao.dicasUso) {
      sections.push(
        createHeading('Dicas de Uso'),
        ...createBulletList(data.explicacao.dicasUso)
      )
    }
  }

  if (data.alinhamentoBncc) {
    sections.push(
      createHeading('Alinhamento BNCC'),
      createParagraph(data.alinhamentoBncc.observacoes)
    )
  }

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Gerado por Planeja+ - planeja.com.br', size: 18, color: '808080' })
      ],
      spacing: { before: 800 }
    })
  )

  const doc = new Document({
    sections: [{ properties: {}, children: sections }]
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.docx`)
}

// ================== TEXTO DE APOIO ==================

export async function exportTextoApoioToPDF(data: TextoApoioOutput): Promise<void> {
  const doc = createPDFDocument(data.titulo)
  let y = 50

  y = addPDFSection(doc, 'Introdução', y)
  y = addPDFText(doc, data.introducao, y)
  y += 5

  for (const secao of data.secoes) {
    y = addPDFSection(doc, secao.titulo, y)
    y = addPDFText(doc, secao.conteudo, y)

    if (secao.exemplos && secao.exemplos.length > 0) {
      doc.setFont('helvetica', 'italic')
      y = addPDFText(doc, 'Exemplos:', y)
      doc.setFont('helvetica', 'normal')
      y = addPDFList(doc, secao.exemplos, y)
    }
    y += 3
  }

  y = addPDFSection(doc, 'Conceitos-Chave', y)
  for (const conceito of data.conceitosChave) {
    doc.setFont('helvetica', 'bold')
    y = addPDFText(doc, conceito.termo, y)
    doc.setFont('helvetica', 'normal')
    y = addPDFText(doc, conceito.definicao, y)
    y += 2
  }

  y = addPDFSection(doc, 'Conclusão', y)
  y = addPDFText(doc, data.resumoConclusao, y)

  if (data.sugestoesBibliografia && data.sugestoesBibliografia.length > 0) {
    y = addPDFSection(doc, 'Bibliografia Sugerida', y)
    y = addPDFList(doc, data.sugestoesBibliografia, y)
  }

  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text('Gerado por Planeja+ - planeja.com.br', 14, FOOTER_Y)

  const blob = doc.output('blob')
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.pdf`)
}

export async function exportTextoApoioToDOCX(data: TextoApoioOutput): Promise<void> {
  const secoesContent: Paragraph[] = []

  for (const secao of data.secoes) {
    secoesContent.push(
      createHeading(secao.titulo),
      createParagraph(secao.conteudo)
    )

    if (secao.exemplos && secao.exemplos.length > 0) {
      secoesContent.push(
        new Paragraph({
          children: [new TextRun({ text: 'Exemplos:', italics: true, bold: true })],
          spacing: { before: 200 }
        }),
        ...createBulletList(secao.exemplos)
      )
    }
  }

  const conceitosContent: Paragraph[] = []
  for (const conceito of data.conceitosChave) {
    conceitosContent.push(
      new Paragraph({
        children: [
          new TextRun({ text: conceito.termo, bold: true }),
          new TextRun(': ' + conceito.definicao)
        ],
        spacing: { after: 200 }
      })
    )
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: data.titulo,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 }
        }),

        createHeading('Introdução'),
        createParagraph(data.introducao),

        ...secoesContent,

        createHeading('Conceitos-Chave'),
        ...conceitosContent,

        createHeading('Conclusão'),
        createParagraph(data.resumoConclusao),

        ...(data.sugestoesBibliografia?.length ? [
          createHeading('Bibliografia Sugerida'),
          ...createBulletList(data.sugestoesBibliografia)
        ] : []),

        new Paragraph({
          children: [
            new TextRun({ text: 'Gerado por Planeja+ - planeja.com.br', size: 18, color: '808080' })
          ],
          spacing: { before: 800 }
        })
      ]
    }]
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.docx`)
}

// ================== IDEIAS DE ATIVIDADES ==================

export async function exportIdeiasAtividadesToPDF(data: IdeiasAtividadesOutput): Promise<void> {
  const doc = createPDFDocument(data.titulo)
  let y = 50

  y = addPDFText(doc, data.introducao, y)
  y += 5

  for (const atividade of data.atividades) {
    if (y > PAGE_BREAK_Y) {
      doc.addPage()
      y = PAGE_START_Y
    }

    doc.setFont('helvetica', 'bold')
    y = addPDFText(doc, `${atividade.numero}. ${atividade.nome}`, y)
    doc.setFont('helvetica', 'normal')
    y = addPDFText(doc, atividade.descricao, y)

    y = addPDFText(doc, `Duração: ${atividade.duracaoEstimada}`, y)

    doc.setFont('helvetica', 'italic')
    y = addPDFText(doc, 'Objetivos:', y)
    doc.setFont('helvetica', 'normal')
    y = addPDFList(doc, atividade.objetivos, y)

    doc.setFont('helvetica', 'italic')
    y = addPDFText(doc, 'Materiais:', y)
    doc.setFont('helvetica', 'normal')
    y = addPDFList(doc, atividade.materiaisNecessarios, y)

    doc.setFont('helvetica', 'italic')
    y = addPDFText(doc, 'Passos:', y)
    doc.setFont('helvetica', 'normal')
    y = addPDFList(doc, atividade.passosExecucao, y)

    y += 5
  }

  if (data.dicasGerais && data.dicasGerais.length > 0) {
    y = addPDFSection(doc, 'Dicas Gerais', y)
    y = addPDFList(doc, data.dicasGerais, y)
  }

  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text('Gerado por Planeja+ - planeja.com.br', 14, FOOTER_Y)

  const blob = doc.output('blob')
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.pdf`)
}

export async function exportIdeiasAtividadesToDOCX(data: IdeiasAtividadesOutput): Promise<void> {
  const atividadesContent: Paragraph[] = []

  for (const atividade of data.atividades) {
    atividadesContent.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${atividade.numero}. ${atividade.nome}`, bold: true, size: 26 })
        ],
        spacing: { before: 400, after: 200 }
      }),
      createParagraph(atividade.descricao),
      new Paragraph({
        children: [
          new TextRun({ text: 'Duração: ', bold: true }),
          new TextRun(atividade.duracaoEstimada)
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Objetivos:', italics: true, bold: true })],
        spacing: { before: 200 }
      }),
      ...createBulletList(atividade.objetivos),
      new Paragraph({
        children: [new TextRun({ text: 'Materiais Necessários:', italics: true, bold: true })],
        spacing: { before: 200 }
      }),
      ...createBulletList(atividade.materiaisNecessarios),
      new Paragraph({
        children: [new TextRun({ text: 'Passos de Execução:', italics: true, bold: true })],
        spacing: { before: 200 }
      }),
      ...atividade.passosExecucao.map((passo, i) => new Paragraph({
        children: [new TextRun(`${i + 1}. ${passo}`)],
        indent: { left: 720 },
        spacing: { after: 100 }
      }))
    )
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: data.titulo,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        }),
        createParagraph(data.introducao),

        ...atividadesContent,

        ...(data.dicasGerais?.length ? [
          createHeading('Dicas Gerais'),
          ...createBulletList(data.dicasGerais)
        ] : []),

        new Paragraph({
          children: [
            new TextRun({ text: 'Gerado por Planeja+ - planeja.com.br', size: 18, color: '808080' })
          ],
          spacing: { before: 800 }
        })
      ]
    }]
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.docx`)
}

// ================== SEQUÊNCIA DIDÁTICA ==================

export async function exportSequenciaDidaticaToPDF(data: SequenciaDidaticaOutput): Promise<void> {
  const doc = createPDFDocument(data.titulo)
  let y = 50

  y = addPDFText(doc, data.apresentacao, y)
  y += 5

  y = addPDFSection(doc, 'Objetivo Geral', y)
  y = addPDFText(doc, data.objetivoGeral, y)

  y = addPDFSection(doc, 'Objetivos Específicos', y)
  y = addPDFList(doc, data.objetivosEspecificos, y)

  y = addPDFSection(doc, 'Duração', y)
  y = addPDFText(doc, `${data.duracao.totalAulas} aulas de ${data.duracao.duracaoPorAula} (${data.duracao.cargaHorariaTotal})`, y)

  // Aulas
  for (const aula of data.aulas) {
    doc.addPage()
    y = PAGE_START_Y

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(44, 62, 125)
    y = addPDFText(doc, `Aula ${aula.numero}: ${aula.titulo}`, y)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)

    y = addPDFSection(doc, 'Objetivos', y)
    y = addPDFList(doc, aula.objetivos, y)

    y = addPDFSection(doc, 'Conteúdos', y)
    y = addPDFList(doc, aula.conteudos, y)

    y = addPDFSection(doc, 'Metodologia', y)
    y = addPDFText(doc, aula.metodologia, y)

    y = addPDFSection(doc, 'Recursos', y)
    y = addPDFList(doc, aula.recursos, y)

    y = addPDFSection(doc, 'Atividades', y)
    for (const at of aula.atividades) {
      y = addPDFText(doc, `• ${at.descricao} (${at.duracao}, ${at.tipo})`, y)
    }

    y = addPDFSection(doc, 'Avaliação Formativa', y)
    y = addPDFText(doc, aula.avaliacaoFormativa, y)
  }

  // Avaliação Final
  doc.addPage()
  y = PAGE_START_Y
  y = addPDFSection(doc, 'Avaliação Final', y)
  y = addPDFText(doc, 'Critérios:', y)
  y = addPDFList(doc, data.avaliacaoFinal.criterios, y)
  y = addPDFText(doc, 'Instrumentos:', y)
  y = addPDFList(doc, data.avaliacaoFinal.instrumentos, y)
  y = addPDFText(doc, data.avaliacaoFinal.sugestoes, y)

  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text('Gerado por Planeja+ - planeja.com.br', 14, FOOTER_Y)

  const blob = doc.output('blob')
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.pdf`)
}

export async function exportSequenciaDidaticaToDOCX(data: SequenciaDidaticaOutput): Promise<void> {
  const aulasContent: Paragraph[] = []

  for (const aula of data.aulas) {
    aulasContent.push(
      new Paragraph({
        text: `Aula ${aula.numero}: ${aula.titulo}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 600, after: 300 }
      }),
      new Paragraph({ children: [new TextRun({ text: 'Objetivos:', bold: true })] }),
      ...createBulletList(aula.objetivos),
      new Paragraph({ children: [new TextRun({ text: 'Conteúdos:', bold: true })] }),
      ...createBulletList(aula.conteudos),
      new Paragraph({ children: [new TextRun({ text: 'Metodologia:', bold: true })] }),
      createParagraph(aula.metodologia),
      new Paragraph({ children: [new TextRun({ text: 'Recursos:', bold: true })] }),
      ...createBulletList(aula.recursos),
      new Paragraph({ children: [new TextRun({ text: 'Atividades:', bold: true })] }),
      ...aula.atividades.map(at => new Paragraph({
        children: [new TextRun(`• ${at.descricao} (${at.duracao}, ${at.tipo})`)],
        spacing: { after: 100 }
      })),
      new Paragraph({ children: [new TextRun({ text: 'Avaliação Formativa:', bold: true })] }),
      createParagraph(aula.avaliacaoFormativa)
    )
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: data.titulo,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        }),
        createParagraph(data.apresentacao),

        createHeading('Objetivo Geral'),
        createParagraph(data.objetivoGeral),

        createHeading('Objetivos Específicos'),
        ...createBulletList(data.objetivosEspecificos),

        createHeading('Duração'),
        createParagraph(`${data.duracao.totalAulas} aulas de ${data.duracao.duracaoPorAula} (${data.duracao.cargaHorariaTotal})`),

        ...aulasContent,

        createHeading('Avaliação Final'),
        new Paragraph({ children: [new TextRun({ text: 'Critérios:', bold: true })] }),
        ...createBulletList(data.avaliacaoFinal.criterios),
        new Paragraph({ children: [new TextRun({ text: 'Instrumentos:', bold: true })] }),
        ...createBulletList(data.avaliacaoFinal.instrumentos),
        createParagraph(data.avaliacaoFinal.sugestoes),

        new Paragraph({
          children: [
            new TextRun({ text: 'Gerado por Planeja+ - planeja.com.br', size: 18, color: '808080' })
          ],
          spacing: { before: 800 }
        })
      ]
    }]
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.docx`)
}

// ================== PEI/PDI ==================

export async function exportPeiPdiToPDF(data: PeiPdiOutput): Promise<void> {
  const doc = createPDFDocument(data.titulo)
  let y = 50

  // Dados de Identificação
  y = addPDFSection(doc, 'Dados de Identificação', y)
  y = addPDFText(doc, `Aluno: ${data.dadosIdentificacao.nomeAluno}`, y)
  y = addPDFText(doc, `Idade: ${data.dadosIdentificacao.idade} anos`, y)
  y = addPDFText(doc, `Ano Escolar: ${data.dadosIdentificacao.anoEscolar}`, y)
  y = addPDFText(doc, `Diagnóstico: ${data.dadosIdentificacao.diagnostico}`, y)
  y = addPDFText(doc, `Período de Vigência: ${data.dadosIdentificacao.periodoVigencia}`, y)

  // Perfil do Aluno
  y = addPDFSection(doc, 'Perfil do Aluno', y)
  y = addPDFText(doc, 'Potencialidades:', y)
  y = addPDFList(doc, data.perfilDoAluno.potencialidades, y)
  y = addPDFText(doc, 'Interesses:', y)
  y = addPDFList(doc, data.perfilDoAluno.interesses, y)
  y = addPDFText(doc, `Estilo de Aprendizagem: ${data.perfilDoAluno.estiloAprendizagem}`, y)

  // Objetivos
  doc.addPage()
  y = PAGE_START_Y
  y = addPDFSection(doc, 'Objetivos', y)
  y = addPDFText(doc, `Objetivo Geral: ${data.objetivos.objetivoGeral}`, y)
  y += 3

  for (const obj of data.objetivos.objetivosEspecificos) {
    doc.setFont('helvetica', 'bold')
    y = addPDFText(doc, `${obj.area}:`, y)
    doc.setFont('helvetica', 'normal')
    y = addPDFText(doc, obj.objetivo, y)
    y = addPDFText(doc, `Prazo: ${obj.prazo}`, y)
    y = addPDFText(doc, 'Indicadores:', y)
    y = addPDFList(doc, obj.indicadores, y)
    y += 3
  }

  // Estratégias
  y = addPDFSection(doc, 'Estratégias de Intervenção', y)
  for (const est of data.estrategiasIntervencao) {
    doc.setFont('helvetica', 'bold')
    y = addPDFText(doc, est.area, y)
    doc.setFont('helvetica', 'normal')
    y = addPDFList(doc, est.estrategias, y)
    y = addPDFText(doc, `Responsável: ${est.responsavel}`, y)
    y = addPDFText(doc, `Frequência: ${est.frequencia}`, y)
    y += 3
  }

  // Adaptações
  doc.addPage()
  y = PAGE_START_Y
  y = addPDFSection(doc, 'Adaptações Curriculares', y)
  y = addPDFText(doc, 'Metodológicas:', y)
  y = addPDFList(doc, data.adaptacoesCurriculares.metodologicas, y)
  y = addPDFText(doc, 'Avaliativas:', y)
  y = addPDFList(doc, data.adaptacoesCurriculares.avaliativas, y)
  y = addPDFText(doc, 'Materiais:', y)
  y = addPDFList(doc, data.adaptacoesCurriculares.materiais, y)

  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text('Gerado por Planeja+ - planeja.com.br', 14, FOOTER_Y)

  const blob = doc.output('blob')
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.pdf`)
}

export async function exportPeiPdiToDOCX(data: PeiPdiOutput): Promise<void> {
  const objetivosContent: Paragraph[] = data.objetivos.objetivosEspecificos.flatMap(obj => [
    new Paragraph({
      children: [new TextRun({ text: obj.area, bold: true })],
      spacing: { before: 300 }
    }),
    createParagraph(obj.objetivo),
    new Paragraph({
      children: [
        new TextRun({ text: 'Prazo: ', bold: true }),
        new TextRun(obj.prazo)
      ]
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Indicadores:', italics: true })]
    }),
    ...createBulletList(obj.indicadores)
  ])

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: data.titulo,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 }
        }),

        createHeading('Dados de Identificação'),
        createParagraph(`Aluno: ${data.dadosIdentificacao.nomeAluno}`),
        createParagraph(`Idade: ${data.dadosIdentificacao.idade} anos`),
        createParagraph(`Ano Escolar: ${data.dadosIdentificacao.anoEscolar}`),
        createParagraph(`Diagnóstico: ${data.dadosIdentificacao.diagnostico}`),
        createParagraph(`Período de Vigência: ${data.dadosIdentificacao.periodoVigencia}`),

        createHeading('Perfil do Aluno'),
        new Paragraph({ children: [new TextRun({ text: 'Potencialidades:', bold: true })] }),
        ...createBulletList(data.perfilDoAluno.potencialidades),
        new Paragraph({ children: [new TextRun({ text: 'Interesses:', bold: true })] }),
        ...createBulletList(data.perfilDoAluno.interesses),
        createParagraph(`Estilo de Aprendizagem: ${data.perfilDoAluno.estiloAprendizagem}`),

        createHeading('Objetivos'),
        new Paragraph({
          children: [
            new TextRun({ text: 'Objetivo Geral: ', bold: true }),
            new TextRun(data.objetivos.objetivoGeral)
          ],
          spacing: { after: 300 }
        }),
        ...objetivosContent,

        createHeading('Adaptações Curriculares'),
        new Paragraph({ children: [new TextRun({ text: 'Metodológicas:', bold: true })] }),
        ...createBulletList(data.adaptacoesCurriculares.metodologicas),
        new Paragraph({ children: [new TextRun({ text: 'Avaliativas:', bold: true })] }),
        ...createBulletList(data.adaptacoesCurriculares.avaliativas),
        new Paragraph({ children: [new TextRun({ text: 'Materiais:', bold: true })] }),
        ...createBulletList(data.adaptacoesCurriculares.materiais),

        new Paragraph({
          children: [
            new TextRun({ text: 'Gerado por Planeja+ - planeja.com.br', size: 18, color: '808080' })
          ],
          spacing: { before: 800 }
        })
      ]
    }]
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.docx`)
}

// ================== PROJETO EDUCACIONAL ==================

export async function exportProjetoEducacionalToPDF(data: ProjetoEducacionalOutput): Promise<void> {
  const doc = createPDFDocument(data.titulo)
  let y = 50

  // Identificação
  y = addPDFSection(doc, 'Identificação', y)
  y = addPDFText(doc, `Disciplinas: ${data.identificacao.disciplinas.join(', ')}`, y)
  y = addPDFText(doc, `Ano: ${data.identificacao.ano}`, y)
  y = addPDFText(doc, `Duração: ${data.identificacao.duracao}`, y)
  y = addPDFText(doc, `Público-alvo: ${data.identificacao.publicoAlvo}`, y)

  // Apresentação
  y = addPDFSection(doc, 'Apresentação', y)
  y = addPDFText(doc, `Tema Gerador: ${data.apresentacao.temaGerador}`, y)
  y = addPDFText(doc, data.apresentacao.justificativa, y)
  y = addPDFText(doc, `Problematização: ${data.apresentacao.problematizacao}`, y)

  // Objetivos
  y = addPDFSection(doc, 'Objetivos', y)
  doc.setFont('helvetica', 'bold')
  y = addPDFText(doc, 'Objetivo Geral:', y)
  doc.setFont('helvetica', 'normal')
  y = addPDFText(doc, data.objetivos.geral, y)
  doc.setFont('helvetica', 'bold')
  y = addPDFText(doc, 'Objetivos Específicos:', y)
  doc.setFont('helvetica', 'normal')
  y = addPDFList(doc, data.objetivos.especificos, y)

  // Metodologia
  doc.addPage()
  y = PAGE_START_Y
  y = addPDFSection(doc, 'Metodologia', y)
  y = addPDFText(doc, `Abordagem: ${data.metodologia.abordagem}`, y)
  y = addPDFText(doc, 'Estratégias:', y)
  y = addPDFList(doc, data.metodologia.estrategias, y)

  // Etapas
  y = addPDFSection(doc, 'Etapas do Projeto', y)
  for (const etapa of data.etapas) {
    doc.setFont('helvetica', 'bold')
    y = addPDFText(doc, `${etapa.numero}. ${etapa.titulo} (${etapa.duracao})`, y)
    doc.setFont('helvetica', 'normal')
    y = addPDFText(doc, etapa.descricao, y)
    y = addPDFText(doc, 'Atividades:', y)
    y = addPDFList(doc, etapa.atividades, y)
    y = addPDFText(doc, `Produto esperado: ${etapa.produtoEsperado}`, y)
    y += 5
  }

  // Produto Final
  doc.addPage()
  y = PAGE_START_Y
  y = addPDFSection(doc, 'Produto Final', y)
  y = addPDFText(doc, data.produtoFinal.descricao, y)
  y = addPDFText(doc, `Forma de apresentação: ${data.produtoFinal.formaApresentacao}`, y)
  y = addPDFText(doc, `Público: ${data.produtoFinal.publico}`, y)

  // Avaliação
  y = addPDFSection(doc, 'Avaliação', y)
  y = addPDFText(doc, 'Critérios:', y)
  y = addPDFList(doc, data.avaliacao.criterios, y)
  y = addPDFText(doc, 'Instrumentos:', y)
  y = addPDFList(doc, data.avaliacao.instrumentos, y)

  // Referências
  if (data.referencias && data.referencias.length > 0) {
    y = addPDFSection(doc, 'Referências', y)
    y = addPDFList(doc, data.referencias, y)
  }

  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text('Gerado por Planeja+ - planeja.com.br', 14, FOOTER_Y)

  const blob = doc.output('blob')
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.pdf`)
}

export async function exportProjetoEducacionalToDOCX(data: ProjetoEducacionalOutput): Promise<void> {
  const etapasContent: Paragraph[] = data.etapas.flatMap(etapa => [
    new Paragraph({
      children: [
        new TextRun({ text: `${etapa.numero}. ${etapa.titulo} `, bold: true }),
        new TextRun({ text: `(${etapa.duracao})`, italics: true })
      ],
      spacing: { before: 400, after: 200 }
    }),
    createParagraph(etapa.descricao),
    new Paragraph({ children: [new TextRun({ text: 'Atividades:', italics: true })] }),
    ...createBulletList(etapa.atividades),
    new Paragraph({
      children: [
        new TextRun({ text: 'Produto esperado: ', bold: true }),
        new TextRun(etapa.produtoEsperado)
      ],
      spacing: { after: 200 }
    })
  ])

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: data.titulo,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 }
        }),

        createHeading('Identificação'),
        createParagraph(`Disciplinas: ${data.identificacao.disciplinas.join(', ')}`),
        createParagraph(`Ano: ${data.identificacao.ano}`),
        createParagraph(`Duração: ${data.identificacao.duracao}`),
        createParagraph(`Público-alvo: ${data.identificacao.publicoAlvo}`),

        createHeading('Apresentação'),
        new Paragraph({
          children: [
            new TextRun({ text: 'Tema Gerador: ', bold: true }),
            new TextRun(data.apresentacao.temaGerador)
          ],
          spacing: { after: 200 }
        }),
        createParagraph(data.apresentacao.justificativa),
        new Paragraph({
          children: [
            new TextRun({ text: 'Problematização: ', bold: true }),
            new TextRun(data.apresentacao.problematizacao)
          ],
          spacing: { after: 200 }
        }),

        createHeading('Objetivos'),
        new Paragraph({
          children: [
            new TextRun({ text: 'Objetivo Geral: ', bold: true }),
            new TextRun(data.objetivos.geral)
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({ children: [new TextRun({ text: 'Objetivos Específicos:', bold: true })] }),
        ...createBulletList(data.objetivos.especificos),

        createHeading('Metodologia'),
        new Paragraph({
          children: [
            new TextRun({ text: 'Abordagem: ', bold: true }),
            new TextRun(data.metodologia.abordagem)
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({ children: [new TextRun({ text: 'Estratégias:', bold: true })] }),
        ...createBulletList(data.metodologia.estrategias),

        createHeading('Etapas do Projeto'),
        ...etapasContent,

        createHeading('Produto Final'),
        createParagraph(data.produtoFinal.descricao),
        createParagraph(`Forma de apresentação: ${data.produtoFinal.formaApresentacao}`),
        createParagraph(`Público: ${data.produtoFinal.publico}`),

        createHeading('Avaliação'),
        new Paragraph({ children: [new TextRun({ text: 'Critérios:', bold: true })] }),
        ...createBulletList(data.avaliacao.criterios),
        new Paragraph({ children: [new TextRun({ text: 'Instrumentos:', bold: true })] }),
        ...createBulletList(data.avaliacao.instrumentos),

        ...(data.referencias?.length ? [
          createHeading('Referências'),
          ...createBulletList(data.referencias)
        ] : []),

        new Paragraph({
          children: [
            new TextRun({ text: 'Gerado por Planeja+ - planeja.com.br', size: 18, color: '808080' })
          ],
          spacing: { before: 800 }
        })
      ]
    }]
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${sanitizeFilename(data.titulo)}.docx`)
}
