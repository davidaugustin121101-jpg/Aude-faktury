import Image from 'next/image'
import { Phone } from 'lucide-react'
import { LEGAL_EMAIL, LEGAL_ICO } from '@/lib/legal'
import { TEAM_ABOUT, TEAM_MEMBERS } from '@/content/marketing/team'

export function LandingAboutSection() {
  return (
    <section id="o-nas" className="border-t border-gray-100 bg-gray-50 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">O nás</p>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{TEAM_ABOUT.title}</h2>
            <p className="text-gray-600 leading-relaxed mb-6">{TEAM_ABOUT.description}</p>
            <p className="text-sm text-gray-500">{TEAM_ABOUT.locationNote}</p>
          </div>

          <div className="space-y-6">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.name}
                className="flex items-start gap-4 border-t border-gray-200 pt-6 first:border-t-0 first:pt-0"
              >
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-full border-2 border-gray-200 shadow-sm">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                    sizes="96px"
                  />
                </div>
                <div className="min-w-0 pt-1">
                  <p className="font-semibold text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{member.role}</p>
                  <a
                    href={`tel:${member.phone}`}
                    className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {member.phoneDisplay}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          id="kontakt"
          className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600"
        >
          <div className="space-y-1">
            <p>
              E-mail:{' '}
              <a href={`mailto:${LEGAL_EMAIL}`} className="text-blue-600 hover:text-blue-700 font-medium">
                {LEGAL_EMAIL}
              </a>
            </p>
            <p>IČO: {LEGAL_ICO}</p>
          </div>
          <p className="text-gray-500">© 2026 AUDE FLOW · Všechna práva vyhrazena</p>
        </div>
      </div>
    </section>
  )
}
