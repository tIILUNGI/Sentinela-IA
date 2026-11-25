import type { InternalAxiosRequestConfig } from 'axios'

const DB_KEY = 'sentinela_local_db_v1'

type LocalUser = {
  id: string
  name: string
  email: string
  password: string
  status: string
  is_superuser: boolean
  organization_id: string
}

type LocalOrg = { id: string; name: string; slug: string }

type LocalDB = {
  users: LocalUser[]
  orgs: LocalOrg[]
  incidents: any[]
  analyses: Record<string, any[]>
  documents: any[]
  chunks: Record<string, { page_number: number; chunk_index: number; content: string }[]>
  evidence: any[]
  risks: any[]
  recommendations: any[]
  tasks: any[]
  audit: any[]
}

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function daysAgoIso(days: number) {
  const d = new Date(Date.now() - days * 86400_000)
  return d.toISOString()
}

function createInitialDB(): LocalDB {
  const orgId = '11111111-1111-4111-8111-111111111111'
  const demoUserId = '22222222-2222-4222-8222-222222222222'
  const inc1 = '33333333-3333-4333-8333-333333333301'
  const inc2 = '33333333-3333-4333-8333-333333333302'
  const inc3 = '33333333-3333-4333-8333-333333333303'
  const inc4 = '33333333-3333-4333-8333-333333333304'
  const inc5 = '33333333-3333-4333-8333-333333333305'
  const inc6 = '33333333-3333-4333-8333-333333333306'
  const doc1 = '44444444-4444-4444-8444-444444444401'

  return {
    orgs: [{ id: orgId, name: 'Sentinela Global Ops', slug: 'sentinela-ops' }],
    users: [
      {
        id: demoUserId,
        name: 'Helena Vance',
        email: 'demo@sentinela.ai',
        password: 'SentinelaDemo2026!',
        status: 'active',
        is_superuser: true,
        organization_id: orgId,
      },
    ],
    incidents: [
      {
        id: inc1,
        organization_id: orgId,
        title: 'Unauthorized API token replay on gateway EU-West',
        description: 'Repeated bearer token replay detected from unrecognized ASN targeting telemetry ingestion endpoints.',
        category: 'Cybersecurity',
        location: 'Frankfurt DC-2',
        source: 'SIEM Alert',
        severity: 'critical',
        priority: 'critical',
        status: 'in_progress',
        created_at: daysAgoIso(0),
      },
      {
        id: inc2,
        organization_id: orgId,
        title: 'Substation B4 thermal sensor drift',
        description: 'Transformer bay 4 telemetry reported +14C variance over baseline during peak load.',
        category: 'Infrastructure',
        location: 'Lisbon Grid B4',
        source: 'SCADA',
        severity: 'high',
        priority: 'high',
        status: 'open',
        created_at: daysAgoIso(1),
      },
      {
        id: inc3,
        organization_id: orgId,
        title: 'Unverified vendor access in archive vault',
        description: 'Contractor badge accessed physical document room outside scheduled maintenance window.',
        category: 'Compliance',
        location: 'HQ Vault 1',
        source: 'Access Control',
        severity: 'medium',
        priority: 'medium',
        status: 'open',
        created_at: daysAgoIso(2),
      },
      {
        id: inc4,
        organization_id: orgId,
        title: 'Delayed customs manifest reconciliation',
        description: 'Batch #4092 logistics manifest missing signed customs clearance attachment.',
        category: 'Supply Chain',
        location: 'Port Terminal 3',
        source: 'ERP Sync',
        severity: 'medium',
        priority: 'low',
        status: 'resolved',
        created_at: daysAgoIso(3),
      },
      {
        id: inc5,
        organization_id: orgId,
        title: 'TLS certificate expiration warning on partner webhook',
        description: 'Partner callback endpoint certificate expires in 72 hours.',
        category: 'Infrastructure',
        location: 'Cloud Edge',
        source: 'Cert Monitor',
        severity: 'low',
        priority: 'medium',
        status: 'resolved',
        created_at: daysAgoIso(4),
      },
      {
        id: inc6,
        organization_id: orgId,
        title: 'Anomalous bulk export from compliance archive',
        description: 'Service account exported 1,420 audit records outside regular reporting schedule.',
        category: 'Data Governance',
        location: 'Core DB',
        source: 'DLP Sensor',
        severity: 'critical',
        priority: 'high',
        status: 'open',
        created_at: daysAgoIso(5),
      },
    ],
    analyses: {
      [inc1]: [
        {
          id: uid(),
          suggested_severity: 'critical',
          status: 'completed',
          summary: 'High-confidence token replay pattern originating from external ASN targeting telemetry endpoints.',
          justification: 'Correlates with SIEM anomaly burst and edge firewall rate-limit triggers.',
          missing_information: ['ASN ownership verification', 'Revocation status of compromised client ID'],
          recommended_next_steps: ['Revoke active refresh tokens for affected service client', 'Enforce IP allowlist on gateway EU-West'],
        },
      ],
    },
    documents: [
      {
        id: doc1,
        organization_id: orgId,
        title: 'Operational Security & Incident Response SOP v3.2',
        file_name: 'sentinela_sop_v3.2.pdf',
        page_count: 12,
        status: 'ready',
        file_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        created_at: daysAgoIso(3),
      },
    ],
    chunks: {
      [doc1]: [
        {
          page_number: 4,
          chunk_index: 0,
          content: 'Section 4.2 Token Compromise: Upon detecting bearer token replay, operators must revoke active sessions within 15 minutes and preserve gateway access logs.',
        },
        {
          page_number: 7,
          chunk_index: 1,
          content: 'Section 7.1 Thermal Telemetry: Transformer bays exceeding +10C variance require load redistribution and physical thermal inspection.',
        },
      ],
    },
    evidence: [
      {
        id: uid(),
        organization_id: orgId,
        incident_id: inc1,
        title: 'Gateway EU-West Edge Access Log',
        type: 'log',
        source: 'Cloudflare WAF',
        description: 'Captured 412 replayed authorization headers within 90 seconds.',
        created_at: daysAgoIso(0),
      },
      {
        id: uid(),
        organization_id: orgId,
        incident_id: inc2,
        title: 'SCADA Thermal Telemetry Snapshot',
        type: 'report',
        source: 'Substation B4 PLC',
        description: 'Peak reading 89.4C recorded at 14:22 UTC.',
        created_at: daysAgoIso(1),
      },
      {
        id: uid(),
        organization_id: orgId,
        incident_id: inc3,
        title: 'Vault Badge Entry Audit',
        type: 'document',
        source: 'Physical Security',
        description: 'Badge #C-8841 entry logged at 22:41 UTC.',
        created_at: daysAgoIso(2),
      },
      {
        id: uid(),
        organization_id: orgId,
        incident_id: inc6,
        title: 'DLP Export Query Trace',
        type: 'log',
        source: 'PostgreSQL Audit',
        description: 'Bulk SELECT executed by svc-compliance-exporter.',
        created_at: daysAgoIso(5),
      },
    ],
    risks: [
      { id: uid(), organization_id: orgId, incident_id: inc1, probability: 5, impact: 5, exposure: 4, urgency: 5, evidence_quality: 4, score: 92, level: 'critical', requires_human_review: true, justification: 'Active external token replay with corroborated WAF logs.', created_at: daysAgoIso(0) },
      { id: uid(), organization_id: orgId, incident_id: inc2, probability: 4, impact: 4, exposure: 4, urgency: 4, evidence_quality: 4, score: 80, level: 'critical', requires_human_review: true, justification: 'Sustained thermal drift on primary transformer bay.', created_at: daysAgoIso(1) },
      { id: uid(), organization_id: orgId, incident_id: inc6, probability: 4, impact: 5, exposure: 3, urgency: 5, evidence_quality: 4, score: 84, level: 'critical', requires_human_review: true, justification: 'Sensitive bulk export requires immediate DLP review.', created_at: daysAgoIso(5) },
      { id: uid(), organization_id: orgId, incident_id: inc3, probability: 2, impact: 3, exposure: 3, urgency: 2, evidence_quality: 3, score: 48, level: 'moderate', requires_human_review: false, justification: 'Single off-hours badge entry under review.', created_at: daysAgoIso(2) },
    ],
    recommendations: [
      { id: uid(), organization_id: orgId, incident_id: inc1, title: 'Rotate gateway signing keys and block ASN', description: 'Revoke compromised client credentials and apply temporary ASN rate-limit.', priority: 'critical', status: 'pending', justification: 'Stops active replay vector immediately.', limitations: 'May briefly disconnect legacy telemetry agents.', created_at: daysAgoIso(0) },
      { id: uid(), organization_id: orgId, incident_id: inc2, title: 'Shift 30% load off Substation B4', description: 'Redistribute feeder load to B2 while inspecting cooling fans.', priority: 'high', status: 'pending', justification: 'Prevents thermal trip during peak hours.', limitations: 'Requires grid dispatch coordination.', created_at: daysAgoIso(1) },
      { id: uid(), organization_id: orgId, incident_id: inc6, title: 'Restrict bulk audit export to MFA-verified sessions', description: 'Enforce step-up authentication for exports above 500 rows.', priority: 'high', status: 'approved', justification: 'Mitigates silent data exfiltration.', limitations: 'Minor friction for monthly compliance exports.', review_notes: 'Approved by security lead.', created_at: daysAgoIso(4) },
    ],
    tasks: [
      { id: uid(), organization_id: orgId, title: 'Revoke compromised gateway client ID', description: 'Invalidate tokens and rotate OAuth secret.', status: 'in_progress', created_at: daysAgoIso(0) },
      { id: uid(), organization_id: orgId, title: 'Inspect Substation B4 cooling unit', description: 'On-site thermal camera verification.', status: 'open', created_at: daysAgoIso(1) },
      { id: uid(), organization_id: orgId, title: 'Verify contractor #C-8841 authorization', description: 'Confirm work order with Facilities.', status: 'open', created_at: daysAgoIso(2) },
      { id: uid(), organization_id: orgId, title: 'Archive customs manifest #4092', description: 'Attach signed PDF to compliance vault.', status: 'resolved', created_at: daysAgoIso(3) },
    ],
    audit: [
      { id: uid(), organization_id: orgId, user_id: demoUserId, action: 'auth.login', resource_type: 'user', resource_id: demoUserId, created_at: daysAgoIso(0) },
      { id: uid(), organization_id: orgId, user_id: demoUserId, action: 'incident.create', resource_type: 'incident', resource_id: inc1, created_at: daysAgoIso(0) },
      { id: uid(), organization_id: orgId, user_id: demoUserId, action: 'document.upload', resource_type: 'document', resource_id: doc1, created_at: daysAgoIso(3) },
      { id: uid(), organization_id: orgId, user_id: demoUserId, action: 'recommendation.approve', resource_type: 'recommendation', resource_id: 'rec-3', created_at: daysAgoIso(4) },
    ],
  }
}

