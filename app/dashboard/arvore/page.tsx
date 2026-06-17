'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, GitBranch, Users, Pencil, Trash2 } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'

/* ─── Layout constants ──────────────────────────────────────────── */
const D   = 72   // portrait diameter
const R   = 36   // portrait radius
const NH  = 62   // name label height below circle (2 lines + age)
const CG  = 28   // gap between couple portrait edges
const HG  = 56   // horizontal gap between sibling subtrees
const VG  = 80   // vertical gap between generations
const PAD = 64   // canvas padding

/* ─── Data types ────────────────────────────────────────────────── */
interface Membro {
  id: string
  nome: string
  foto_url: string | null
  personagem_id: string | null
  status: 'ativo' | 'falecido' | 'npc'
  idade?: number | null
  personagens?: { foto_url: string | null } | null
}
interface Personagem { id: string; nome: string; foto_url: string | null }
interface Relacao {
  id: string
  membro_a: string
  membro_b: string
  tipo_relacao: string
  categoria: string | null
}

/* ─── Tree types ────────────────────────────────────────────────── */
interface Unit {
  id: string
  primary: Membro
  spouse?: Membro
  children: Unit[]
  cx: number
  ty: number
  w: number
}
interface FlatNode {
  key: string
  m: Membro
  cx: number
  ty: number
  unitId: string
  isPrimary: boolean
  hasSp: boolean
  spouseId?: string
}
interface FlatLine { key: string; x1: number; y1: number; x2: number; y2: number }

/* ─── Relation options ──────────────────────────────────────────── */
const REL_OPTS = [
  { label: 'Cônjuge / parceiro(a)', cat: 'cônjuge',       tipo: 'cônjuge' },
  { label: 'A é pai/mãe de B',      cat: 'pai/mãe de',   tipo: 'pai/mãe de' },
  { label: 'A é filho/a de B',      cat: 'filho/a de',   tipo: 'filho/a de' },
  { label: 'A adotou B',            cat: 'adotou',       tipo: 'adotou' },
  { label: 'Irmão/irmã de',         cat: null,           tipo: 'irmão/irmã de' },
  { label: 'Primo/a de',            cat: null,           tipo: 'primo/a de' },
]

/* ═══════════════════════════════════════════════════════════════════
   TREE ALGORITHM
═══════════════════════════════════════════════════════════════════ */
function buildUnits(membros: Membro[], relacoes: Relacao[]): Unit[] {
  const byId     = new Map(membros.map(m => [m.id, m]))
  const spouseOf = new Map<string, string>()         // id → spouseId (first wins)
  const kidsOf   = new Map<string, Set<string>>()    // parentId → Set<childId>
  const hasParent = new Set<string>()

  for (const r of relacoes) {
    const cat = r.categoria ?? r.tipo_relacao
    if (cat === 'cônjuge') {
      if (!spouseOf.has(r.membro_a)) spouseOf.set(r.membro_a, r.membro_b)
      if (!spouseOf.has(r.membro_b)) spouseOf.set(r.membro_b, r.membro_a)
    } else if (cat === 'pai/mãe de' || cat === 'adotou') {
      if (!kidsOf.has(r.membro_a)) kidsOf.set(r.membro_a, new Set())
      kidsOf.get(r.membro_a)!.add(r.membro_b)
      hasParent.add(r.membro_b)
    } else if (cat === 'filho/a de' || cat === 'adotado/a por') {
      if (!kidsOf.has(r.membro_b)) kidsOf.set(r.membro_b, new Set())
      kidsOf.get(r.membro_b)!.add(r.membro_a)
      hasParent.add(r.membro_a)
    }
    // Other types (irmão, primo, etc.) are stored in DB but don't affect layout
  }

  const visited = new Set<string>()

  function make(id: string): Unit | null {
    if (visited.has(id) || !byId.has(id)) return null
    visited.add(id)
    const primary = byId.get(id)!

    let spouse: Membro | undefined
    const sid = spouseOf.get(id)
    if (sid && !visited.has(sid) && byId.has(sid)) {
      spouse = byId.get(sid)!
      visited.add(sid)
    }

    const childIds = new Set([
      ...(kidsOf.get(id)   ?? []),
      ...(sid ? (kidsOf.get(sid) ?? []) : []),
    ])
    const children = [...childIds].map(make).filter((u): u is Unit => u !== null)

    return { id, primary, spouse, children, cx: 0, ty: 0, w: 0 }
  }

  // If person X has no parents but their spouse HAS parents, X should appear
  // alongside their spouse in the spouse's parent subtree — not as a separate root.
  const spouseOfAnchored = new Set<string>()
  for (const id of hasParent) {
    const sid = spouseOf.get(id)
    if (sid && !hasParent.has(sid)) spouseOfAnchored.add(sid)
  }

  const units: Unit[] = []
  for (const m of membros)
    if (!visited.has(m.id) && !hasParent.has(m.id) && !spouseOfAnchored.has(m.id))
      { const u = make(m.id); if (u) units.push(u) }
  // Catch anyone still unvisited (truly disconnected)
  for (const m of membros)
    if (!visited.has(m.id)) { const u = make(m.id); if (u) units.push(u) }
  return units
}

