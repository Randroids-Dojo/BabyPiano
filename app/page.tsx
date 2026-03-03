'use client'

import { UpdateBanner } from '@/components/UpdateBanner'
import { useVersionUpgradeNotification } from '@/hooks/useVersionUpgradeNotification'

export default function HomePage() {
  const versionStale = useVersionUpgradeNotification()

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#0f172a',
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {versionStale && <UpdateBanner />}
      <div style={{ textAlign: 'center' }}>
        <h1>Baby Piano</h1>
        <p>Simple piano app for kids (landscape mobile target).</p>
      </div>
    </main>
  )
}
