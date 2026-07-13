import { Star } from 'lucide-react'
import { LANDING_REVIEWS, LANDING_REVIEWS_TRUST_LINE } from '@/content/marketing/reviews'

function Stars() {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

export function LandingReviewsSection() {
  return (
    <section id="recenze" className="bg-white border-t border-gray-100 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
            Recenze uživatelů
          </p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Co říkají ti, kdo faktury zpracovávají každý den
          </h2>
          <p className="text-gray-600 leading-relaxed">{LANDING_REVIEWS_TRUST_LINE}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LANDING_REVIEWS.map((review) => (
            <article
              key={review.name}
              className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50 p-6"
            >
              <Stars />
              <span className="mt-4 inline-flex w-fit rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {review.highlight}
              </span>
              <blockquote className="mt-4 flex-1 text-sm text-gray-700 leading-relaxed">
                „{review.quote}“
              </blockquote>
              <footer className="mt-5 pt-4 border-t border-gray-200">
                <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{review.role}</p>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