function calcW(u: Unit): void {
  const sw = u.spouse ? 2 * D + CG : D
  if (!u.children.length) { u.w = sw; return }
  u.children.forEach(calcW)
  const cw = u.children.reduce((s, c) => s + c.w, 0) + HG * (u.children.length - 1)
  u.w = Math.max(sw, cw)
}

function placeU(u: Unit, cx: number, ty: number): void {
  u.cx = cx; u.ty = ty
  if (!u.children.length) return
  const childTy = ty + D + NH + VG
  const span    = u.children.reduce((s, c) => s + c.w, 0) + HG * (u.children.length - 1)
  let x = cx - span / 2
  for (const ch of u.children) { placeU(ch, x + ch.w / 2, childTy); x += ch.w + HG }
}

function flattenUnits(roots: Unit[]): { nodes: FlatNode[]; lines: FlatLine[]; w: number; h: number } {
  // Layout
  let cursor = PAD
  for (const r of roots) { calcW(r); placeU(r, cursor + r.w / 2, PAD); cursor += r.w + HG * 2 }

  const nodes: FlatNode[] = []
  const lines: FlatLine[] = []
  let maxX = PAD, maxY = PAD

  function visit(u: Unit) {
    const { id, primary, spouse, cx, ty, children } = u
    const half = spouse ? (D + CG) / 2 : 0
    const pCx = cx - half
    const sCx = cx + half

    nodes.push({ key: primary.id, m: primary, cx: pCx, ty, unitId: id, isPrimary: true,  hasSp: !!spouse, spouseId: spouse?.id })
    if (spouse) {
      nodes.push({ key: spouse.id, m: spouse, cx: sCx, ty, unitId: id, isPrimary: false, hasSp: true, spouseId: spouse.id })
      lines.push({ key: `sp-${id}`, x1: pCx + R, y1: ty + R, x2: sCx - R, y2: ty + R })
    }

    if (children.length) {
      const barY   = ty + D + NH + VG / 2
      // Primary person's cx (the descendant), not the couple midpoint
      const pCxOf  = (u: Unit) => u.spouse ? u.cx - (D + CG) / 2 : u.cx
      const chPCxs = children.map(pCxOf)
      const barLeft  = Math.min(cx, ...chPCxs)
      const barRight = Math.max(cx, ...chPCxs)
      lines.push({ key: `vd-${id}`, x1: cx, y1: ty + R, x2: cx, y2: barY })
      lines.push({ key: `hb-${id}`, x1: barLeft, y1: barY, x2: barRight, y2: barY })
      for (let i = 0; i < children.length; i++) {
        const ch = children[i]
        lines.push({ key: `vc-${ch.id}`, x1: chPCxs[i], y1: barY, x2: chPCxs[i], y2: ch.ty })
        visit(ch)
      }
    }

    maxX = Math.max(maxX, sCx + R + PAD)
    maxY = Math.max(maxY, ty + D + NH + PAD)
  }

  for (const r of roots) visit(r)
  return { nodes, lines, w: maxX, h: maxY }
}

