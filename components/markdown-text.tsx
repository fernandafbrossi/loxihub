import React from 'react'

type Segment =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'underline'; content: string }
  | { type: 'strike'; content: string }
  | { type: 'code'; content: string }

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = []
  let remaining = text

  while (remaining.length > 0) {
    const patterns: [RegExp, Segment['type']][] = [
      // Bold: conteúdo pode ter * simples (para itálico aninhado), mas não **
      [/^\*\*((?:[^*]|\*(?!\*))+?)\*\*/, 'bold'],
      // Itálico: conteúdo não pode ter * (evita captura acidental entre dois * não-intencionais)
      [/^\*([^*\n]+?)\*(?!\*)/, 'italic'],
      // Underline: conteúdo pode ter _ simples, mas não __
      [/^__((?:[^_]|_(?!_))+?)__/, 'underline'],
      // Strike: conteúdo pode ter ~ simples, mas não ~~
      [/^~~((?:[^~]|~(?!~))+?)~~/, 'strike'],
      [/^`([^`]+?)`/, 'code'],
    ]

    let matched = false
    for (const [regex, type] of patterns) {
      const match = remaining.match(regex)
      if (match) {
        segments.push({ type, content: match[1] })
        remaining = remaining.slice(match[0].length)
        matched = true
        break
      }
    }

    if (!matched) {
      const last = segments[segments.length - 1]
      if (last?.type === 'text') {
        last.content += remaining[0]
      } else {
        segments.push({ type: 'text', content: remaining[0] })
      }
      remaining = remaining.slice(1)
    }
  }

  return segments
}

function renderSegment(seg: Segment, key: number): React.ReactNode {
  switch (seg.type) {
    case 'bold':
      // Processa o conteúdo do bold recursivamente (permite itálico, underline, etc. dentro)
      return (
        <strong key={key} style={{ fontWeight: 600 }}>
          {parseSegments(seg.content).map((inner, i) => renderSegment(inner, i))}
        </strong>
      )
    case 'italic':
      return <em key={key}>{seg.content}</em>
    case 'underline':
      return (
        <u key={key}>
          {parseSegments(seg.content).map((inner, i) => renderSegment(inner, i))}
        </u>
      )
    case 'strike':
      return (
        <del key={key}>
          {parseSegments(seg.content).map((inner, i) => renderSegment(inner, i))}
        </del>
      )
    case 'code':
      return (
        <code
          key={key}
          style={{
            background: 'rgba(128,0,32,0.08)',
            color: '#5C0018',
            padding: '1px 5px',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: '0.875em',
          }}
        >
          {seg.content}
        </code>
      )
    default:
      return <React.Fragment key={key}>{seg.content}</React.Fragment>
  }
}

interface MarkdownTextProps {
  text: string
  className?: string
  style?: React.CSSProperties
}

export function MarkdownText({ text, className, style }: MarkdownTextProps) {
  const lines = text.split('\n')

  return (
    <span className={className} style={style}>
      {lines.map((line, li) => {
        const segments = parseSegments(line)
        return (
          <React.Fragment key={li}>
            {segments.map((seg, si) => renderSegment(seg, si))}
            {li < lines.length - 1 && <br />}
          </React.Fragment>
        )
      })}
    </span>
  )
}
