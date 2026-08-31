import { isWebMcpAvailable } from '../runtime/webmcp'
import { navigate } from '../router'
import { useTour } from '../store/tour'
import { BoardsMenu } from './BoardsMenu'
import { SettingsMenu } from './SettingsMenu'

export function TopBar() {
  const native = isWebMcpAvailable()

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-neutral-200 px-3 dark:border-neutral-800">
      <button
        onClick={() => navigate('/')}
        className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
      >
        Enclave
      </button>

      <span
        title={
          native
            ? 'This browser exposes the WebMCP tool API, so ChatGPT can drive the page directly.'
            : 'No native WebMCP here — the built-in agent panel uses the same tools.'
        }
        className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-2 py-0.5
          text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:border-neutral-800"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${native ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
        {native ? 'WebMCP' : 'Built-in agent'}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={useTour.getState().start}
          title="Show me around"
          aria-label="Show me around"
          className="flex h-6 w-6 items-center justify-center rounded-full border
            border-neutral-300 text-[11px] text-neutral-500 transition hover:border-neutral-500
            hover:text-neutral-900 dark:border-neutral-700 dark:hover:border-neutral-500
            dark:hover:text-neutral-100"
        >
          ?
        </button>
        <BoardsMenu />
        <SettingsMenu />
        <a
          href="https://github.com/thesammet/enclave"
          target="_blank"
          rel="noreferrer"
          className="rounded-md px-2 py-1 text-xs text-neutral-600 transition
            hover:bg-neutral-200/60 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          GitHub
        </a>
      </div>
    </header>
  )
}
