'use client'

import { useEffect } from 'react'

export function DashboardContentProbe() {
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7711/ingest/3cd4d8f4-c62c-4feb-9280-e257beb22e7d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '20dbe5' },
      body: JSON.stringify({
        sessionId: '20dbe5',
        hypothesisId: 'H3',
        location: 'DashboardContentProbe.tsx:mount',
        message: 'dashboard main content hydrated on client',
        data: { path: window.location.pathname },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
  }, [])

  return null
}
