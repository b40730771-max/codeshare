'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  postId: string
  userId: string
  onUpload?: () => void
}

type FileItem = {
  file: File
  folder: string
}

export default function FileUpload({ postId, userId, onUpload }: Props) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const folderRef = useRef<HTMLInputElement>(null)

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>, folder = '/') => {
    const selected = Array.from(e.target.files || [])
    const items = selected.map(f => ({
      file: f,
      folder: (f as any).webkitRelativePath
        ? '/' + (f as any).webkitRelativePath.split('/').slice(0, -1).join('/')
        : folder
    }))
    setFiles(prev => [...prev, ...items])
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const upload = async () => {
    if (files.length === 0) return
    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const { file, folder } = files[i]
      const path = `${postId}/${folder}/${file.name}`.replace(/\/+/g, '/')

      await supabase.storage.from('code-files').upload(path, file, { upsert: true })
      await supabase.from('post_files').insert({
        post_id: postId,
        user_id: userId,
        name: file.name,
        path,
        size: file.size,
        type: file.type || 'text/plain',
        folder
      })
      setProgress(Math.round(((i + 1) / files.length) * 100))
    }

    setFiles([])
    setProgress(0)
    setUploading(false)
    onUpload?.()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text)' }}>📎 파일 첨부</h3>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        {/* 파일 선택 */}
        <input ref={fileRef} type="file" multiple onChange={e => handleFiles(e)} style={{ display: 'none' }} />
        <button onClick={() => fileRef.current?.click()} style={btnStyle}>
          📄 파일 선택
        </button>

        {/* 폴더 선택 */}
        <input ref={folderRef} type="file" multiple onChange={e => handleFiles(e, '/folder')}
          style={{ display: 'none' }}
          {...{ webkitdirectory: '', directory: '' } as any}
        />
        <button onClick={() => folderRef.current?.click()} style={btnStyle}>
          📁 폴더 선택
        </button>
      </div>

      {/* 파일 목록 */}
      {files.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '8px' }}>
            선택된 파일 {files.length}개
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
            {files.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--bg)', padding: '8px 12px', borderRadius: '6px',
                border: '1px solid var(--border)'
              }}>
                <div>
                  <span style={{ color: 'var(--text)', fontSize: '0.875rem' }}>{item.file.name}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginLeft: '8px' }}>
                    {item.folder !== '/' && item.folder} · {formatSize(item.file.size)}
                  </span>
                </div>
                <button onClick={() => removeFile(idx)} style={{
                  background: 'none', border: 'none', color: '#f87171',
                  cursor: 'pointer', fontSize: '0.875rem', padding: '0 4px'
                }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 업로드 진행바 */}
      {uploading && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ background: 'var(--border)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{ background: '#6366f1', height: '100%', width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{progress}% 업로드 중...</p>
        </div>
      )}

      {files.length > 0 && !uploading && (
        <button onClick={upload} style={{ ...btnStyle, background: '#6366f1', width: '100%' }}>
          업로드 ({files.length}개)
        </button>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'var(--bg)', border: '1px solid var(--border)',
  color: 'var(--text)', padding: '8px 16px', borderRadius: '8px',
  cursor: 'pointer', fontSize: '0.875rem'
}
