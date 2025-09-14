import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SwingVista - Golf Swing Analysis',
  description: 'Real-time golf swing analysis with AI-powered feedback',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">SwingVista</h1>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/" className="text-gray-700 hover:text-gray-900">Dashboard</a>
                <a href="/camera" className="text-gray-700 hover:text-gray-900">Camera</a>
                <a href="/upload" className="text-gray-700 hover:text-gray-900">Upload</a>
                <a href="/compare" className="text-gray-700 hover:text-gray-900">Compare</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}