function loadDB(): LocalDB {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LocalDB
      if (parsed && Array.isArray(parsed.users) && parsed.users.some(u => u.email === 'demo@sentinela.ai')) {
        return parsed
      }
    }
  } catch {
    // Corrupted local DB resets cleanly to seeded state.
  }
  const initial = createInitialDB()
  saveDB(initial)
  return initial
}

function saveDB(db: LocalDB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function httpError(status: number, detail: string) {
  const err: any = new Error(detail)
  err.response = { status, data: { detail } }
  return err
}

function getCurrentUserFromHeader(db: LocalDB, config: InternalAxiosRequestConfig): LocalUser {
  const auth = String(config.headers?.Authorization || '')
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token.startsWith('local:')) throw httpError(401, 'Not authenticated')
  const userId = token.slice(6)
  const user = db.users.find(u => u.id === userId)
  if (!user) throw httpError(401, 'User inactive or not found')
  return user
}

function getOrgId(user: LocalUser, config: InternalAxiosRequestConfig): string {
  const hdr = config.headers?.['X-Organization-ID']
  return String(hdr || user.organization_id)
}

function parseBody(data: unknown): any {
  if (!data) return {}
  if (typeof data === 'string') {
    try { return JSON.parse(data) } catch { return {} }
  }
  return data
}

