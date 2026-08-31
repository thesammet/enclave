import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TOUR_STEPS, useTour } from '../store/tour'

const PAD = 6
const GAP = 12
const CARD_WIDTH = 330

function useTargetRect(target: string, step: number): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    let raf = 0
    const measure = () => {
      const el = document.querySelector(`[data-tour="${target}"]`)
      setRect(el ? el.getBoundingClientRect() : null)
      raf = requestAnimationFrame(measure)
    }
    // Follow the element rather than sampling once: panels resize as data lands.
    raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [target, step])

  return rect
}

export function Tour() {
  const active = useTour((s) => s.active)
  const step = useTour((s) => s.step)
  const next = useTour((s) => s.next)
  const prev = useTour((s) => s.prev)
  const end = useTour((s) => s.end)

  const current = TOUR_STEPS[step]
  const rect = useTargetRect(current?.target ?? '', step)
  const card = useRef<HTMLDivElement>(null)
  const [cardHeight, setCardHeight] = useState(180)

  useLayoutEffect(() => {
    if (card.current) setCardHeight(card.current.offsetHeight)
  }, [step, active])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') end()
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      if (e.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, next, prev, end])

  if (!active || !current) return null

  // Until the target is measurable, centre the card rather than flashing it
  // into a wrong place.
  const hasRect = rect !== null && rect.width > 0
  const below = hasRect && rect.bottom + GAP + cardHeight < window.innerHeight - 16
  const top = !hasRect
    ? Math.max(16, window.innerHeight / 2 - cardHeight / 2)
    : below
      ? rect.bottom + GAP
      : Math.max(16, rect.top - GAP - cardHeight)
  const left = !hasRect
    ? window.innerWidth / 2 - CARD_WIDTH / 2
    : Math.min(Math.max(16, rect.left), window.innerWidth - CARD_WIDTH - 16)

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* The spotlight: one ring whose enormous shadow dims everything else. */}
      {hasRect ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-white/70 transition-all
            duration-200 dark:ring-white/50"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Clicking the dimmed area leaves the tour. */}
      <button
        aria-label="Close the tour"
        onClick={end}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        ref={card}
        style={{ top, left, width: CARD_WIDTH }}
        className="absolute rounded-xl border border-neutral-200 bg-white p-4 shadow-2xl
          transition-all duration-200 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Step {step + 1} of {TOUR_STEPS.length}
          </span>
          <div className="ml-auto flex gap-1">
            {TOUR_STEPS.map((s, i) => (
              <span
                key={s.target}
                className={`h-1 w-4 rounded-full transition ${
                  i === step
                    ? 'bg-neutral-900 dark:bg-neutral-100'
                    : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>
        </div>

        <h3 className="pt-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {current.title}
        </h3>
        <p className="pt-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          {current.body}
        </p>

        <div className="flex items-center gap-2 pt-4">
          <button
            onClick={end}
            className="text-[11px] text-neutral-400 transition hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Skip
          </button>
          <div className="ml-auto flex gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs transition
                  hover:border-neutral-500 dark:border-neutral-700"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white
                transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900
                dark:hover:bg-white"
            >
              {step === TOUR_STEPS.length - 1 ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