/* ═══════════════════════════════════════════════════════════════════
   PORTRAIT
═══════════════════════════════════════════════════════════════════ */
function Portrait({
  m, isDragging, isTarget, onClick, onMouseDown,
}: {
  m: Membro
  isDragging: boolean
  isTarget: boolean
  onClick: () => void
  onMouseDown: (e: React.MouseEvent) => void
}) {
  const foto = m.personagens?.foto_url ?? m.foto_url
  const dead = m.status === 'falecido'
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseDown={onMouseDown}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        cursor: 'grab', userSelect: 'none',
        opacity: isDragging ? 0.35 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <div style={{ position: 'relative', width: D, height: D }}>
        {/* Photo */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: D - 6, height: D - 6, borderRadius: '50%', overflow: 'hidden',
          background: 'rgba(128,0,32,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {foto
            ? <img
                src={foto} alt={m.nome} draggable={false}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  filter: hovered || isTarget ? 'none' : 'grayscale(1)',
                  transition: 'filter 0.25s',
                }}
              />
            : <Users size={22} style={{ color: '#906070' }} />
          }
        </div>
        {/* Ring */}
        <svg viewBox="0 0 72 72" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <circle cx="36" cy="36" r="33"
            fill="none"
            stroke="#800020"
            strokeWidth={isTarget ? 2.5 : 0.85}
            opacity={isTarget ? 1 : dead ? 0.4 : 0.55}
            strokeDasharray={dead ? '5 3' : undefined}
          />
          {isTarget && <circle cx="36" cy="36" r="33" fill="rgba(128,0,32,0.06)" />}
        </svg>
      </div>
      {/* Name + age */}
      <div style={{ textAlign: 'center', maxWidth: 96, lineHeight: 1.25 }}>
        <div style={{
          fontSize: 11, fontFamily: 'Georgia, serif',
          color: dead ? '#906070' : '#2E0510',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {dead ? '† ' : ''}{m.nome}
        </div>
        {m.idade != null && (
          <div style={{ fontSize: 10, color: '#906070', fontFamily: 'Georgia, serif', marginTop: 1 }}>
            ({m.idade})
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MEMBER MODAL (create / edit)
═══════════════════════════════════════════════════════════════════ */
function MembroModal({
  initial, personagens, onSave, onCancel, saving, title,
}: {
  initial?: Partial<Membro>
  personagens: Personagem[]
  onSave: (data: { nome: string; status: 'ativo'|'falecido'|'npc'; personagem_id: string|null; foto_url: string|null; idade: number|null }) => void
  onCancel: () => void
  saving: boolean
  title: string
}) {
  const [nome, setNome]       = useState(initial?.nome ?? '')
  const [status, setStatus]   = useState<'ativo'|'falecido'|'npc'>(initial?.status ?? 'ativo')
  const [persId, setPersId]   = useState(initial?.personagem_id ?? '')
  const [foto, setFoto]       = useState(initial?.foto_url ?? '')
  const [idade, setIdade]     = useState<string>(initial?.idade != null ? String(initial.idade) : '')
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60) }, [])

  function handlePersChange(id: string) {
    setPersId(id)
    if (id && !nome) {
      const p = personagens.find(p => p.id === id)
      if (p) setNome(p.nome)
    }
    if (id) setFoto('')
  }

  function submit() {
    if (!nome.trim()) return
    const foto_url = persId
      ? (personagens.find(p => p.id === persId)?.foto_url ?? null)
      : (foto || null)
    const idadeNum = idade !== '' ? parseInt(idade, 10) : null
    onSave({ nome: nome.trim(), status, personagem_id: persId || null, foto_url, idade: idadeNum })
  }

  return (
    <Overlay onClose={onCancel}>
      <h3 style={{ margin: '0 0 18px', fontSize: 15, fontFamily: 'Georgia, serif', color: '#2E0510', fontWeight: 600 }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {personagens.length > 0 && (
          <Field label="Vincular personagem existente (opcional)">
            <select value={persId} onChange={e => handlePersChange(e.target.value)} style={sel}>
              <option value="">Criar sem vínculo</option>
              {personagens.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </Field>
        )}
        {!persId && (
          <Field label="Foto (opcional)">
            <ImageUpload onUpload={setFoto} currentUrl={foto} />
          </Field>
        )}
        <Field label="Nome *">
          <input
            ref={inputRef}
            value={nome}
            onChange={e => setNome(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Nome do personagem..."
            style={inp}
          />
        </Field>
        <Field label="Status">
          <select value={status} onChange={e => setStatus(e.target.value as 'ativo'|'falecido'|'npc')} style={sel}>
            <option value="ativo">Ativo</option>
            <option value="falecido">Falecido</option>
            <option value="npc">NPC / sem ficha</option>
          </select>
        </Field>
        <Field label="Idade (opcional)">
          <input
            type="number"
            min={0}
            max={999}
            value={idade}
            onChange={e => setIdade(e.target.value)}
            placeholder="ex: 34"
            style={inp}
          />
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
        <Btn ghost onClick={onCancel}>Cancelar</Btn>
        <Btn primary onClick={submit} disabled={!nome.trim() || saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Btn>
      </div>
    </Overlay>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   RELATION PICKER (shown after drag-drop)
═══════════════════════════════════════════════════════════════════ */
function RelPicker({
  sourceM, targetM, onConfirm, onCancel, saving,
}: {
  sourceM: Membro; targetM: Membro
  onConfirm: (tipo: string, cat: string | null) => void
  onCancel: () => void
  saving: boolean
}) {
  const [sel, setSel]       = useState<string>('')
  const [custom, setCustom] = useState('')

  const fotoA = sourceM.personagens?.foto_url ?? sourceM.foto_url
  const fotoB = targetM.personagens?.foto_url ?? targetM.foto_url

  function confirm() {
    if (sel) {
      const opt = REL_OPTS.find(o => o.tipo === sel)!
      onConfirm(opt.tipo, opt.cat)
    } else if (custom.trim()) {
      onConfirm(custom.trim(), null)
    }
  }

  return (
    <Overlay onClose={onCancel}>
      {/* Two portraits preview */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
        <MiniPortrait foto={fotoA} nome={sourceM.nome} label="A" />
        <span style={{ fontSize: 20, color: '#C0A0A8' }}>↔</span>
        <MiniPortrait foto={fotoB} nome={targetM.nome} label="B" />
      </div>

      <p style={{ fontSize: 12, color: '#906070', textAlign: 'center', margin: '0 0 14px' }}>
        Como <strong style={{ color: '#2E0510' }}>{sourceM.nome}</strong> se relaciona com <strong style={{ color: '#2E0510' }}>{targetM.nome}</strong>?
      </p>

      {/* Predefined options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
        {REL_OPTS.map(opt => (
          <button
            key={opt.tipo}
            onClick={() => { setSel(opt.tipo); setCustom('') }}
            style={{
              padding: '8px 10px', borderRadius: 8, fontSize: 12, textAlign: 'center',
              border: sel === opt.tipo ? '1.5px solid #800020' : '1px solid rgba(128,0,32,0.18)',
              background: sel === opt.tipo ? 'rgba(128,0,32,0.08)' : '#fff',
              color: sel === opt.tipo ? '#800020' : '#2E0510',
              cursor: 'pointer', fontWeight: sel === opt.tipo ? 600 : 400,
              transition: 'all 0.12s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom type */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 11, color: '#906070', marginBottom: 5, fontWeight: 500 }}>
          Ou escreva livremente:
        </label>
        <input
          value={custom}
          onChange={e => { setCustom(e.target.value); setSel('') }}
          placeholder="ex: padrinho, avô por afinidade, tutor..."
          style={inp}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn ghost onClick={onCancel}>Cancelar</Btn>
        <Btn primary onClick={confirm} disabled={(!sel && !custom.trim()) || saving}>
          {saving ? 'Salvando...' : 'Conectar'}
        </Btn>
      </div>
    </Overlay>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   CLICK POPOVER
═══════════════════════════════════════════════════════════════════ */
function ClickPopover({
  m, x, y, onEdit, onDelete, onClose,
}: {
  m: Membro; x: number; y: number
  onEdit: () => void; onDelete: () => void; onClose: () => void
}) {
  return (
    <div
      style={{ position: 'absolute', left: x + 10, top: y, zIndex: 100 }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{
        background: '#fff', borderRadius: 10, padding: '6px 0', minWidth: 140,
        border: '0.5px solid rgba(128,0,32,0.15)',
        boxShadow: '0 4px 20px rgba(46,5,16,0.12)',
      }}>
        <PopItem icon={<Pencil size={12} />} label="Editar" onClick={() => { onEdit(); onClose() }} />
        <div style={{ height: 1, background: 'rgba(128,0,32,0.08)', margin: '4px 0' }} />
        <PopItem icon={<Trash2 size={12} />} label="Remover" onClick={() => { onDelete(); onClose() }} danger />
      </div>
    </div>
  )
}

function PopItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '7px 14px', background: hov ? (danger ? 'rgba(192,57,43,0.07)' : 'rgba(128,0,32,0.05)') : 'none',
        border: 'none', cursor: 'pointer', fontSize: 12,
        color: danger ? '#c0392b' : '#2E0510',
      }}
    >
      <span style={{ color: danger ? '#c0392b' : '#800020' }}>{icon}</span>
      {label}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SMALL UI HELPERS
═══════════════════════════════════════════════════════════════════ */
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(46,5,16,0.40)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#FAF5F7', borderRadius: 16, padding: 26, width: 380, boxShadow: '0 12px 48px rgba(46,5,16,0.20)', maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#906070', marginBottom: 5, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

function Btn({ children, onClick, primary, ghost, disabled }: {
  children: React.ReactNode; onClick?: () => void
  primary?: boolean; ghost?: boolean; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: primary ? 500 : 400,
      border: ghost ? '1px solid rgba(128,0,32,0.20)' : 'none',
      background: primary ? '#800020' : 'transparent',
      color: primary ? '#FAF0F2' : '#906070',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}>
      {children}
    </button>
  )
}

function MiniPortrait({ foto, nome, label }: { foto: string | null; nome: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'rgba(128,0,32,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(128,0,32,0.18)' }}>
        {foto ? <img src={foto} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={18} style={{ color: '#906070' }} />}
      </div>
      <span style={{ fontSize: 10, color: '#906070', fontFamily: 'Georgia,serif' }}>{label}: {nome}</span>
    </div>
  )
}

// Shared input/select styles
const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid rgba(128,0,32,0.18)', background: '#fff', color: '#2E0510', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
export default function ArvoreGenealogicaPage() {
  const [membros, setMembros]         = useState<Membro[]>([])
  const [personagens, setPersonagens] = useState<Personagem[]>([])
  const [relacoes, setRelacoes]       = useState<Relacao[]>([])

  // Modals
  const [createOpen, setCreateOpen]   = useState(false)
  const [editMembro, setEditMembro]   = useState<Membro | null>(null)
  const [relPicker, setRelPicker]     = useState<{ srcId: string; tgtId: string } | null>(null)

  // Popover on click
  const [popover, setPopover]         = useState<{ memberId: string; x: number; y: number } | null>(null)

  // Drag state (via ref to avoid stale closures in global handlers)
  const dragRef = useRef<{ id: string; initX: number; initY: number; moved: boolean; targetId: string | null } | null>(null)
  const [draggingId, setDraggingId]   = useState<string | null>(null)
  const [targetId, setTargetId]       = useState<string | null>(null)

  // Saving flags
  const [savingMembro, setSavingMembro] = useState(false)
  const [savingRel, setSavingRel]       = useState(false)

  // Refs for hit-testing during drag
  const nodesRef   = useRef<FlatNode[]>([])
  const canvasRef  = useRef<HTMLDivElement>(null)

  /* ── Load ── */
  async function load() {
    const universoId = new URLSearchParams(window.location.search).get('universo')
    const s = createClient()
    const membrosQ = s.from('membros_arvore').select('*, personagens(foto_url)').order('nome')
    const personagensQ = s.from('personagens').select('id, nome, foto_url').order('nome')
    if (universoId) { membrosQ.eq('universo_id', universoId); personagensQ.eq('universo_id', universoId) }
    const [{ data: m }, { data: p }, { data: r }] = await Promise.all([
      membrosQ,
      personagensQ,
      s.from('relacoes_arvore').select('*'),
    ])
    setMembros((m as Membro[]) ?? [])
    setPersonagens(p ?? [])
    setRelacoes(r ?? [])
  }
  useEffect(() => { load() }, [])

  /* ── Global mouse handlers for drag ── */
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const d = dragRef.current
      if (!d) return
      const dx = e.clientX - d.initX, dy = e.clientY - d.initY
      if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true
      if (!d.moved) return

      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left + canvas.scrollLeft
      const cy = e.clientY - rect.top  + canvas.scrollTop

      let best = R + 28, found: string | null = null
      for (const n of nodesRef.current) {
        if (n.key === d.id) continue
        const dist = Math.hypot(cx - n.cx, cy - (n.ty + R))
        if (dist < best) { best = dist; found = n.key }
      }
      d.targetId = found
      setTargetId(found)
    }

    function onUp() {
      const d = dragRef.current
      if (!d) return
      const { id, moved, targetId } = d
      dragRef.current = null
      setDraggingId(null)
      setTargetId(null)
      if (moved && targetId) setRelPicker({ srcId: id, tgtId: targetId })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  /* ── Handlers ── */
  function onPortraitMouseDown(memberId: string, e: React.MouseEvent) {
    e.preventDefault()
    dragRef.current = { id: memberId, initX: e.clientX, initY: e.clientY, moved: false, targetId: null }
    setDraggingId(memberId)
    setPopover(null)
  }

  function onPortraitClick(n: FlatNode, e: React.MouseEvent) {
    const d = dragRef.current
    if (d?.moved) return  // was a drag, not a click
    e.stopPropagation()
    if (popover?.memberId === n.key) { setPopover(null); return }
    setPopover({ memberId: n.key, x: n.cx + R, y: n.ty })
  }

  async function createMembro(data: { nome: string; status: 'ativo'|'falecido'|'npc'; personagem_id: string|null; foto_url: string|null; idade: number|null }) {
    setSavingMembro(true)
    const s = createClient()
    const universoId = new URLSearchParams(window.location.search).get('universo')
    await s.from('membros_arvore').insert({ ...data, ...(universoId ? { universo_id: universoId } : {}) })
    await load()
    setCreateOpen(false)
    setSavingMembro(false)
  }

  async function updateMembro(data: { nome: string; status: 'ativo'|'falecido'|'npc'; personagem_id: string|null; foto_url: string|null; idade: number|null }) {
    if (!editMembro) return
    setSavingMembro(true)
    const s = createClient()
    await s.from('membros_arvore').update(data).eq('id', editMembro.id)
    await load()
    setEditMembro(null)
    setSavingMembro(false)
  }

  async function deleteMembro(id: string) {
    if (!confirm('Remover este membro da árvore?')) return
    const s = createClient()
    await s.from('membros_arvore').delete().eq('id', id)
    setMembros(prev => prev.filter(m => m.id !== id))
    setRelacoes(prev => prev.filter(r => r.membro_a !== id && r.membro_b !== id))
  }

  async function addRelacao(tipo: string, cat: string | null) {
    if (!relPicker) return
    setSavingRel(true)
    const s = createClient()
    await s.from('relacoes_arvore').insert({
      membro_a: relPicker.srcId,
      membro_b: relPicker.tgtId,
      tipo_relacao: tipo,
      categoria: cat,
    })
    await load()
    setRelPicker(null)
    setSavingRel(false)
  }

  /* ── Computed tree ── */
  const roots = buildUnits(membros, relacoes)
  const tree  = flattenUnits(roots)
  nodesRef.current = tree.nodes

  const personagensDisponiveis = personagens.filter(p => !membros.find(m => m.personagem_id === p.id))

  const sourceM = relPicker ? membros.find(m => m.id === relPicker.srcId) : null
  const targetM = relPicker ? membros.find(m => m.id === relPicker.tgtId) : null

  /* ── Render ── */
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#FAF5F7' }}
      onClick={() => setPopover(null)}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', flexShrink: 0,
        background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(8px)',
        borderBottom: '0.5px solid rgba(128,0,32,0.10)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GitBranch size={15} style={{ color: '#800020' }} />
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: 'Georgia, serif', color: '#2E0510' }}>
            Árvore genealógica
          </h1>
          {membros.length > 0 && (
            <span style={{ fontSize: 11, color: '#B09098' }}>{membros.length} membro{membros.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); setCreateOpen(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#800020', color: '#FAF0F2', border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
        >
          <Plus size={13} /> Adicionar pessoa
        </button>
      </div>

      {/* Hint bar */}
      {membros.length > 1 && (
        <div style={{ padding: '7px 24px', background: 'rgba(128,0,32,0.04)', borderBottom: '0.5px solid rgba(128,0,32,0.07)' }}>
          <span style={{ fontSize: 11, color: '#906070' }}>
            Arraste um retrato até outro para criar uma relação · Clique para editar
          </span>
        </div>
      )}

      {/* Canvas */}
      <div ref={canvasRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {membros.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <GitBranch size={40} style={{ color: '#D0C0C4' }} />
            <p style={{ fontSize: 14, color: '#906070', margin: 0 }}>Nenhum membro na árvore ainda.</p>
            <p style={{ fontSize: 12, color: '#B09098', margin: 0, textAlign: 'center', maxWidth: 280 }}>
              Adicione pessoas e depois arraste uma até a outra para criar as conexões.
            </p>
            <button
              onClick={e => { e.stopPropagation(); setCreateOpen(true) }}
              style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, background: '#800020', color: '#FAF0F2', border: 'none', fontSize: 13, cursor: 'pointer' }}
            >
              <Plus size={13} /> Criar primeira pessoa
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative', width: tree.w, height: tree.h, minWidth: '100%', minHeight: '100%' }}>
            {/* SVG lines */}
            <svg style={{ position: 'absolute', inset: 0, width: tree.w, height: tree.h, overflow: 'visible', pointerEvents: 'none' }}>
              {tree.lines.map(l => (
                <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke="#800020" strokeWidth="1.2" opacity="0.30" strokeLinecap="round" />
              ))}
            </svg>

            {/* Portraits */}
            {tree.nodes.map(n => (
              <div
                key={n.key}
                style={{ position: 'absolute', left: n.cx - R, top: n.ty, width: D, zIndex: popover?.memberId === n.key ? 20 : 1 }}
              >
                <Portrait
                  m={n.m}
                  isDragging={draggingId === n.key}
                  isTarget={targetId === n.key}
                  onMouseDown={e => onPortraitMouseDown(n.key, e)}
                  onClick={() => {/* handled in onMouseDown+mouseup cycle */}}
                />
              </div>
            ))}

            {/* Click overlay for popover (separate from drag to avoid conflicts) */}
            {tree.nodes.map(n => (
              <div
                key={`click-${n.key}`}
                style={{ position: 'absolute', left: n.cx - R, top: n.ty, width: D, height: D + NH, zIndex: 2, cursor: 'pointer' }}
                onClick={e => onPortraitClick(n, e)}
              />
            ))}

            {/* Popover */}
            {popover && (() => {
              const m = membros.find(m => m.id === popover.memberId)
              if (!m) return null
              return (
                <ClickPopover
                  m={m}
                  x={popover.x}
                  y={popover.y}
                  onEdit={() => setEditMembro(m)}
                  onDelete={() => deleteMembro(m.id)}
                  onClose={() => setPopover(null)}
                />
              )
            })()}
          </div>
        )}
      </div>

      {/* Modals */}
      {createOpen && (
        <MembroModal
          title="Adicionar pessoa à árvore"
          personagens={personagensDisponiveis}
          onSave={createMembro}
          onCancel={() => setCreateOpen(false)}
          saving={savingMembro}
        />
      )}

      {editMembro && (
        <MembroModal
          title={`Editar — ${editMembro.nome}`}
          initial={editMembro}
          personagens={personagens.filter(p => !membros.find(m => m.personagem_id === p.id && m.id !== editMembro.id))}
          onSave={updateMembro}
          onCancel={() => setEditMembro(null)}
          saving={savingMembro}
        />
      )}

      {relPicker && sourceM && targetM && (
        <RelPicker
          sourceM={sourceM}
          targetM={targetM}
          onConfirm={addRelacao}
          onCancel={() => setRelPicker(null)}
          saving={savingRel}
        />
      )}
    </div>
  )
}
