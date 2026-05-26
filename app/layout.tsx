import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/lib/theme'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CodeShare',
  description: '코드를 공유하고 아이디어를 나누세요',
  verification: {
    google: 'bQddY3W62scoVWtSY6k2KtSgIQt3MXYRC7iLXDxLQlQ',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ThemeProvider>
          <Navbar />
          <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
            {children}
          </main>
          <footer style={{
            textAlign: 'center', padding: '2rem',
            color: 'var(--text-dim)', borderTop: '1px solid var(--border)',
            marginTop: '4rem'
          }}>
            © 2025 CodeShare — 코드를 나누면 더 커집니다
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
