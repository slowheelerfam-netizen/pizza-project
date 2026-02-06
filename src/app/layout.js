import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import DemoModeIndicator from '@/components/DemoModeIndicator'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Pizza Admin',
  description: 'Operations dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DemoModeIndicator />
        {children}
      </body>
    </html>
  )
}

