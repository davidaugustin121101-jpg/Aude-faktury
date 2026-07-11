'use client'

import { useEffect } from 'react'

export default function DashboardLoading() {
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7711/ingest/3cd4d8f4-c62c-4feb-9280-e257beb22e7d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '20dbe5' },
      body: JSON.stringify({
        sessionId: '20dbe5',
        hypothesisId: 'H4',
        location: 'loading.tsx:mount',
        message: 'dashboard loading skeleton visible',
        data: { path: window.location.pathname },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
  }, [])

  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="h-9 w-9 bg-gray-100 rounded-lg" />
            <div className="h-7 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-white rounded-xl border border-gray-200" />
        ))}
      </div>
    </div>
  )
}
