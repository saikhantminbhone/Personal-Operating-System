import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Saikhant Labs OS', template: '%s | Saikhant Labs OS' },
  description: 'The personal operating system that thinks with you. Goals, tasks, habits, finance, AI — all unified.',
  keywords: ['productivity', 'personal os', 'goals', 'habits', 'ai assistant', 'task manager'],
  authors: [{ name: 'Sai Khant Min Bhone', url: 'https://saikhant.com' }],
  openGraph: {
    title: 'Saikhant Labs OS — Your Personal Operating System',
    description: 'Goals, Tasks, Habits, Finance, Knowledge, AI — unified in one intelligent system.',
    type: 'website',
    url: 'https://saikhantlabs.com',
  },
  twitter: { card: 'summary_large_image', title: 'Saikhant Labs OS', description: 'Your Personal Operating System' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