function pushAudit(db: LocalDB, orgId: string, userId: string, action: string, resourceType: string, resourceId: string) {
  db.audit.unshift({
    id: uid(),
    organization_id: orgId,
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    created_at: new Date().toISOString(),
  })
}

function safeCsvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return `"${safe.replaceAll('"', '""')}"`
}

export async function handleLocalRequest(config: InternalAxiosRequestConfig) {
  const db = loadDB()
  const method = (config.method || 'get').toLowerCase()
  const rawUrl = String(config.url || '')
  const path = rawUrl.replace(/^https?:\/\/[^/]+/, '').replace(/^\/api\/v1/, '').split('?')[0]
  const params = (config.params || {}) as Record<string, string>
  const body = parseBody(config.data)

  const ok = (data: any) => ({ data, status: 200, statusText: 'OK', headers: {}, config })

  // Auth routes
  if (path === '/auth/register' && method === 'post') {
    const email = String(body.email || '').trim().toLowerCase()
    if (db.users.some(u => u.email === email)) throw httpError(400, 'Email already registered')
    const orgId = uid()
    const orgName = String(body.organization_name || 'Default Organization').trim()
    db.orgs.push({ id: orgId, name: orgName, slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') })
    const user: LocalUser = {
      id: uid(),
      name: String(body.name || 'Operator').trim(),
      email,
      password: String(body.password || ''),
      status: 'active',
      is_superuser: false,
      organization_id: orgId,
    }
    db.users.push(user)
    pushAudit(db, orgId, user.id, 'auth.register', 'user', user.id)
    saveDB(db)
    return ok({ access_token: `local:${user.id}`, refresh_token: `local-refresh:${user.id}`, token_type: 'bearer' })
  }

  if (path === '/auth/login' && method === 'post') {
    const email = String(body.email || '').trim().toLowerCase()
    const user = db.users.find(u => u.email === email && u.password === String(body.password || ''))
    if (!user) throw httpError(401, 'Invalid credentials')
    pushAudit(db, user.organization_id, user.id, 'auth.login', 'user', user.id)
    saveDB(db)
    return ok({ access_token: `local:${user.id}`, refresh_token: `local-refresh:${user.id}`, token_type: 'bearer' })
  }

  if (path === '/auth/refresh' && method === 'post') {
    const rt = String(body.refresh_token || '')
    if (!rt.startsWith('local-refresh:')) throw httpError(401, 'Invalid refresh token')
    const userId = rt.slice('local-refresh:'.length)
    return ok({ access_token: `local:${userId}`, refresh_token: rt, token_type: 'bearer' })
  }

  if (path === '/auth/logout' && method === 'post') {
    return ok({ message: 'Logged out' })
  }

  if (path === '/auth/me' && method === 'get') {
    const user = getCurrentUserFromHeader(db, config)
    const org = db.orgs.find(o => o.id === user.organization_id)
    return ok({
      user: { id: user.id, name: user.name, email: user.email, status: user.status, is_superuser: user.is_superuser },
      memberships: [
        {
          organization_id: user.organization_id,
          organization_name: org?.name || 'Workspace',
          role: 'Organization Admin',
          permissions: ['*'],
        },
      ],
    })
  }

  if (path === '/auth/me' && method === 'patch') {
    const user = getCurrentUserFromHeader(db, config)
    user.name = String(body.name || user.name).trim()
    saveDB(db)
    return ok({ id: user.id, name: user.name, email: user.email, status: user.status, is_superuser: user.is_superuser })
  }

  if (path === '/auth/change-password' && method === 'post') {
    const user = getCurrentUserFromHeader(db, config)
    if (user.password !== String(body.current_password || '')) throw httpError(400, 'Current password is incorrect')
    user.password = String(body.new_password || '')
    saveDB(db)
    return ok({ message: 'Password updated successfully.' })
  }

  const user = getCurrentUserFromHeader(db, config)
  const orgId = getOrgId(user, config)

  // Incidents
  if (path === '/incidents' && method === 'get') {
    let list = db.incidents.filter(i => i.organization_id === orgId)
    if (params.status) list = list.filter(i => i.status === params.status)
    if (params.severity) list = list.filter(i => i.severity === params.severity)
    if (params.q) {
      const q = params.q.toLowerCase()
      list = list.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
    }
    return ok(list)
  }

  if (path === '/incidents' && method === 'post') {
    const item = { id: uid(), organization_id: orgId, status: 'open', created_at: new Date().toISOString(), ...body }
    db.incidents.unshift(item)
    pushAudit(db, orgId, user.id, 'incident.create', 'incident', item.id)
    saveDB(db)
    return ok(item)
  }

  const incPatch = path.match(/^\/incidents\/([^/]+)$/)
  if (incPatch && method === 'patch') {
    const item = db.incidents.find(i => i.id === incPatch[1] && i.organization_id === orgId)
    if (!item) throw httpError(404, 'Incident not found')
    Object.assign(item, body)
    pushAudit(db, orgId, user.id, 'incident.update', 'incident', item.id)
    saveDB(db)
    return ok(item)
  }

  const incAnalyze = path.match(/^\/incidents\/([^/]+)\/analyze$/)
  if (incAnalyze && method === 'post') {
    const item = db.incidents.find(i => i.id === incAnalyze[1] && i.organization_id === orgId)
    if (!item) throw httpError(404, 'Incident not found')
    const entry = {
      id: uid(),
      suggested_severity: item.severity,
      status: 'completed',
      summary: `Structured triage for "${item.title}": categorized under ${item.category || 'Operations'} with ${item.severity} severity.`,
      justification: 'Derived from incident description, source telemetry and organization baseline.',
      missing_information: ['Corroborating external log hash'],
      recommended_next_steps: ['Link supporting evidence in Evidence Vault', 'Run deterministic risk assessment'],
    }
    db.analyses[item.id] = [entry, ...(db.analyses[item.id] || [])]
    pushAudit(db, orgId, user.id, 'incident.analyze', 'incident', item.id)
    saveDB(db)
    return ok(entry)
  }

  const incAnalysisGet = path.match(/^\/incidents\/([^/]+)\/analysis$/)
  if (incAnalysisGet && method === 'get') {
    return ok(db.analyses[incAnalysisGet[1]] || [])
  }

  // Documents
  if (path === '/documents' && method === 'get') {
    return ok(db.documents.filter(d => d.organization_id === orgId))
  }

  if (path === '/documents/upload' && method === 'post') {
    const fd = config.data as FormData
    const file = fd?.get?.('file') as File | null
    const name = file?.name || 'uploaded-document.txt'
    let text = ''
    try {
      if (file && file.type.startsWith('text/')) text = await file.text()
    } catch {
      text = ''
    }
    const id = uid()
    const doc = {
      id,
      organization_id: orgId,
      title: name.replace(/\.[^.]+$/, ''),
      file_name: name,
      page_count: 1,
      status: 'ready',
      file_hash: 'sha256-local-' + id.slice(0, 8),
      created_at: new Date().toISOString(),
    }
    db.documents.unshift(doc)
    db.chunks[id] = [
      {
        page_number: 1,
        chunk_index: 0,
        content: text.slice(0, 800) || `Indexed document ${name} in standalone workspace storage.`,
      },
    ]
    pushAudit(db, orgId, user.id, 'document.upload', 'document', id)
    saveDB(db)
    return ok(doc)
  }

  const docAnalyze = path.match(/^\/documents\/([^/]+)\/analyze$/)
  if (docAnalyze && method === 'post') {
    const doc = db.documents.find(d => d.id === docAnalyze[1] && d.organization_id === orgId)
    if (!doc) throw httpError(404, 'Document not found')
    doc.status = 'ready'
    saveDB(db)
    return ok(doc)
  }

  const docAsk = path.match(/^\/documents\/([^/]+)\/questions$/)
  if (docAsk && method === 'post') {
    const chunks = db.chunks[docAsk[1]] || []
    const qWords = new Set(String(body.question || '').toLowerCase().split(/\s+/).filter(Boolean))
    const scored = chunks
      .map(c => {
        const hits = [...qWords].filter(w => c.content.toLowerCase().includes(w)).length
        return { ...c, score: Math.min(0.98, 0.45 + hits * 0.15) }
      })
      .sort((a, b) => b.score - a.score)
    const top = scored[0]
    return ok({
      answer: top
        ? `Based on page ${top.page_number} (segment ${top.chunk_index}): ${top.content}`
        : 'No indexed segments matched the query.',
      citations: scored.slice(0, 3).map(c => ({
        page_number: c.page_number,
        chunk_index: c.chunk_index,
        score: c.score,
        excerpt: c.content,
      })),
    })
  }

  // Evidence
  if (path === '/evidence' && method === 'get') {
    return ok(db.evidence.filter(e => e.organization_id === orgId))
  }

  if (path === '/evidence' && method === 'post') {
    const ev = { id: uid(), organization_id: orgId, created_at: new Date().toISOString(), ...body }
    db.evidence.unshift(ev)
    pushAudit(db, orgId, user.id, 'evidence.create', 'evidence', ev.id)
    saveDB(db)
    return ok(ev)
  }

  if (path === '/evidence/correlate' && method === 'post') {
    const inc = db.incidents.find(i => i.id === body.incident_id && i.organization_id === orgId)
    if (!inc) throw httpError(404, 'Incident not found')
    const base = new Set(`${inc.title} ${inc.description} ${inc.category || ''}`.toLowerCase().split(/\s+/))
    const suggestions = db.incidents
      .filter(c => c.organization_id === orgId && c.id !== inc.id)
      .map(c => {
        const tokens = new Set(`${c.title} ${c.description} ${c.category || ''}`.toLowerCase().split(/\s+/))
        const overlap = [...base].filter(w => tokens.has(w)).length
        const score = Math.min(0.99, overlap / (new Set([...base, ...tokens]).size || 1) + (inc.category === c.category ? 0.2 : 0))
        return {
          target_incident_id: c.id,
          target_title: c.title,
          score: Number(score.toFixed(3)),
          verification_status: 'suggested',
          explanation: 'Suggested by deterministic text and category overlap.',
        }
      })
      .filter(s => s.score >= 0.15)
      .sort((a, b) => b.score - a.score)
    return ok({ incident_id: inc.id, suggestions, method: 'deterministic_text_overlap_v1' })
  }

  // Risks
  if (path === '/risks' && method === 'get') {
    return ok(db.risks.filter(r => r.organization_id === orgId))
  }

  if (path === '/risks/assess' && method === 'post') {
    const p = Number(body.probability || 3)
    const i = Number(body.impact || 3)
    const e = Number(body.exposure || 3)
    const u = Number(body.urgency || 3)
    const q = Number(body.evidence_quality || 3)
    const score = Math.round(((p * 0.25 + i * 0.3 + e * 0.15 + u * 0.15 + q * 0.15) / 5) * 100)
    const level = score >= 75 ? 'critical' : score >= 55 ? 'high' : score >= 35 ? 'moderate' : 'low'
    const item = {
      id: uid(),
      organization_id: orgId,
      ...body,
      score,
      level,
      requires_human_review: q <= 2 || level === 'high' || level === 'critical',
      created_at: new Date().toISOString(),
    }
    db.risks.unshift(item)
    pushAudit(db, orgId, user.id, 'risk.assess', 'risk', item.id)
    saveDB(db)
    return ok(item)
  }

  // Recommendations
  if (path === '/recommendations' && method === 'get') {
    let list = db.recommendations.filter(r => r.organization_id === orgId)
    if (params.status) list = list.filter(r => r.status === params.status)
    return ok(list)
  }

  if (path === '/recommendations' && method === 'post') {
    const rec = { id: uid(), organization_id: orgId, status: 'pending', generated_by: 'operator', created_at: new Date().toISOString(), ...body }
    db.recommendations.unshift(rec)
    pushAudit(db, orgId, user.id, 'recommendation.create', 'recommendation', rec.id)
    saveDB(db)
    return ok(rec)
  }

  const recAct = path.match(/^\/recommendations\/([^/]+)\/(approve|reject)$/)
  if (recAct && method === 'post') {
    const rec = db.recommendations.find(r => r.id === recAct[1] && r.organization_id === orgId)
    if (!rec) throw httpError(404, 'Recommendation not found')
    rec.status = recAct[2] === 'approve' ? 'approved' : 'rejected'
    rec.review_notes = body.review_notes || ''
    pushAudit(db, orgId, user.id, `recommendation.${recAct[2]}`, 'recommendation', rec.id)
    saveDB(db)
    return ok(rec)
  }

  // Tasks
  if (path === '/tasks' && method === 'get') {
    return ok(db.tasks.filter(t => t.organization_id === orgId))
  }

  if (path === '/tasks' && method === 'post') {
    const task = { id: uid(), organization_id: orgId, created_at: new Date().toISOString(), ...body }
    db.tasks.unshift(task)
    pushAudit(db, orgId, user.id, 'task.create', 'task', task.id)
    saveDB(db)
    return ok(task)
  }

  const taskPatch = path.match(/^\/tasks\/([^/]+)$/)
  if (taskPatch && method === 'patch') {
    const task = db.tasks.find(t => t.id === taskPatch[1] && t.organization_id === orgId)
    if (!task) throw httpError(404, 'Task not found')
    Object.assign(task, body)
    pushAudit(db, orgId, user.id, 'task.update', 'task', task.id)
    saveDB(db)
    return ok(task)
  }

  // Audit
  if (path === '/audit' && method === 'get') {
    let list = db.audit.filter(a => a.organization_id === orgId)
    if (params.action) list = list.filter(a => a.action.toLowerCase().includes(params.action.toLowerCase()))
    if (params.resource_type) list = list.filter(a => a.resource_type.toLowerCase().includes(params.resource_type.toLowerCase()))
    return ok(list)
  }

  // Analytics overview
  if (path === '/analytics/overview' && method === 'get') {
    const incs = db.incidents.filter(i => i.organization_id === orgId)
    const docs = db.documents.filter(d => d.organization_id === orgId && d.status === 'ready')
    const evs = db.evidence.filter(e => e.organization_id === orgId)
    const rks = db.risks.filter(r => r.organization_id === orgId)
    const recs = db.recommendations.filter(r => r.organization_id === orgId && r.status === 'pending')
    const tks = db.tasks.filter(t => t.organization_id === orgId && (t.status === 'open' || t.status === 'in_progress'))

    const sevMap: Record<string, number> = {}
    const stMap: Record<string, number> = {}
    for (const i of incs) {
      sevMap[i.severity || 'unknown'] = (sevMap[i.severity || 'unknown'] || 0) + 1
      stMap[i.status || 'unknown'] = (stMap[i.status || 'unknown'] || 0) + 1
    }

    const trend = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(Date.now() - (6 - idx) * 86400_000).toISOString().slice(0, 10)
      return { date: d, incidents: incs.filter(i => String(i.created_at).slice(0, 10) === d).length }
    })

    const avgRisk = rks.length ? Number((rks.reduce((s, r) => s + Number(r.score || 0), 0) / rks.length).toFixed(1)) : 0

    return ok({
      metrics: {
        total_incidents: incs.length,
        open_incidents: incs.filter(i => ['open', 'in_progress', 'pending'].includes(i.status)).length,
        critical_incidents: incs.filter(i => i.severity === 'critical').length,
        resolved_incidents: incs.filter(i => ['resolved', 'closed'].includes(i.status)).length,
        documents_processed: docs.length,
        evidence_items: evs.length,
        risk_assessments: rks.length,
        average_risk_score: avgRisk,
        pending_recommendations: recs.length,
        open_tasks: tks.length,
      },
      incidents_by_severity: Object.entries(sevMap).map(([name, value]) => ({ name, value })),
      incidents_by_status: Object.entries(stMap).map(([name, value]) => ({ name, value })),
      incident_trend_7d: trend,
      recent_activity: incs.slice(0, 5),
    })
  }

  // Reports CSV
  if (path.startsWith('/reports/') && method === 'get') {
    let csv = ''
    if (path === '/reports/incidents.csv') {
      const rows = db.incidents.filter(i => i.organization_id === orgId)
      csv = ['id,title,category,severity,priority,status,created_at', ...rows.map(i => [i.id, i.title, i.category || '', i.severity, i.priority, i.status, i.created_at].map(safeCsvCell).join(','))].join('\n')
    } else if (path === '/reports/risks.csv') {
      const rows = db.risks.filter(r => r.organization_id === orgId)
      csv = ['id,incident_id,score,level,created_at', ...rows.map(r => [r.id, r.incident_id || '', r.score, r.level, r.created_at].map(safeCsvCell).join(','))].join('\n')
    } else {
      const rows = db.recommendations.filter(r => r.organization_id === orgId)
      csv = ['id,incident_id,title,priority,status,created_at', ...rows.map(r => [r.id, r.incident_id || '', r.title, r.priority, r.status, r.created_at].map(safeCsvCell).join(','))].join('\n')
    }
    return ok(new Blob([csv], { type: 'text/csv' }))
  }

  throw httpError(404, 'Endpoint not found')
}
