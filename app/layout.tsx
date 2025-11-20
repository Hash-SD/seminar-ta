import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Spreadsheet Reader - Manage Google Sheets',
  description: 'Easily read, manage, and filter Google Sheets data. Perfect for ITERA students to organize and access spreadsheet information efficiently.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

import { RootLayoutWrapper } from './root-layout-wrapper'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <RootLayoutWrapper>
          {children}
        </RootLayoutWrapper>
        <Analytics />
      </body>
    </html>
  )
}
