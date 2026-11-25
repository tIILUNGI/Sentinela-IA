# AI ENGINEERING

## Principles

- AI assists; humans validate critical decisions.
- No fake AI outputs. If provider is unavailable, API returns explicit error/status.
- Document/external content is untrusted data.
- Risk final score is deterministic in code.

## Provider Abstraction

`app/ai/base.py` defines `AIProvider` with `generate_text` and `embed_texts`.  
`app/ai/factory.py` selects provider by config.  
`app/ai/openai_provider.py` implements OpenAI-compatible chat and embeddings over HTTP.

## Environment Variables

- `AI_PROVIDER` - `openai`, `azure_openai`, `openai_compatible`, or `mock/disabled`
- `AI_API_KEY` - provider key (never exposed to frontend)
- `AI_MODEL` - chat model for analysis/synthesis
- `AI_VISION_MODEL` - reserved for vision workflows
- `EMBEDDING_MODEL` - embedding model
- `AI_BASE_URL` - optional OpenAI-compatible base URL
- `AI_TIMEOUT_SECONDS` - request timeout

## Implemented AI Services

### IncidentAnalyzer
Endpoint: `POST /api/v1/incidents/{id}/analyze`  
Uses structured JSON prompt, stores `IncidentAnalysis`, logs audit event. User can review results in UI.

### DocumentQuestionAnswering (RAG)
Endpoint: `POST /api/v1/documents/{id}/questions`  
Retrieves top chunks by pgvector cosine distance, builds context, asks LLM to answer only from excerpts. Returns answer + citations (document/page/chunk/excerpt/score). If AI unavailable, returns retrieved citations with explicit unavailable message.

## Validation & Safety

- JSON parsing with salvage for analysis responses.
- Errors surfaced as 503/502 with clear detail.
- Prompts instruct model not to invent facts.
- External document content treated as data, not instructions.

## Extensibility

Add providers by implementing `AIProvider` and registering in factory. Add specialized services (EvidenceCorrelator, RecommendationEngine, Vision analysis) as separate modules with Pydantic-validated outputs.
