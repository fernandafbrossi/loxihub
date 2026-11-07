'use client'

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

// ── Renderização markdown → HTML ──────────────────────────────────────────────

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function mkr(s: string) {
  // marcador com cor desbotada e sem estilo próprio para não herdar do pai
  return `<span data-m style="color:rgba(46,5,16,0.28);font-weight:normal;font-style:normal;text-decoration:none">${esc(s)}</span>`
}

function renderLine(line: string): string {
  let out = ''
  let rem = line
  while (rem.length > 0) {
    const bold = rem.match(/^\*\*((?:[^*]|\*(?!\*))+?)\*\*/)
    if (bold) {
      out += mkr('**') + `<strong>${renderLine(bold[1])}</strong>` + mkr('**')
      rem = rem.slice(bold[0].length); continue
    }
    const italic = rem.match(/^\*([^*\n]+?)\*(?!\*)/)
    if (italic) {
      out += mkr('*') + `<em>${renderLine(italic[1])}</em>` + mkr('*')
      rem = rem.slice(italic[0].length); continue
    }
    const under = rem.match(/^__((?:[^_]|_(?!_))+?)__/)
    if (under) {
      out += mkr('__') + `<u>${renderLine(under[1])}</u>` + mkr('__')
      rem = rem.slice(under[0].length); continue
    }
    const strike = rem.match(/^~~((?:[^~]|~(?!~))+?)~~/)
    if (strike) {
      out += mkr('~~') + `<del>${renderLine(strike[1])}</del>` + mkr('~~')
      rem = rem.slice(strike[0].length); continue
    }
    out += esc(rem[0]); rem = rem.slice(1)
  }
  return out
}

function toHtml(text: string) {
  return text.split('\n').map(renderLine).join('<br>')
}

// ── Utilitários de cursor ─────────────────────────────────────────────────────

function getPlain(el: HTMLElement): string {
  let text = ''
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent ?? ''
    else if ((node as Element).tagName === 'BR') text += '\n'
    else node.childNodes.forEach(walk)
  }
  walk(el)
  return text
}

function saveCaret(el: HTMLElement): number {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return 0
  const { endContainer, endOffset } = sel.getRangeAt(0)
  let offset = 0
  let found = false
  const walk = (node: Node) => {
    if (found) return
    if (node === endContainer) { offset += endOffset; found = true; return }
    if (node.nodeType === Node.TEXT_NODE) offset += node.textContent?.length ?? 0
    else if ((node as Element).tagName === 'BR') offset += 1
    else node.childNodes.forEach(walk)
  }
  walk(el)
  return offset
}

function restoreCaret(el: HTMLElement, target: number) {
  const sel = window.getSelection()
  if (!sel) return
  let rem = target
  let found: { node: Node; off: number } | null = null
  const walk = (node: Node) => {
    if (found) return
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0
      if (rem <= len) { found = { node, off: rem }; return }
      rem -= len
    } else if ((node as Element).tagName === 'BR') {
      if (rem === 0) {
        const idx = Array.from(node.parentNode!.childNodes).indexOf(node as ChildNode)
        found = { node: node.parentNode!, off: idx }; return
      }
      rem -= 1
    } else node.childNodes.forEach(walk)
  }
  walk(el)
  const pos = found ?? { node: el, off: el.childNodes.length }
  try {
    const range = document.createRange()
    range.setStart(pos.node, pos.off)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  } catch {}
}

// ── Seleção por offsets de texto puro ─────────────────────────────────────────

function plainLen(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent?.length ?? 0
  if ((node as Element).tagName === 'BR') return 1
  let n = 0
  node.childNodes.forEach(c => { n += plainLen(c) })
  return n
}

function offsetOf(el: HTMLElement, container: Node, off: number): number {
  let total = 0
  let found = false
  const walk = (node: Node) => {
    if (found) return
    if (node === container) {
      if (node.nodeType === Node.TEXT_NODE) total += off
      else for (let i = 0; i < off; i++) total += plainLen(node.childNodes[i])
      found = true
      return
    }
    if (node.nodeType === Node.TEXT_NODE) total += node.textContent?.length ?? 0
    else if ((node as Element).tagName === 'BR') total += 1
    else node.childNodes.forEach(walk)
  }
  walk(el)
  return total
}

function getSelOffsets(el: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return null
  const r = sel.getRangeAt(0)
  if (!el.contains(r.startContainer) || !el.contains(r.endContainer)) return null
  return { start: offsetOf(el, r.startContainer, r.startOffset), end: offsetOf(el, r.endContainer, r.endOffset) }
}

function locate(el: HTMLElement, target: number): { node: Node; off: number } {
  let rem = target
  let found: { node: Node; off: number } | null = null
  const walk = (node: Node) => {
    if (found) return
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0
      if (rem <= len) { found = { node, off: rem }; return }
      rem -= len
    } else if ((node as Element).tagName === 'BR') {
      if (rem === 0) {
        const idx = Array.from(node.parentNode!.childNodes).indexOf(node as ChildNode)
        found = { node: node.parentNode!, off: idx }; return
      }
      rem -= 1
    } else node.childNodes.forEach(walk)
  }
  walk(el)
  return found ?? { node: el, off: el.childNodes.length }
}

function setSelOffsets(el: HTMLElement, start: number, end: number) {
  const sel = window.getSelection()
  if (!sel) return
  try {
    const a = locate(el, start)
    const b = start === end ? a : locate(el, end)
    const range = document.createRange()
    range.setStart(a.node, a.off)
    range.setEnd(b.node, b.off)
    sel.removeAllRanges()
    sel.addRange(range)
  } catch {}
}

// ── Lógica de formatação (liga/desliga) ───────────────────────────────────────

