'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type FileItem = {
  id: string
  name: string
  path: string
  size: number
  type: string
  folder: string
  created_at: string
}

type Props = {
  postId: string
  isOwner: boolean
  onRefresh?: () => void
}

export default function FileList({ postId, isOwner, onRefresh }: Props) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))

  useEffect(() => {
    fetchFiles()
  }, [postId])

  const fetchFiles = async () => {
    const { data } = await supabase
      .from('post_files')
      .select('*')
      .eq('post_id', postId)
      .order('folder', { ascending: true })
      .order('name', { ascending: true })
    setFiles(data || [])
    setLoading(false)
  }

  const deleteFile = async (file: FileItem) => {
    if (!confirm(`"${file.name}" 파일을 삭제할까요?`)) return
    await supabase.storage.from('code-files').remove([file.path])
    await supabase.from('post_files').delete().eq('id', file.id)
    fetchFiles()
    onRefresh?.()
  }

  const downloadFile = async (file: FileItem) => {
    const { data } = await supabase.storage.from('code-files').download(file.path)
    if (!data) return
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    const icons: Record<string, string> = {
      js: '🟨', ts: '🟦', py: '🐍', rs: '🦀', go: '🐹',
      css: '🎨', html: '🌐', c: '⚙️', cpp: '⚙️', java: '☕',
      json: '📋', md: '📝', txt: '📄', png: '🖼️', jpg: '🖼️',
      gif: '🖼️', pdf: '📕', zip: '🗜️'
    }
    return icons[ext || ''] || '📄'
  }

  // 폴더별로 그룹핑
  const grouped = files.reduce((acc, file) => {
    const folder = file.folder || '/'
    if (!acc[folder]) acc[folder] = []
    acc[folder].push(file)
    return acc
  }, {} as Record<string, FileItem[]>)

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folder)) next.delete(folder)
      else next.add(folder)
      return next
    })
  }

  if (loading) return null
  if (files.length === 0) return null

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text)' }}>
        📁 첨부 파일 ({files.length})
      </h3>

      {Object.entries(grouped).map(([folder, folderFiles]) => (
        <div key={folder} style={{ marginBottom: '8px' }}>
          {/* 폴더 헤더 */}
          {folder !== '/' && (
            <button onClick={() => toggleFolder(folder)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '0.875rem', padding: '6px 0',
              display: 'flex', alignItems: 'center', gap: '6px', width: '100%', textAlign: 'left'
            }}>
              {expandedFolders.has(folder) ? '📂' : '📁'} {folder.replace('/', '')}
              <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>({folderFiles.length})</span>
            </button>
          )}

          {/* 파일 목록 */}
          {(folder === '/' || expandedFolders.has(folder)) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: folder !== '/' ? '16px' : '0' }}>
              {folderFiles.map(file => (
                <div key={file.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', borderRadius: '6px',
                  background: 'var(--bg)', border: '1px solid var(--border)'
                }}>
                  <span>{getFileIcon(file.name)}</span>
                  <span style={{ flex: 1, color: 'var(--text)', fontSize: '0.875rem' }}>{file.name}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{formatSize(file.size)}</span>
                  <button onClick={() => downloadFile(file)} style={{
                    background: 'none', border: 'none', color: '#6366f1',
                    cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px'
                  }}>⬇️</button>
                  {isOwner && (
                    <button onClick={() => deleteFile(file)} style={{
                      background: 'none', border: 'none', color: '#f87171',
                      cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px'
                    }}>🗑️</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
