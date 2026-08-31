import { useEffect, useRef, useState } from 'react'
import { type ChatMessage, runAgentTurn } from '../runtime/openai'
import { allTools, type ToolContext } from '../tools'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'

const KEY_STORAGE = 'enclave.openai.key'
const MODEL_STORAGE = 'enclave.openai.model'

const MODELS = [
  { id: 'gpt-5', label: 'GPT-5 — most capable' },
  { id: 'gpt-5-mini', label: 'GPT-5 mini — faster, cheaper' },
  { id: 'gpt-4.1', label: 'GPT-4.1' },
  { id: 'gpt-4o', label: 'GPT-4o' },
]
const CUSTOM = '__custom__'

const SUGGESTIONS = [
  'Which region underperformed in 2025, and when?',
  'EMEA fell in March. Find the cause and fix it.',
  'What is below its reorder level right now?',
]

const read = (k: string, fallback = '') => {
  try {
    return localStorage.getItem(k) ?? fallback
  } catch {
    return fallback
  }
}
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* private mode: the choice just does not persist */
  }
}

export function AgentPanel({ ctx }: { ctx: ToolContext }) {
  const [apiKey, setApiKey] = useState(() => read(KEY_STORAGE))
  const [draftKey, setDraftKey] = useState('')
  const [model, setModel] = useState(() => read(MODEL_STORAGE, 'gpt-5'))
  const [custom, setCustom] = useState(() => !MODELS.some((m) => m.id === read(MODEL_STORAGE, 'gpt-5')))
  const [messages, setMessages] = useState<ChatMessage[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [thread, setThread] = useState<any[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [nudge, setNudge] = useState(false)

  const keyField = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [messages, busy])

  function connect() {
    const trimmed = draftKey.trim()
    if (!trimmed) return
    setApiKey(trimmed)
    write(KEY_STORAGE, trimmed)
    setDraftKey('')
    setNudge(false)
  }

  function chooseModel(id: string) {
    if (id === CUSTOM) {
      setCustom(true)
      return
    }
    setCustom(false)
    setModel(id)
    write(MODEL_STORAGE, id)
  }

  /** Without a key there is nothing to send — say so instead of doing nothing. */
  function requireKey(): boolean {
    if (apiKey) return true
    setNudge(true)
    keyField.current?.focus()
    return false
  }

  async function send(text: string) {
    if (!text.trim() || busy) return
    if (!requireKey()) return

    setDraft('')
    setMessages((m) => [...m, { role: 'user', text }])
    setBusy('thinking')
    try {
      const next = [...thread, { role: 'user', content: text }]
      const result = await runAgentTurn({
        apiKey,
        model,
        input: next,
        ctx,
        onToolCall: (n) => setBusy(n),
      })
      setThread(result.input)
      setMessages((m) => [...m, { role: 'assistant', text: result.text }])
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: `Error: ${e instanceof Error ? e.message : String(e)}` },
      ])
    } finally {
      setBusy(null)
    }
  }

  const masked = apiKey ? `${apiKey.slice(0, 3)}…${apiKey.slice(-4)}` : ''

  return (
    <div className="flex h-full flex-col">
      {apiKey ? (
        <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          <Select
            value={custom ? CUSTOM : model}
            onChange={(e) => chooseModel(e.target.value)}
            className="w-40"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id}
              </option>
            ))}
            <option value={CUSTOM}>Other…</option>
          </Select>
          {custom && (
            <Input
              value={model}
              aria-label="Model name"
              placeholder="model id"
              onChange={(e) => {
                setModel(e.target.value)
                write(MODEL_STORAGE, e.target.value)
              }}
              className="w-28"
            />
          )}
          <span className="ml-auto shrink-0 font-mono text-[10px] text-neutral-400">{masked}</span>
          <button
            onClick={() => {
              setApiKey('')
              write(KEY_STORAGE, '')
            }}
            className="shrink-0 text-[10px] text-neutral-400 transition hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div
          className={`m-3 rounded-lg border p-3 transition ${
            nudge
              ? 'border-amber-500/60 bg-amber-50 dark:bg-amber-500/5'
              : 'border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <h3 className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
            Connect an agent
          </h3>
          <p className="pt-1 text-[11px] leading-relaxed text-neutral-500">
            {nudge
              ? 'Add a key first — then that question goes straight to the agent.'
              : 'This browser has no WebMCP, so use your own OpenAI key. It stays in this browser and goes only to api.openai.com.'}
          </p>

          <div className="space-y-2 pt-2.5">
            <Input
              ref={keyField}
              type="password"
              placeholder="sk-…"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && connect()}
            />
            <div className="flex gap-2">
              <Select
                value={custom ? CUSTOM : model}
                onChange={(e) => chooseModel(e.target.value)}
                className="flex-1"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
                <option value={CUSTOM}>Other…</option>
              </Select>
              <Button onClick={connect} disabled={!draftKey.trim()}>
                Connect
              </Button>
            </div>
            {custom && (
              <Input
                value={model}
                aria-label="Model name"
                placeholder="Model id, e.g. o4-mini"
                onChange={(e) => {
                  setModel(e.target.value)
                  write(MODEL_STORAGE, e.target.value)
                }}
              />
            )}
          </div>
        </div>
      )}

      <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2 text-sm">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
              Try asking
            </p>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s}
                data-tour={i === 0 ? 'suggestion' : undefined}
                onClick={() => send(s)}
                className="group flex w-full items-start gap-2 rounded-md border border-neutral-200
                  px-2.5 py-2 text-left text-xs text-neutral-600 transition hover:border-neutral-400
                  hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800
                  dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-900
                  dark:hover:text-neutral-100"
              >
                <span className="pt-px text-neutral-300 transition group-hover:text-neutral-500 dark:text-neutral-700">
                  ›
                </span>
                <span className="flex-1">{s}</span>
              </button>
            ))}
            <p className="pt-1 text-[11px] leading-relaxed text-neutral-400">
              Whichever agent you use, it works through the same {allTools.length} tools this page
              registers — it never receives a row of your data, and anything that changes the
              business waits for your approval.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i}>
            <div className="mb-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
              {m.role === 'user' ? 'You' : 'Agent'}
            </div>
            <div
              className={
                m.role === 'user'
                  ? 'text-neutral-900 dark:text-neutral-100'
                  : 'whitespace-pre-wrap text-neutral-600 dark:text-neutral-300'
              }
            >
              {m.text}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
            {busy === 'thinking' ? 'thinking…' : `running ${busy}…`}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800">
        <Input
          value={draft}
          placeholder={apiKey ? 'Ask about the store' : 'Connect a key to ask'}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(draft)}
        />
        <Button onClick={() => send(draft)} disabled={Boolean(busy)}>
          Send
        </Button>
      </div>
    </div>
  )
}