function runLen(text: string, from: number, dir: 1 | -1, ch: string): number {
  let n = 0
  for (let i = from; i >= 0 && i < text.length && text[i] === ch; i += dir) n++
  return n
}

function runOk(marker: string, k: number): boolean {
  return marker === '*' ? k % 2 === 1 : k >= marker.length
}

type WrapState = 'outer' | 'inner' | null

function wrapState(text: string, start: number, end: number, marker: string): WrapState {
  const ch = marker[0]
  const outer = Math.min(runLen(text, start - 1, -1, ch), runLen(text, end, 1, ch))
  if (runOk(marker, outer)) return 'outer'
  const sel = text.slice(start, end)
  if (sel.length >= marker.length * 2) {
    const inner = Math.min(runLen(sel, 0, 1, ch), runLen(sel, sel.length - 1, -1, ch))
    if (runOk(marker, inner)) return 'inner'
  }
  return null
}

const ALL_MARKERS = ['**', '*', '__', '~~']

function activeMarkers(text: string, start: number, end: number): string[] {
  return ALL_MARKERS.filter(m => wrapState(text, start, end, m) !== null)
}

function toggleMarker(text: string, start: number, end: number, m: string) {
  const state = wrapState(text, start, end, m)
  const ml = m.length
  const selected = text.slice(start, end)
  if (state === 'outer') {
    return {
      text: text.slice(0, start - ml) + selected + text.slice(end + ml),
      start: start - ml,
      end: end - ml,
    }
  }
  if (state === 'inner') {
    const inside = selected.slice(ml, selected.length - ml)
    return { text: text.slice(0, start) + inside + text.slice(end), start, end: start + inside.length }
  }
  const out = text.slice(0, start) + m + selected + m + text.slice(end)
  return start === end
    ? { text: out, start: start + ml, end: start + ml }
    : { text: out, start: start + ml, end: end + ml }
}

// ── Componente ────────────────────────────────────────────────────────────────

export interface RichTextEditorHandle {
  focus: () => void
  applyFormat: (marker: string) => void
}

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  placeholder?: string
  style?: React.CSSProperties
  className?: string
  onFocusChange?: (focused: boolean) => void
  onActiveFormatsChange?: (markers: string[]) => void
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  function RichTextEditor({ value, onChange, onSubmit, placeholder, style, className, onFocusChange, onActiveFormatsChange }, ref) {
    const divRef = useRef<HTMLDivElement>(null)
    const composing = useRef(false)
    const lastSel = useRef<{ start: number; end: number } | null>(null)
    const lastFormats = useRef('')

    function reportFormats(el: HTMLElement, sel: { start: number; end: number }) {
      if (!onActiveFormatsChange) return
      const active = activeMarkers(getPlain(el), sel.start, sel.end)
      const key = active.join('|')
      if (key !== lastFormats.current) {
        lastFormats.current = key
        onActiveFormatsChange(active)
      }
    }

    useEffect(() => {
      function onSelChange() {
        const el = divRef.current
        if (!el) return
        const sel = getSelOffsets(el)
        if (!sel) return
        lastSel.current = sel
        reportFormats(el, sel)
      }
      document.addEventListener('selectionchange', onSelChange)
      return () => document.removeEventListener('selectionchange', onSelChange)
    })

    useImperativeHandle(ref, () => ({
      focus: () => divRef.current?.focus(),
      applyFormat: (marker: string) => {
        const el = divRef.current
        if (!el) return
        const text = getPlain(el)
        const wasFocused = document.activeElement === el
        const current = wasFocused ? getSelOffsets(el) : null
        const sel = current ?? lastSel.current ?? { start: text.length, end: text.length }
        const start = Math.min(sel.start, text.length)
        const end = Math.min(sel.end, text.length)
        if (!wasFocused) el.focus()
        const next = toggleMarker(text, start, end, marker)
        el.innerHTML = next.text ? toHtml(next.text) : ''
        setSelOffsets(el, next.start, next.end)
        lastSel.current = { start: next.start, end: next.end }
        reportFormats(el, lastSel.current)
        onChange(next.text)
      },
    }))

    // Sincroniza quando o valor muda externamente (ex: limpar após envio)
    useEffect(() => {
      const el = divRef.current
      if (!el) return
      if (getPlain(el) !== value) {
        el.innerHTML = value ? toHtml(value) : ''
      }
    }, [value])

    function rerender() {
      const el = divRef.current
      if (!el) return
      const caret = saveCaret(el)
      const text = getPlain(el)
      el.innerHTML = text ? toHtml(text) : ''
      restoreCaret(el, caret)
      onChange(text)
    }

    function handleKeyDown(e: React.KeyboardEvent) {
      if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); onSubmit(); return }
      if (e.key === 'Enter') { e.preventDefault(); document.execCommand('insertText', false, '\n') }
    }

    function handlePaste(e: React.ClipboardEvent) {
      e.preventDefault()
      document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
    }

    return (
      <div className="relative w-full">
        {!value && placeholder && (
          <span
            aria-hidden
            className="absolute top-0 left-0 pointer-events-none select-none"
            style={{ color: 'rgba(144,96,112,0.55)', fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', whiteSpace: 'pre' }}
          >
            {placeholder}
          </span>
        )}
        <div
          ref={divRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => { if (!composing.current) rerender() }}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => { composing.current = true }}
          onCompositionEnd={() => { composing.current = false; rerender() }}
          className={className}
          style={{
            outline: 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            cursor: 'text',
            minHeight: '1.5rem',
            maxHeight: '16rem',
            overflowY: 'auto',
            ...style,
          }}
        />
      </div>
    )
  }
)
