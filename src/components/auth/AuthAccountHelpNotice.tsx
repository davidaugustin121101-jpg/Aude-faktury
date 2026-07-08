import { LEGAL_EMAIL } from '@/lib/legal'

type Props = {
  variant: 'login' | 'register'
}

export function AuthAccountHelpNotice({ variant }: Props) {
  const subject =
    variant === 'login'
      ? 'Obnovení hesla – Faktury Audeflow'
      : 'Registrace / přístup k účtu – Faktury Audeflow'

  const intro =
    variant === 'login'
      ? 'Obnovení hesla zatím neposíláme automaticky.'
      : 'Potvrzovací e-mail z registrace zatím nemusí dorazit.'

  return (
    <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 leading-relaxed">
      {intro} Napište nám na{' '}
      <a
        href={`mailto:${LEGAL_EMAIL}?subject=${encodeURIComponent(subject)}`}
        className="font-semibold text-amber-950 underline underline-offset-2"
      >
        {LEGAL_EMAIL}
      </a>{' '}
      — pomůžeme vám :)
    </p>
  )
}
