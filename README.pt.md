<div align="center">

# SENTINELA AI

**Da Evidência à Inteligência.**

[![Language: English](https://img.shields.io/badge/Language-English-0a1220?style=for-the-badge)](README.md)
[![Idioma: Português](https://img.shields.io/badge/Idioma-Portugu%C3%AAs-1d63ed?style=for-the-badge)](README.pt.md)

Plataforma multissetorial de inteligência operacional concebida para transformar incidentes, documentos e evidências operacionais dispersos em decisões estruturadas, rastreáveis e supervisionadas por humanos.

</div>

---

## Declaração do Problema e Alinhamento

Organizações que operam em ambientes de elevada responsabilidade (administração pública, segurança corporativa, conformidade e infraestruturas críticas) enfrentam três gargalos recorrentes:

1. **Registos operacionais fragmentados**: Incidentes, documentos de suporte (PDF, DOCX, TXT) e evidências de campo vivem em ferramentas isoladas sem correlação entre si.
2. **Respostas de IA opacas**: Assistentes genéricos produzem resumos sem fundamentação ou inventam pontuações de risco sem citar os documentos de origem nem exigir supervisão humana.
3. **Auditabilidade fraca**: Decisões operacionais e alterações de estado carecem de trilhas de auditoria que liguem quem agiu, o que mudou e quais evidências sustentaram a conclusão.

**Como o SENTINELA AI resolve estes desafios:**

- **Pipeline RAG baseado em evidências**: Documentos carregados recebem hash `SHA-256`, são extraídos, segmentados em chunks e indexados para Q&A com citações explícitas de página, segmento e pontuação.
- **Estados explícitos de disponibilidade de IA**: Quando `AI_API_KEY` não está configurada ou o provedor está indisponível, os endpoints retornam erro explícito em vez de respostas simuladas.
- **Pontuação de risco determinística**: A pontuação (`0-100`) e o nível (`low`, `moderate`, `high`, `critical`) são calculados de forma determinística a partir de `probability`, `impact`, `exposure`, `urgency` e `evidence_quality`, sinalizando casos críticos ou de baixa evidência para revisão humana obrigatória.
- **Governança com supervisão humana**: Recomendações exigem aprovação ou rejeição humana explícita com notas de revisão, e todas as ações críticas são registadas na trilha de auditoria.
- **Pronto para Vercel (Standalone ou Full-Stack)**: Funciona tanto com o backend completo FastAPI + PostgreSQL/pgvector como em deploy apenas de frontend na Vercel, através do motor de persistência local (`localStorage`) já populado com dados de demonstração.

---

## Arquitetura e Stack Tecnológica

| Camada | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 4 | Command Center responsivo, Landing, Autenticação e 10 Módulos Operacionais |
| **Estado e Dados** | TanStack React Query, Axios (com fila de refresh JWT) | Cache, polling automático de documentos e renovação automática de token |
| **Motor Standalone** | `localEngine.ts` (`localStorage`) | Persistência local automática para deploys frontend-only (ex. Vercel) |
| **Gráficos** | Recharts | Tendência de 7 dias (Área), severidade (Barras) e estado (Circular) |
| **Backend API** | FastAPI, SQLAlchemy 2.0, Pydantic v2 | API REST multi-tenant (`/api/v1`), controlo RBAC, documentação OpenAPI |
| **Base de Dados** | PostgreSQL + pgvector (SQLite suportado para dev/testes) | Persistência multi-tenant e pesquisa vetorial |
| **Pipeline Documental** | PyMuPDF, python-docx, Tesseract OCR (opcional) | Extração de texto, mapeamento de páginas, chunking e embeddings |
| **Segurança** | JWT (Access + Refresh), bcrypt, Headers ASGI | Isolamento organizacional via `X-Organization-ID` e proteção contra CSV injection |

---

## Fluxo Operacional Completo

1. **Landing e Autenticação (`/`, `/login`, `/register`, `/forgot-password`, `/reset-password`)**: Interface bilíngue (`EN / PT`) com JWT access/refresh, recuperação de palavra-passe e acesso rápido à Conta Demo.
2. **Command Center (`/app`)**: Indicadores executivos (total, abertos, críticos, resolvidos; documentos prontos; evidências; risco médio; recomendações pendentes), 3 gráficos interativos, atividade recente e exportação CSV com 1 clique.
3. **Incidentes (`/app/incidents`)**: Registo estruturado, pesquisa e filtros em tempo real (`status`, `severity`), atualização inline de estado e análise assistida por IA.
4. **Documentos (`/app/documents`)**: Upload de `PDF`, `DOCX` ou `TXT` com polling automático de estado (`uploaded` -> `processing` -> `ready`), selo de integridade `SHA-256`, reprocessamento e Q&A com citações.
5. **Evidências e Correlação (`/app/evidence`)**: Cofre de evidências associado aos incidentes reais da organização e sugestões automáticas de correlação entre incidentes.
6. **Inteligência de Risco (`/app/risks`)**: Motor determinístico de 5 fatores associado a incidentes, com sinalização automática de revisão humana.
7. **Apoio à Decisão (`/app/recommendations`)**: Recomendações com justificação, limitações, filtro por estado e fluxo humano de aprovação/rejeição.
8. **Tarefas de Resolução (`/app/tasks`)**: Gestão de tarefas com transição de estados (`open`, `in_progress`, `resolved`, `closed`).
9. **Auditoria e Conformidade (`/app/audit`)**: Registo de auditoria filtrável por `action` e `resource_type`.
10. **Perfil e Segurança (`/app/profile`)**: Edição de nome (`PATCH /auth/me`), alteração de palavra-passe (`POST /auth/change-password`), visualização de organizações/permissões RBAC e término de sessão seguro.

---

## Conta Demo e Dados Pré-Populados

Tanto o seed do backend (`apps/api/app/db/seed_demo.py`) como o motor standalone do frontend (`apps/web/src/lib/localEngine.ts`) vêm pré-populados com uma Conta Demo completa (incidentes, análises, documentos, evidências, avaliações de risco, recomendações, tarefas e logs de auditoria):

- **Email**: `demo@sentinela.ai`
- **Palavra-passe**: `SentinelaDemo2026!`
- **Acesso Rápido**: Clique em `Demo: demo@sentinela.ai` na página `/login`

Também é possível criar novas contas em `/register`; no modo frontend-only (Vercel), as novas contas e todos os dados criados ficam guardados no `localStorage` do navegador.

---

## Estrutura do Repositório

```text
sentinela-ai/
  apps/
    api/
      app/
        ai/              # Abstração de provedores de IA e adaptador OpenAI
        api/             # Dependências FastAPI (JWT, isolamento org, RBAC) e routers v1
        core/            # Configurações, segurança e localização
        db/              # Base SQLAlchemy, sessão, tipos portáteis e seed demo
        models/          # Modelos de domínio (User, Organization, Incident, Document, Evidence, Risk, etc.)
        schemas/         # Contratos Pydantic de entrada e saída
        services/        # Motor de risco, extração documental, auditoria, mailer e storage
      tests/             # Testes unitários e de fluxo operacional completo
    web/
      src/
        components/      # Componentes UI, AuthShell, AppLayout e Logótipo
        lib/             # Cliente Axios com refresh e fallback local, AuthProvider, i18n (EN/PT)
        pages/           # Páginas públicas e módulos /app/*
      vercel.json        # Regras de rewrite SPA para a Vercel
  docs/                  # Documentação técnica
  docker-compose.yml
  vercel.json            # Configuração de deploy na Vercel pela raiz
  .env.example
```

---

## Arranque Rápido (Desenvolvimento Local)

### 1. Pré-requisitos

- Python 3.12+
- Node.js 20+
- Docker e Docker Compose (opcional, para PostgreSQL + pgvector)

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

Defina `AI_API_KEY` no ficheiro `.env` (nunca faça commit do `.env`) para ativar a análise real de incidentes e síntese RAG. Sem esta chave, os endpoints reportam indisponibilidade explícita.

### 3. Executar Backend API

```bash
cd apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate | Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

- API Base: `http://localhost:8000`
- Documentação OpenAPI: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 4. Executar Frontend Web

```bash
cd apps/web
npm install
npm run dev
```

- Aplicação Web: `http://localhost:5173`

---

## Deploy na Vercel (Frontend-Only ou Full-Stack)

1. Importe o repositório GitHub na **Vercel**.
2. O ficheiro `vercel.json` na raiz instala automaticamente as dependências de `apps/web`, executa `npm run build`, publica `apps/web/dist` e aplica rewrites de SPA (`/(.*) -> /index.html`).
3. **Modo Frontend-Only**: Sem `VITE_API_URL` configurado, o SENTINELA AI ativa automaticamente o motor de persistência local (`localStorage`), permitindo criar contas, iniciar sessão, explorar a conta demo e operar todos os módulos.
4. **Modo Full-Stack**: Publique `apps/api` (ex. Render, Railway ou Fly.io) com PostgreSQL e defina `VITE_API_URL=https://sua-api.com/api/v1` nas Environment Variables da Vercel.

---

## Testes e Verificação de Qualidade

### Testes do Backend

```bash
cd apps/api
python -m unittest discover -s tests -v
```

Cobre pontuação de risco determinística, permissões RBAC, proteção contra CSV formula injection, seed demo idempotente, ciclo completo de autenticação (registo, perfil, troca de palavra-passe, refresh), gestão multi-tenant de incidentes, correlação de evidências, aprovação de recomendações, tarefas, agregação analítica e auditoria.

### Lint e Build de Produção do Frontend

```bash
cd apps/web
npm run lint
npm run build
```

---

## Destaques de Segurança

- **Multi-Tenancy Rigoroso**: Todas as operações no workspace são isoladas por `X-Organization-ID` e validadas contra os vínculos ativos do utilizador.
- **Permissões RBAC**: Verificações granulares (`incidents:*`, `documents:*`, `risks:*`, `recommendations:*`, `audit:read`, `reports:*`) aplicadas ao nível das dependências.
- **Headers de Segurança HTTP**: Middleware ASGI puro com `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy`.
- **Proteção em Exportação CSV**: Células iniciadas por `=`, `+`, `-`, `@`, `\t` ou `\r` são neutralizadas contra formula injection.
- **Guarda de Segredo em Produção**: O arranque falha imediatamente se `APP_ENV=production` usar a `SECRET_KEY` padrão.
