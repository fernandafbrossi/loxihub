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
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  function RichTextEditor({ value, onChange, onSubmit, placeholder, style, className }, ref) {
    const divRef = useRef<HTMLDivElement>(null)
    const composing = useRef(false)

    useImperativeHandle(ref, () => ({
      focus: () => divRef.current?.focus(),
      applyFormat: (marker: string) => {
        const el = divRef.current
        if (!el) return
        el.focus()
        const sel = window.getSelection()
        const selected = sel?.rangeCount ? sel.getRangeAt(0).toString() : ''
        document.execCommand('insertText', false, marker + selected + marker)
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
