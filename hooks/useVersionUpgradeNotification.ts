'use client'

import { useEffect, useState } from 'react'

const CLIENT_APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? ''

export function useVersionUpgradeNotification(): boolean {
  const [versionStale, setVersionStale] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkVersion = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' })
        if (!res.ok) return
        const serverVersion = res.headers.get('X-App-Version')
        if (
          isMounted
          && serverVersion
          && CLIENT_APP_VERSION
          && serverVersion !== CLIENT_APP_VERSION
        ) {
          setVersionStale(true)
        }
      } catch {
        // ignore transient network errors
      }
    }

    void checkVersion()
    const interval = setInterval(checkVersion, 30_000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return versionStale
}
