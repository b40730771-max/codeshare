'use client'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '@/lib/theme'
import { useState } from 'react'

type Props = {
  code: string
  language: string
  preview?: boolean
}

export default function CodeBlock({ code, language, preview = false }: Props) {
  const { theme } = useTheme()
  const [copied, setCopied] = useState(false)

  const displayCode = preview
    ? code.split('\n').slice(0, 3).join('\n') + (code.split('\n').length > 3 ? '\n...' : '')
    : code

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
      {!preview && (
        <button onClick={copy} style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 10,
          background: copied ? '#4ade80' : '#2a2a2a',
          color: copied ? '#000' : '#eee',
          border: 'none', padding: '4px 10px', borderRadius: '6px',
          cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s'
        }}>
          {copied ? '복사됨 ✓' : '복사'}
        </button>
      )}
      <SyntaxHighlighter
        language={language || 'javascript'}
        style={theme === 'dark' ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: '10px',
          fontSize: '0.875rem',
          maxHeight: preview ? '80px' : 'none',
          overflow: preview ? 'hidden' : 'auto',
        }}
        showLineNumbers={!preview}
      >
        {displayCode}
      </SyntaxHighlighter>
    </div>
  )
}
