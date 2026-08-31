import { useStore } from '../store/store'
import { useTheme } from '../store/theme'
import { Menu } from './ui/Menu'

const MODEL_STORAGE = 'enclave.openai.model'
const KEY_STORAGE = 'enclave.openai.key'

export function SettingsMenu() {
  const budget = useStore((s) => s.resultBudget)
  const setResultBudget = useStore((s) => s.setResultBudget)
  const theme = useTheme((s) => s.theme)
  const setTheme = useTheme((s) => s.setTheme)

  return (
    <Menu label="Settings" width="w-80">
      {() => (
        <div className="space-y-3 p-1">
          <section>
            <h4 className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Result budget
            </h4>
            <p className="pt-1 text-[11px] leading-relaxed text-neutral-500">
              The hard cap on what any single tool result can carry out of this browser. Lower it
              and the agent must aggregate harder.
            </p>
            <div className="flex gap-2 pt-1.5">
              <label className="flex-1 text-[11px] text-neutral-500">
                Max rows
                <input
                  type="number"
                  value={budget.maxRows}
                  min={1}
                  max={500}
                  onChange={(e) =>
                    setResultBudget({ ...budget, maxRows: Number(e.target.value) })
                  }
                  className="mt-0.5 w-full rounded-md border border-neutral-300 bg-white px-2 py-1
                    text-xs tabular-nums outline-none dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>
              <label className="flex-1 text-[11px] text-neutral-500">
                Max bytes
                <input
                  type="number"
                  value={budget.maxBytes}
                  min={256}
                  max={32768}
                  step={256}
                  onChange={(e) =>
                    setResultBudget({ ...budget, maxBytes: Number(e.target.value) })
                  }
                  className="mt-0.5 w-full rounded-md border border-neutral-300 bg-white px-2 py-1
                    text-xs tabular-nums outline-none dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>
            </div>
          </section>

          <section className="border-t border-neutral-200 pt-2 dark:border-neutral-800">
            <h4 className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Appearance
            </h4>
            <div className="flex gap-1 pt-1.5">
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 rounded-md border px-2 py-1 text-xs capitalize transition ${
                    theme === t
                      ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                      : 'border-neutral-200 text-neutral-500 dark:border-neutral-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section className="border-t border-neutral-200 pt-2 dark:border-neutral-800">
            <h4 className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Built-in agent
            </h4>
            <p className="pt-1 text-[11px] text-neutral-500">
              Model: <code>{localStorage.getItem(MODEL_STORAGE) ?? 'gpt-5'}</code>
            </p>
            <button
              onClick={() => {
                localStorage.removeItem(KEY_STORAGE)
                location.reload()
              }}
              className="pt-1 text-[11px] text-neutral-500 underline hover:text-neutral-900
                dark:hover:text-neutral-100"
            >
              Forget my API key
            </button>
          </section>
        </div>
      )}
    </Menu>
  )
}
