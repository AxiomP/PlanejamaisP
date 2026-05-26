# Planeja+ · SaaS Educacional com IA

> **Micro SaaS** que automatiza a criação de conteúdo pedagógico alinhado à BNCC, utilizando inteligência artificial generativa (Google Gemini).

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Mercado Pago](https://img.shields.io/badge/Mercado_Pago-009EE3?style=for-the-badge&logo=mercadopago&logoColor=white)
![VPS](https://img.shields.io/badge/Infra-VPS-2C3E7D?style=for-the-badge)

---

## 📌 Índice

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura e Decisões Técnicas](#-arquitetura-e-decisões-técnicas)
- [Funcionalidades Implementadas](#-funcionalidades-implementadas)
- [Execução Local](#-execução-local)
- [Ambiente e Variáveis](#-ambiente-e-variáveis)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Roadmap (próximos passos)](#-roadmap-próximos-passos)
- [Autor e Contato](#-autor-e-contato)

---

## 🧭 Visão Geral

**Planeja+** é um sistema web que reduz o tempo de planejamento de professores de horas para minutos. O usuário seleciona uma ferramenta (plano de aula, prova, lista de exercícios, chatbot, etc.), descreve o conteúdo desejado, e o sistema gera um material estruturado e pronto para uso, respeitando os códigos da **Base Nacional Comum Curricular (BNCC)**.

O projeto foi concebido com arquitetura SaaS, incluindo:
- Autenticação com Supabase Auth (e-mail + Google OAuth)
- Sistema de créditos/gerações com validação de limites
- Integração com Google Gemini Pro para geração de conteúdo
- Webhooks do Mercado Pago para planos de assinatura (em andamento)
- Infraestrutura auto-hospedada em VPS (deploy manual/automatizado)

---

## 🧠 Stack Tecnológica

| Camada | Tecnologia | Finalidade |
|--------|------------|------------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS | Interface reativa, roteamento, estilização utilitária |
| **Backend** | Next.js API Routes + Node.js | Endpoints RESTful, lógica de negócio e integrações |
| **Banco de Dados** | Supabase (PostgreSQL) + RLS | Armazenamento relacional, segurança em nível de linha |
| **Autenticação** | Supabase Auth (JWT, OAuth) | Login seguro, gerenciamento de sessões |
| **IA Generativa** | Google Gemini Pro (API REST) | Geração de conteúdo educacional em português |
| **Pagamentos** | Mercado Pago | Checkout transparente, webhooks, planos |
| **Infraestrutura** | VPS dedicado (Ubuntu, PM2, Nginx) | Controle total sobre deploy e escalabilidade |

---

## 🏛️ Arquitetura e Decisões Técnicas

- **Separação em camadas**: rotas API (controladores) → serviços (lógica) → clientes Supabase/Gemini.
- **Validação de entrada**: Zod para schemas e sanitização de dados.
- **Proteção de rotas**: middleware Next.js combinado com verificação de sessão Supabase.
- **Edge functions não utilizadas**: optou-se por API routes tradicionais por simplicidade e menor latência no VPS.
- **RLS obrigatório**: todas as tabelas possuem políticas row‑level security; o frontend nunca acessa o banco com role de serviço.
- **Limitação de créditos**: cada geração consome um crédito (controlado via trigger/validação aplicacional).

---

## ✅ Funcionalidades Implementadas

| Módulo | Status | Descrição |
|--------|--------|-----------|
| Autenticação | ✅ Concluído | Login, cadastro, recuperação de senha (Supabase Auth + Google OAuth) |
| Dashboard | ✅ Concluído | Histórico de gerações, saldo de créditos, gráficos de uso |
| 10 Ferramentas IA | ✅ Concluído | Plano de aula, prova, lista de exercícios, sequência didática, texto de apoio, atividades, PEI/PDI, reescritor, projeto educacional, chatbot BNCC |
| Chatbot BNCC | ✅ Concluído | Assistente virtual especializado na Base Nacional (contexto com Gemini) |
| Sistema de créditos | ✅ Concluído | Consumo por geração, recarga via painel administrativo |
| Área administrativa | ✅ Concluído | Gestão de templates, prompts e visualização de usuários |
| Exportação PDF | ✅ Concluído | Geração de PDF via API (conteúdo formatado) |
| Integração Mercado Pago | 🚧 Em andamento | Webhooks para assinaturas recorrentes |
| Deploy automatizado | 🚧 Em andamento | GitHub Actions → VPS (estrutura sendo finalizada) |

---

## 🚀 Execução Local

### Pré‑requisitos

- Node.js 18+
- Contas: [Supabase](https://supabase.com), [Google AI Studio](https://makersuite.google.com/app/apikey)
- (Opcional) Conta Mercado Pago – pode ser configurada posteriormente

### Passos


# 1. Clonar repositório
git clone https://github.com/AxiomP/planejamais.git
cd planejamais

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais (Supabase, Gemini, Mercado Pago)

# 4. Executar migrations e seeds no Supabase (ver SETUP.md)
# - Criar projeto no Supabase
# - Executar arquivos SQL em supabase/migrations/ (ordem numérica)
# - Opcional: executar supabase/seeds/initial_data.sql

# 5. Iniciar servidor de desenvolvimento
npm run dev


Acesse `http://localhost:3000`.

### Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com hot‑reload |
| `npm run build` | Build de produção (otimizado) |
| `npm run start` | Executa o build em modo produção |
| `npm run lint` | Verifica estilo de código com ESLint |
| `npm run type-check` | Checagem estática de tipos TypeScript |

---

## 📁 Estrutura do Projeto (resumida)

```
planejamais/
├── src/
│   ├── app/                  # App Router Next.js
│   │   ├── (auth)/           # Login, cadastro, recuperação
│   │   ├── (dashboard)/      # Rotas protegidas pós-autenticação
│   │   ├── api/              # API routes (geracoes, pagamentos, webhooks)
│   │   └── layout.tsx
│   ├── components/           # UI reutilizável (shadcn/ui + custom)
│   ├── lib/
│   │   ├── supabase/         # Clientes (client, server, admin)
│   │   ├── gemini/           # Cliente e prompts para Google Gemini
│   │   ├── validations/      # Schemas Zod para forms e requests
│   │   └── services/         # Lógica de negócio (geração, créditos, etc.)
│   ├── contexts/             # Contextos React (auth, tema, etc.)
│   └── middleware.ts         # Proteção de rotas + refresh de sessão
├── supabase/
│   ├── migrations/           # SQL versionado (09 arquivos)
│   └── seeds/                # Dados iniciais (exemplo BNCC)
├── public/                   # Assets estáticos
├── .env.example              # Modelo de variáveis públicas
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🗺️ Roadmap (próximos passos)

- [ ] **Webhook Mercado Pago**: assinaturas mensais e renovação de créditos automática.
- [ ] **Deploy automatizado via GitHub Actions** para o VPS (com testes e rollback simples).
- [ ] **Monitoramento e logging** (opcional: Sentry ou similar).
- [ ] **Testes automatizados** (unitários com Jest, e2e com Playwright).

---

## 📫 Autor e Contato

**Gustavo Maia** – Desenvolvedor Backend & Full Stack  

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/AxiomP)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gm5/)
[![E-mail](https://img.shields.io/badge/Email-D14836?style=flat&logo=gmail&logoColor=white)](mailto:maia050604@gmail.com)

---

*“Código consistente, arquitetura limpa e IA aplicada à educação.”*
