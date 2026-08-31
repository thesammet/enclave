import type { Card } from '../../store/types'
import { CardShell } from './CardShell'

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Just enough Markdown for what an agent writes in a finding: bold, inline
 * code, and line breaks. Escaped first, so a note can never inject markup.
 */
function render(markdown: string): string {
  return escape(markdown)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(
      /`(.+?)`/g,
      '<code class="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[11px] dark:bg-neutral-800">$1</code>',
    )
    .replace(/\n/g, '<br />')
}

export function NoteCard({ card }: { card: Card }) {
  return (
    <CardShell id={card.id} title={card.title}>
      <div
        className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
        dangerouslySetInnerHTML={{ __html: render(card.markdown ?? '') }}
      />
    </CardShell>
  )
}
