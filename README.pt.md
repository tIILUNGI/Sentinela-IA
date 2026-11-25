<div align="center">

# SENTINELA AI

**Da EvidÃªncia Ã  InteligÃªncia.**

[![Language: English](https://img.shields.io/badge/Language-English-0a1220?style=for-the-badge)](README.md)
[![Idioma: PortuguÃªs](https://img.shields.io/badge/Idioma-Portugu%C3%AAs-1d63ed?style=for-the-badge)](README.pt.md)

**Caderno TÃ©cnico e EspecificaÃ§Ã£o da Plataforma de InteligÃªncia Operacional**

</div>

---

## Ãndice

1. [DeclaraÃ§Ã£o do Problema e Alinhamento](#1-declaraÃ§Ã£o-do-problema-e-alinhamento)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Tour Visual e Elementos da Interface](#3-tour-visual-e-elementos-da-interface)
4. [MÃ³dulos Principais e Motores DeterminÃ­sticos](#4-mÃ³dulos-principais-e-motores-determinÃ­sticos)
5. [Resumo da API](#5-resumo-da-api)
6. [SeguranÃ§a, GovernanÃ§a e Acessibilidade](#6-seguranÃ§a-governanÃ§a-e-acessibilidade)
7. [Estrutura do RepositÃ³rio](#7-estrutura-do-repositÃ³rio)
8. [Conta Demo e Modo Standalone na Vercel](#8-conta-demo-e-modo-standalone-na-vercel)
9. [InstalaÃ§Ã£o Local e Testes](#9-instalaÃ§Ã£o-local-e-testes)

---

## 1. Declaração do Problema & Alinhamento

### O Problema
Organizações em ambientes de alta responsabilidade (administração pública, segurança corporativa, compliance, infraestruturas críticas) enfrentam: **registos fragmentados** em ferramentas desconectadas; **outputs de IA opacos** que fabricam pontuações ou escondem evidências; e **fraca auditabilidade** onde decisões carecem de revisão humana e registos rastreáveis.

### Como o SENTINELA AI Resolve

| Desafio Operacional | Solução SENTINELA AI | Onde no sistema |
| :--- | :--- | :--- |
| **Registos fragmentados** | Espaço multi-tenant unificado ligando incidentes, documentos, evidências, risco, recomendações, tarefas e auditoria. | Command Center /app, 10 módulos, API com escopo X-Organization-ID |
| **IA opaca/não verificável** | Q&A documental com citações (page_number, chunk_index, score, excerto), estado explícito AI unavailable (nunca fabricado), risco determinístico (0–100). | /app/documents, POST /documents/{id}/questions, POST /risks/assess |
| **Fraca auditabilidade / decisões sem revisão** | Aprovação/rejeição humana obrigatória para recomendações, RBAC por organização, trilha de auditoria automática, exportações CSV. | /app/recommendations, /app/audit, /reports/*.csv, RBAC |

### Alinhamento Mensurável
- **Rastreabilidade**: cada resposta documental inclui citações com página, chunk, score e excerto.
- **Sem IA fabricada**: sem provider, o sistema retorna estado indisponível + referências recuperadas.
- **Risco determinístico**: score = round((0.25P + 0.30I + 0.15E + 0.15U + 0.15Q)/5*100); equires_human_review = true quando qualidade da evidência ≤ 2 ou nível high/critical.
- **Supervisão humana**: recomendações exigem aprovar/rejeitar com notas; ações registadas em auditoria.
- **Bilingue e acessível**: EN/PT completo, skip link, focus-visible, ARIA, landmarks.
- **Segurança**: JWT access+refresh, RBAC, isolamento por organização, headers de segurança, rate limit auth, defesa CSV injection, reset com token hash/uso único/expiração.

--- | :--- |
| **Registos fragmentados** em ferramentas isoladas | EspaÃ§o multi-tenant unificado ligando incidentes, documentos, evidÃªncias, avaliaÃ§Ãµes de risco, recomendaÃ§Ãµes, tarefas e auditoria. |
| **Respostas de IA opacas** com pontuaÃ§Ãµes inventadas | CitaÃ§Ãµes RAG ligadas a evidÃªncias (`page_number`, `chunk_index`, `score`), estados explÃ­citos de indisponibilidade de IA e pontuaÃ§Ã£o de risco determinÃ­stica (`0-100`). |
| **Auditabilidade fraca** sem supervisÃ£o | AprovaÃ§Ã£o humana obrigatÃ³ria para recomendaÃ§Ãµes, controlo RBAC por organizaÃ§Ã£o e trilha de auditoria automÃ¡tica. |

---

## 2. Arquitetura do Sistema

```mermaid
flowchart LR
  User["Operador / Analista / Admin"] --> Web["React 19 + TypeScript + Vite (apps/web)"]
  Web -->|"VITE_API_URL configurada"| API["FastAPI + SQLAlchemy 2.0 (apps/api)"]
  Web -->|"Fallback Standalone / Vercel"| Local["localEngine.ts (localStorage)"]
  API --> DB[("PostgreSQL + pgvector / SQLite")]
  API --> AI["Provedor de IA CompatÃ­vel com OpenAI"]
  API --> Pipeline["Pipeline Documental (PyMuPDF / DOCX / OCR)"]
```

| Camada | Tecnologia | Responsabilidade |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 4 | Command Center responsivo, Landing, AutenticaÃ§Ã£o e 10 MÃ³dulos Operacionais |
| **Estado e Dados** | TanStack React Query, Axios | Cache, polling de documentos, fila de refresh JWT automÃ¡tica e fallback local |
| **VisualizaÃ§Ãµes** | Recharts + Matriz 5x5 Interativa | TendÃªncia de 7 dias (`AreaChart`), severidade (`BarChart`), estado (`PieChart`), Matriz 5x5 |
| **Backend API** | FastAPI, SQLAlchemy 2.0, Pydantic v2 | API REST multi-tenant (`/api/v1`), controlo RBAC, documentaÃ§Ã£o OpenAPI `/docs` |
| **PersistÃªncia** | PostgreSQL + pgvector (SQLite para local/testes) | Modelos relacionais e embeddings vetoriais |
| **SeguranÃ§a** | JWT (Access + Refresh), bcrypt, Middleware ASGI | Headers de seguranÃ§a HTTP, isolamento `X-Organization-ID`, proteÃ§Ã£o CSV injection |

---

## 3. Tour Visual e Elementos da Interface

### 3.1 Landing Page (`/`)
EstÃ©tica dark obsidian (`#050607`), emblema animado da marca, seletor bilÃ­ngue (`EN / PT`), barra de capacidades, fluxo de 4 etapas (`Ingerir -> Extrair -> Analisar -> Decidir`), visÃ£o dos 10 mÃ³dulos, garantias de seguranÃ§a e FAQ.

![SENTINELA AI Landing Page](docs/screenshots/landing.jpg)

![SENTINELA AI Dez MÃ³dulos Operacionais](docs/screenshots/modules.jpg)

### 3.2 AutenticaÃ§Ã£o (`/login`, `/register`, `/forgot-password`, `/reset-password`)
Layout split-panel em glassmorphism obsidian com alternÃ¢ncia de visibilidade da palavra-passe, validaÃ§Ã£o de formulÃ¡rio, botÃ£o discreto `Demo` para auto-preenchimento e suporte bilÃ­ngue completo.

![SENTINELA AI Login](docs/screenshots/login.jpg)

### 3.3 Command Center (`/app`)
Barra lateral obsidian estÃ¡tica (`lg:sticky lg:top-0 lg:h-screen`), cabeÃ§alho contextual com organizaÃ§Ã£o e cargo (`EspaÃ§o de Trabalho / Sentinela Global Ops Â· Super Admin`), 8 cartÃµes de KPI executivos, 3 grÃ¡ficos interativos (tendÃªncia de 7 dias, severidade, estado), atividade recente e exportaÃ§Ã£o CSV autenticada com 1 clique.

![SENTINELA AI Command Center](docs/screenshots/dashboard.png)

### 3.4 InteligÃªncia de Incidentes (`/app/incidents`)
Registo estruturado de incidentes, filtros em tempo real (`pesquisa`, `estado`, `severidade`), atualizaÃ§Ã£o inline de estado (`open`, `in_progress`, `resolved`, `closed`) e triagem estruturada assistida por IA com extraÃ§Ã£o de lacunas de informaÃ§Ã£o e prÃ³ximos passos.

![SENTINELA AI Incidentes](docs/screenshots/incidents.png)

### 3.5 InteligÃªncia de Risco e Matriz 5x5 (`/app/risks`)
**Matriz de Risco 5x5** interativa (`Probabilidade 5..1` x `Impacto 1..5`) posicionada lado a lado com a lista filtrada de riscos, zonas de criticidade por cor, seleÃ§Ã£o direta por clique na matriz e cÃ¡lculo determinÃ­stico de 5 fatores.

![SENTINELA AI Matriz de Risco 5x5](docs/screenshots/risks-matrix.png)

### 3.6 InteligÃªncia Documental, EvidÃªncias, RecomendaÃ§Ãµes, Tarefas e Auditoria
- **Documentos (`/app/documents`)**: IngestÃ£o de PDF/DOCX/TXT com integridade `SHA-256`, polling automÃ¡tico e Q&A com citaÃ§Ãµes.
- **EvidÃªncias e CorrelaÃ§Ã£o (`/app/evidence`)**: Cofre de evidÃªncias associado a incidentes reais com sugestÃµes de correlaÃ§Ã£o cruzada.
- **RecomendaÃ§Ãµes (`/app/recommendations`)**: Fluxo humano de aprovaÃ§Ã£o/rejeiÃ§Ã£o com notas de revisÃ£o e filtro por estado.
- **Tarefas (`/app/tasks`) e Auditoria (`/app/audit`)**: GestÃ£o de tarefas de resoluÃ§Ã£o e registos de auditoria filtrÃ¡veis.

![SENTINELA AI Documentos](docs/screenshots/documents.png)

![SENTINELA AI EvidÃªncias](docs/screenshots/evidence.png)

![SENTINELA AI RecomendaÃ§Ãµes](docs/screenshots/recommendations.png)

![SENTINELA AI Tarefas](docs/screenshots/tasks.png)

![SENTINELA AI Auditoria](docs/screenshots/audit.png)

### 3.7 Perfil e SeguranÃ§a (`/app/profile`)
Banner executivo centralizado com avatar de iniciais, badges de estado e cargo RBAC, ediÃ§Ã£o de identidade pessoal (`PATCH /auth/me`), alteraÃ§Ã£o de palavra-passe com indicador de forÃ§a (`POST /auth/change-password`), pills de permissÃµes RBAC da organizaÃ§Ã£o e encerramento de sessÃ£o seguro.

![SENTINELA AI Perfil](docs/screenshots/profile.png)

---

## 4. MÃ³dulos Principais e Motores DeterminÃ­sticos

1. **InteligÃªncia Documental (`/app/documents`)**: Upload de `PDF`, `DOCX` e `TXT`, cÃ¡lculo de hash `SHA-256`, polling automÃ¡tico de estado (`uploaded` -> `processing` -> `ready`) e perguntas com citaÃ§Ãµes de pÃ¡gina, segmento e pontuaÃ§Ã£o.
2. **Cofre de EvidÃªncias e CorrelaÃ§Ã£o (`/app/evidence`)**: AssociaÃ§Ã£o de evidÃªncias (`report`, `photo`, `document`, `testimony`, `log`, `other`) aos incidentes reais da organizaÃ§Ã£o e sugestÃµes determinÃ­sticas de correlaÃ§Ã£o cruzada.
3. **FÃ³rmula DeterminÃ­stica de Risco**:
   $$\text{Score} = \text{round}\left(\frac{0.25P + 0.30I + 0.15E + 0.15U + 0.15Q}{5} \times 100\right)$$
   - `critical` ($\ge 75$), `high` ($\ge 55$), `moderate` ($\ge 35$), `low` ($< 35$).
   - `requires_human_review = True` sempre que `evidence_quality <= 2` ou `level in {"high", "critical"}`.
4. **Apoio Ã  DecisÃ£o (`/app/recommendations`)**: Fluxo humano de aprovaÃ§Ã£o/rejeiÃ§Ã£o com notas obrigatÃ³rias de revisÃ£o e filtro por estado.
5. **Tarefas de ResoluÃ§Ã£o (`/app/tasks`) e Auditoria (`/app/audit`)**: GestÃ£o de tarefas e registos de auditoria filtrÃ¡veis por `action` e `resource_type`.

---

## 5. Resumo da API

| DomÃ­nio | Endpoints Principais |
| :--- | :--- |
| **AutenticaÃ§Ã£o e Perfil** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `PATCH /auth/me`, `POST /auth/change-password`, `POST /auth/logout` |
| **Incidentes** | `GET /incidents`, `POST /incidents`, `PATCH /incidents/{id}`, `POST /incidents/{id}/analyze`, `GET /incidents/{id}/analysis` |
| **Documentos** | `GET /documents`, `POST /documents/upload`, `POST /documents/{id}/analyze`, `POST /documents/{id}/questions` |
| **EvidÃªncias e Risco** | `GET /evidence`, `POST /evidence`, `POST /evidence/correlate`, `GET /risks`, `POST /risks/assess` |
| **DecisÃµes e Tarefas** | `GET /recommendations`, `POST /recommendations`, `POST /recommendations/{id}/approve\|reject`, `GET/POST /tasks`, `PATCH /tasks/{id}` |
| **Analytics e Auditoria** | `GET /analytics/overview`, `GET /reports/incidents.csv\|risks.csv\|recommendations.csv`, `GET /audit` |

---

## 6. SeguranÃ§a, GovernanÃ§a e Acessibilidade

- **Isolamento Multi-Tenant**: Todas as chamadas operacionais exigem `X-Organization-ID` validado contra vÃ­nculos ativos (`Membership`).
- **PapÃ©is RBAC**: `Super Admin`, `Organization Admin`, `Manager`, `Analyst`, `Operator`, `Viewer` validados ao nÃ­vel das dependÃªncias FastAPI.
- **Headers ASGI de SeguranÃ§a**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- **ProteÃ§Ã£o contra CSV Injection**: CÃ©lulas iniciadas por `=`, `+`, `-`, `@`, `\t` ou `\r` sÃ£o neutralizadas com apÃ³strofo inicial.
- **Acessibilidade**: Marcos semÃ¢nticos, link "Skip to content", contorno `:focus-visible`, `aria-label` em formulÃ¡rios, menu mobile acessÃ­vel (`aria-expanded`, `aria-controls`) e atualizaÃ§Ã£o dinÃ¢mica de `<html lang>`.

---

## 7. Estrutura do RepositÃ³rio

```text
sentinela-ai/
  apps/
    api/
      app/
        ai/              # AbstraÃ§Ã£o de provedores de IA e adaptador OpenAI
        api/             # DependÃªncias JWT/org/RBAC e endpoints v1
        core/            # ConfiguraÃ§Ãµes, hash de senhas, JWT, localizaÃ§Ã£o
        db/              # Base SQLAlchemy, sessÃ£o, tipos portÃ¡teis e seed demo
        models/          # Modelos relacionais e vetoriais
        schemas/         # Contratos Pydantic v2
        services/        # Motor de risco, extraÃ§Ã£o documental, auditoria, mailer, storage
      tests/             # Testes unitÃ¡rios e de fluxo completo da API
    web/
      src/
        components/      # Componentes UI, AuthShell, AppLayout, Logo
        lib/             # Cliente Axios (refresh + fallback local), AuthProvider, i18n
        pages/           # PÃ¡ginas pÃºblicas e mÃ³dulos /app/*
      vercel.json        # Regras de rewrite SPA
  docs/
    screenshots/         # Capturas reais da aplicaÃ§Ã£o
  docker-compose.yml
  vercel.json
  .env.example
```

---

## 8. Conta Demo e Modo Standalone na Vercel

Tanto o seed do backend (`apps/api/app/db/seed_demo.py`) como o motor local do frontend (`apps/web/src/lib/localEngine.ts`) incluem uma Conta Demo prÃ©-populada:

- **Email**: `demo@sentinela.ai`
- **Palavra-passe**: `SentinelaDemo2026!`
- **Preenchimento RÃ¡pido**: Clique no botÃ£o discreto `Demo` em `/login` para preencher automaticamente as credenciais.

Ao publicar na **Vercel** sem uma `VITE_API_URL` externa, o SENTINELA AI ativa automaticamente o motor `localEngine.ts` (`localStorage`), permitindo criar contas, entrar, explorar os dados demo e operar todos os mÃ³dulos.

---

## 9. InstalaÃ§Ã£o Local e Testes

```bash
# 1. Configurar variÃ¡veis de ambiente
cp .env.example .env
cp apps/web/.env.example apps/web/.env

# 2. Backend (apps/api)
cd apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate | Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
python -m unittest discover -s tests -v
uvicorn app.main:app --reload --port 8000

# 3. Frontend (apps/web)
cd apps/web
npm install
npm run lint
npm run build
npm run dev
```

