'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export function SubscriptionBillingFeedback() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const cancelled = searchParams.get('cancelled')
    const credits = searchParams.get('credits')
    const upgraded = searchParams.get('upgraded')
    const addon = searchParams.get('addon')

    if (cancelled === '1') {
      toast.info('Platba byla zrušena.')
      router.replace('/settings/predplatne', { scroll: false })
      return
    }

    if (credits === '1') {
      router.replace('/settings/predplatne', { scroll: false })
      toast.success('Balíček 100 faktur zakoupen — kredity se připíší během chvíle.')
      setTimeout(() => router.refresh(), 2500)
      return
    }

    if (upgraded !== '1' && addon !== '1') return

    router.replace('/settings/predplatne', { scroll: false })

    async function syncAfterPayment() {
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const res = await fetch('/api/stripe/sync', { method: 'POST' })
          const data = await res.json()

          if (data.activated) {
            toast.success(
              addon === '1' ? 'Modul více klientů aktivován!' : 'Tarif Pro aktivován!'
            )
            router.refresh()
            return
          }

          if (data.pending) {
            toast.info(
              'Platba se zpracovává (bankovní převod). Režim se aktivuje po připsání na účet Stripe — obvykle 1–2 pracovní dny.'
            )
            return
          }
        } catch {
          // retry
        }
        await new Promise((r) => setTimeout(r, 2000))
      }

      toast.warning(
        'Platba proběhla, ale režim se zatím neaktivoval. Obnovte stránku za chvíli, nebo kontaktujte podporu.'
      )
    }

    syncAfterPayment()
  }, [searchParams, router])

  return null
}
